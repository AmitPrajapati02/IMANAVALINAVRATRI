/**
 * Audit live Razorpay + DB for IMA bundle overcharges (Male Donor @ ₹1,500 in bundle context).
 * Run: node server/src/scripts/audit-ima-donor-overcharges.js [--days=14] [--json]
 *
 * Lists candidates for partial refund; does NOT issue refunds unless --apply-refund is passed
 * (not implemented — manual refund via Razorpay dashboard recommended).
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const { getPool } = require('../services/db');
const { getClient } = require('../services/razorpay');
const { resolveImaRegistrationFee } = require('../services/fees');

const days = parseInt((process.argv.find((a) => a.startsWith('--days=')) || '--days=14').split('=')[1], 10);
const jsonOnly = process.argv.includes('--json');
const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

function correctBundleTotal(lines) {
  return lines.reduce((sum, r) => sum + resolveImaRegistrationFee(r.PlayerType), 0);
}

async function fetchRecentPayments(client) {
  const payments = [];
  let skip = 0;
  const count = 100;
  for (let page = 0; page < 20; page++) {
    const batch = await client.payments.all({ count, skip, from: since.getTime() / 1000 });
    const items = batch.items || [];
    if (!items.length) break;
    payments.push(...items);
    skip += items.length;
    if (items.length < count) break;
  }
  return payments;
}

async function main() {
  const pool = await getPool();
  const sql = require('mssql');
  const client = getClient();

  const dbResult = await pool.request()
    .input('since', sql.DateTime2, since)
    .query(`
    SELECT d.PlayerId AS DonorPlayerId,
           d.TempPlayerNo AS DonorTempNo,
           d.MobileNo,
           d.PlayerType AS DonorType,
           d.FeeAmount AS DonorFeeAmount,
           d.CreatedDate AS RegisterDate,
           m.PlayerId AS MainPlayerId,
           m.TempPlayerNo AS MainTempNo,
           m.PlayerType AS MainType
    FROM Registration d
    INNER JOIN Registration m
      ON m.MobileNo = d.MobileNo
      AND m.PlayerType LIKE '%IMA Member%'
      AND m.PlayerId <> d.PlayerId
    WHERE d.PlayerType = 'Male Donor Player'
      AND d.FeeAmount = 1500
      AND d.CreatedDate >= @since
    ORDER BY d.CreatedDate DESC
  `);

  const donorsWrongFee = dbResult.recordset || [];

  // All registrations on same mobile as IMA member for correct total calc
  const refundList = [];
  for (const row of donorsWrongFee) {
    const bundleRes = await pool.request()
      .input('mobile', sql.VarChar, row.MobileNo)
      .input('since', sql.DateTime2, since)
      .query(`
        SELECT PlayerId, TempPlayerNo, PlayerType, FeeAmount, MobileNo
        FROM Registration
        WHERE MobileNo = @mobile
          AND CreatedDate >= @since
        ORDER BY PlayerId
      `);
    const bundle = bundleRes.recordset || [];
    const imaBundle = bundle.some((b) => (b.PlayerType || '').includes('IMA Member'));
    if (!imaBundle) continue;

    const correctAmount = correctBundleTotal(bundle);
    const chargedAmount = bundle.reduce((s, b) => s + Number(b.FeeAmount || 0), 0);

    // Payment records for this mobile
    let paidTotal = null;
    let razorpayPaymentId = null;
    try {
      const payRes = await pool.request()
        .input('mobile', sql.VarChar, row.MobileNo)
        .query(`
          SELECT TOP 20 p.RazorpayPaymentId, p.Amount, p.Status, r.TempPlayerNo
          FROM Payment p
          INNER JOIN Registration r ON r.PlayerId = p.PlayerId
          WHERE r.MobileNo = @mobile
          ORDER BY p.PlayerId DESC
        `);
      const pays = payRes.recordset || [];
      const success = pays.filter((p) => (p.Status || '').toLowerCase() === 'success');
      if (success.length) {
        paidTotal = success.reduce((s, p) => s + Number(p.Amount || 0), 0);
        razorpayPaymentId = success[0].RazorpayPaymentId;
      }
    } catch {
      // Payment table may differ
    }

    const amountCharged = paidTotal ?? chargedAmount;
    const refundDue = Math.max(0, amountCharged - correctAmount);
    if (refundDue > 0) {
      refundList.push({
        tempNo: row.MainTempNo,
        donorTempNo: row.DonorTempNo,
        mobile: row.MobileNo,
        amountCharged,
        correctAmount,
        refundDue,
        razorpayPaymentId,
        registerDate: row.RegisterDate,
        bundlePlayerIds: bundle.map((b) => b.PlayerId),
      });
    }
  }

  // Razorpay: orders/payments with suspicious totals (not standalone ₹1500 MG)
  const razorpaySuspicious = [];
  try {
    const payments = await fetchRecentPayments(client);
    const byAmount = payments.filter((p) => {
      const inr = Number(p.amount) / 100;
      return p.status === 'captured' && inr >= 1000 && inr % 500 === 0;
    });
    for (const p of byAmount) {
      const inr = Number(p.amount) / 100;
      const receipt = p.order_id || p.id;
      razorpaySuspicious.push({
        razorpayPaymentId: p.id,
        orderId: p.order_id,
        amountInr: inr,
        createdAt: p.created_at,
        email: p.email,
        contact: p.contact,
      });
    }
  } catch (err) {
    razorpaySuspicious.push({ error: err.message });
  }

  const report = {
    auditWindow: { since: since.toISOString(), days },
    dbDonorsWith1500InImaBundle: donorsWrongFee.length,
    refundCandidates: refundList,
    razorpayPaymentsReviewShortlist: razorpaySuspicious.filter((p) => !p.error && [1500, 2000, 2500, 3000, 3500, 3900].includes(p.amountInr)),
    note: 'Process refunds manually in Razorpay dashboard. refundDue = amountCharged - correctAmount for IMA gender-only rule.',
  };

  if (jsonOnly) console.log(JSON.stringify(report, null, 2));
  else {
    console.log('=== IMA Donor Overcharge Audit ===');
    console.log(`Window: since ${since.toISOString()} (${days} days)`);
    console.log(`DB: Male Donor @ ₹1500 in IMA bundle context: ${donorsWrongFee.length} row(s)`);
    console.log('\n--- Refund candidates (if any) ---');
    if (!refundList.length) console.log('None found in DB window.');
    else refundList.forEach((r) => console.log(JSON.stringify(r)));
    console.log('\n--- Razorpay captured payments (₹1500/₹2000/… shortlist) ---');
    const short = report.razorpayPaymentsReviewShortlist;
    if (!short.length) console.log('None in shortlist (or API error).');
    else short.slice(0, 30).forEach((p) => console.log(JSON.stringify(p)));
    if (short.length > 30) console.log(`... and ${short.length - 30} more`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Audit failed:', err.message);
  process.exit(1);
});
