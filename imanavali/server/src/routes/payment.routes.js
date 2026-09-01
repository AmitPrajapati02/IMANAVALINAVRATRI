const express = require('express');
const config = require('../config/env');
const { getRegSession } = require('../middleware/auth');
const { createOrder, verifySignature } = require('../services/razorpay');
const { savePaymentsForBundle, enrichBundlePlayerTypes } = require('../services/registration');
const {
  computeBundleTotal,
  isImaBundleRegistration,
  normalizeBundlePayments,
} = require('../services/fees');
const { getPool, sql } = require('../services/db');
const { insertErrorLog } = require('../services/db');

const router = express.Router();

function isImaBundleSession(session, bundlePayments) {
  if (isImaBundleRegistration(session?.passType)) return true;
  return bundlePayments?.some((line) => isImaBundleRegistration(line.playerType));
}

async function resolveBundlePaymentLines(session) {
  if (!session?.bundlePayments?.length) return [];
  const enriched = await enrichBundlePlayerTypes(session.bundlePayments);
  const imaBundle = isImaBundleSession(session, enriched);
  return normalizeBundlePayments(enriched, imaBundle);
}

async function resolveBundlePaymentAmount(session) {
  const lines = await resolveBundlePaymentLines(session);
  if (lines.length) {
    const imaBundle = isImaBundleSession(session, lines);
    return computeBundleTotal(lines, imaBundle);
  }
  return Number(session?.totalFee) || 0;
}

router.get('/payment', async (req, res) => {
  try {
    const { id, tempNo } = req.query;
    const playerId = Number(id);
    if (!playerId || !tempNo) {
      return res.status(400).json({ error: 'Invalid payment details.' });
    }

    const session = getRegSession(req);
    const feeAmount = await resolveBundlePaymentAmount(session);

    if (!feeAmount || feeAmount <= 0) {
      return res.status(400).json({ error: 'Invalid payment details.' });
    }

    const order = await createOrder(feeAmount, tempNo);
    let contact = '';
    try {
      const p = await getPool();
      const result = await p.request()
        .input('PlayerId', sql.Int, playerId)
        .query('SELECT MobileNo FROM Registration WHERE PlayerId = @PlayerId');
      const mobile = result.recordset?.[0]?.MobileNo?.toString() || '';
      contact = mobile.replace(/\D/g, '').slice(-10);
    } catch {
      contact = (session?.mobile || '').replace(/\D/g, '').slice(-10);
    }

    res.json({
      razorpayKey: config.razorpayKey,
      orderId: order.id,
      amount: feeAmount,
      playerId,
      tempNo,
      contact,
    });
  } catch (err) {
    await insertErrorLog(err.message, err.stack);
    res.status(500).json({ error: `Unable to start payment: ${err.message}` });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { playerId, tempNo, paymentId, orderId, signature } = req.body;
    if (!verifySignature(orderId, paymentId, signature)) {
      return res.json({ success: false, message: 'Signature mismatch' });
    }

    const session = getRegSession(req);
    let bundlePayments = await resolveBundlePaymentLines(session);
    if (!bundlePayments.length) {
      const fallbackFee = Number(req.body.amount) || 0;
      bundlePayments = [{
        playerId: Number(playerId),
        tempNo,
        playerType: '',
        fee: fallbackFee,
      }];
    }

    const imaBundle = isImaBundleSession(session, bundlePayments);
    bundlePayments = normalizeBundlePayments(bundlePayments, imaBundle);
    const totalPaid = computeBundleTotal(bundlePayments, imaBundle);

    await savePaymentsForBundle(bundlePayments, {
      razorpayPaymentId: paymentId,
      amount: totalPaid,
      status: 'Success',
    });

    res.json({
      success: true,
      tempPlayerNo: tempNo || bundlePayments[0]?.tempNo,
      playerId: playerId || bundlePayments[0]?.playerId,
      paymentId,
    });
  } catch (err) {
    await insertErrorLog(err.message, err.stack);
    res.json({ success: false, message: err.message });
  }
});

router.post('/verify-bulk', async (req, res) => {
  try {
    const { bulkRegId, paymentId, orderId, signature, amount } = req.body;
    if (!verifySignature(orderId, paymentId, signature)) {
      return res.json({ success: false, message: 'Signature mismatch' });
    }
    const { execSp } = require('../services/db');
    await execSp('sp_SavePayment_Bulk', {
      BulkRegId: Number(bulkRegId),
      RazorpayPaymentId: paymentId,
      Amount: Number(amount),
      Status: 'Success',
    });
    res.json({ success: true, paymentId });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

module.exports = router;
