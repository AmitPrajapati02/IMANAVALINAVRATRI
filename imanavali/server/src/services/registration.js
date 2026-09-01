const { execSp } = require('../services/db');

async function saveRegistration(player) {
  const result = await execSp('SaveRegistration', {
    FirstName: player.firstName,
    LastName: player.lastName || null,
    MobileNo: player.mobileNo,
    EmailAddress: player.emailAddress || null,
    DOB: player.dob,
    AreaId: player.areaId,
    Address: player.address,
    Pincode: player.pincode || null,
    PlayerType: player.playerType || null,
    FeeAmount: player.feeAmount,
    PhotoPath: player.photoPath || null,
    IdProofPath: player.idProofPath || null,
    Referral: player.referral || null,
  });
  const row = result.recordset?.[0];
  return {
    playerId: row?.NewPlayerId ? Number(row.NewPlayerId) : 0,
    tempNo: row?.TempPlayerNo?.toString() || '',
  };
}

async function saveRegistrationWithBulkId(player, bulkRegId) {
  const result = await execSp('SaveRegistration_With_BulkId', {
    FirstName: player.firstName,
    LastName: player.lastName || null,
    MobileNo: player.mobileNo,
    EmailAddress: player.emailAddress || null,
    DOB: player.dob,
    AreaId: player.areaId,
    Address: player.address,
    Pincode: player.pincode || null,
    PlayerType: player.playerType || null,
    FeeAmount: player.feeAmount,
    PhotoPath: player.photoPath || null,
    IdProofPath: player.idProofPath || null,
    Referral: player.referral || null,
    BulkRegId: bulkRegId,
  });
  const row = result.recordset?.[0];
  return {
    playerId: row?.NewPlayerId ? Number(row.NewPlayerId) : 0,
    tempNo: row?.TempPlayerNo?.toString() || '',
  };
}

async function savePayment({ playerId, tempNo, razorpayPaymentId, amount, status }) {
  await execSp('sp_SavePayment', {
    PlayerId: playerId,
    TempPlayerNo: tempNo,
    RazorpayPaymentId: razorpayPaymentId || null,
    Amount: amount,
    Status: status,
  });
}

async function savePaymentsForBundle(bundlePayments, { razorpayPaymentId, amount, status }) {
  for (const line of bundlePayments) {
    await savePayment({
      playerId: line.playerId,
      tempNo: line.tempNo,
      razorpayPaymentId,
      amount: status === 'Success' || status === 'Pay at IMA' ? line.fee : 0,
      status,
    });
  }
}

async function getRegistrationCountByMobile(mobileNo) {
  const result = await execSp('sp_GetRegistrationCountByMobile', { MobileNo: mobileNo });
  const row = result.recordset?.[0];
  if (!row) return 0;
  const val = row.regCount ?? row.RegCount ?? Object.values(row)[0];
  return Number(val) || 0;
}

async function getAreas() {
  const result = await execSp('GetAreas');
  return result.recordset || [];
}

async function getPincodeByAreaId(areaId) {
  const result = await execSp('GetPincodeByAreaId', { AreaId: areaId });
  const row = result.recordset?.[0];
  if (!row) return '';
  return row.Pincode || row.pincode || Object.values(row)[0] || '';
}

async function enrichBundlePlayerTypes(bundlePayments) {
  if (!bundlePayments?.length) return [];
  const { getPool, sql } = require('./db');
  const pool = await getPool();
  const enriched = [];
  for (const line of bundlePayments) {
    if ((line.playerType || '').trim()) {
      enriched.push(line);
      continue;
    }
    if (!line.playerId) {
      enriched.push(line);
      continue;
    }
    try {
      const result = await pool.request()
        .input('PlayerId', sql.Int, line.playerId)
        .query('SELECT PlayerType FROM Registration WHERE PlayerId = @PlayerId');
      const playerType = (result.recordset?.[0]?.PlayerType || '').trim();
      enriched.push({ ...line, playerType });
    } catch {
      enriched.push(line);
    }
  }
  return enriched;
}

/** Remove unpaid registration bundle from DB when user cancels payment. */
async function deleteRegistrationsForBundle(bundlePayments) {
  if (!bundlePayments?.length) return;
  const { getPool, sql } = require('./db');
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    for (const line of bundlePayments) {
      const playerId = Number(line.playerId);
      if (!playerId) continue;
      await new sql.Request(transaction)
        .input('PlayerId', sql.Int, playerId)
        .query('DELETE FROM Payment WHERE PlayerId = @PlayerId');
      await new sql.Request(transaction)
        .input('PlayerId', sql.Int, playerId)
        .query('DELETE FROM Registration WHERE PlayerId = @PlayerId');
    }
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

module.exports = {
  saveRegistration,
  saveRegistrationWithBulkId,
  savePayment,
  savePaymentsForBundle,
  getRegistrationCountByMobile,
  getAreas,
  getPincodeByAreaId,
  enrichBundlePlayerTypes,
  deleteRegistrationsForBundle,
};
