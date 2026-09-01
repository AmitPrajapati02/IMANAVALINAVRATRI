const express = require('express');
const sql = require('mssql');
const { bulkUpload } = require('../middleware/multer');
const { execSp, getPool, insertErrorLog } = require('../services/db');
const { resolveBulkFee } = require('../services/fees');
const { validateFile, saveUpload } = require('../services/upload');
const { saveRegistrationWithBulkId, getAreas } = require('../services/registration');

const router = express.Router();
const BULK_MAX = 50;

async function validateToken(token) {
  const result = await execSp('sp_ValidateBulkToken', { Token: token });
  const row = result.recordset?.[0];
  if (!row) return false;
  return Boolean(Object.values(row)[0]);
}

router.get('/bulk/:token', async (req, res) => {
  try {
    const valid = await validateToken(req.params.token);
    if (!valid) return res.status(404).json({ valid: false });
    const areas = await getAreas();
    res.json({ valid: true, token: req.params.token, areas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/bulk/:token', bulkUpload.any(), async (req, res) => {
  try {
    const token = req.params.token;
    const valid = await validateToken(token);
    if (!valid) return res.status(404).json({ valid: false, error: 'Invalid token' });

    const body = req.body;
    const playerCount = Math.min(BULK_MAX, parseInt(body.playerCount || '1', 10) || 1);
    const fileMap = {};
    (req.files || []).forEach((f) => {
      fileMap[f.fieldname] = f;
    });

    const pool = await getPool();
    const request = pool.request();
    request.input('Token', sql.VarChar, token);
    request.input('MobileNo', sql.VarChar, body.mobileNo);
    request.input('EmailAddress', sql.VarChar, body.emailAddress);
    request.input('AreaId', sql.Int, Number(body.areaId));
    request.input('Pincode', sql.VarChar, body.pincode);
    request.input('Address', sql.VarChar, body.address);
    request.input('PaymentOption', sql.VarChar, 'IMA');
    request.output('BulkRegId', sql.Int);
    await request.execute('sp_InsertBulkRegistration');
    const bulkRegId = request.parameters.BulkRegId.value;

    let totalFee = 0;
    const referral = `Link Code : ${token}`;

    for (let i = 0; i < playerCount; i++) {
      const photo = fileMap[`playerPhoto${i}`];
      const idProof = fileMap[`playerIdProof${i}`];
      if (validateFile(photo) || validateFile(idProof)) {
        return res.status(400).json({ error: `Invalid files for player ${i + 1}` });
      }

      const playerType = body[`playerType${i}`] || 'Male Player';
      const fee = resolveBulkFee(playerType);
      totalFee += fee;

      await saveRegistrationWithBulkId(
        {
          firstName: body[`firstName${i}`],
          lastName: body[`lastName${i}`],
          mobileNo: body.mobileNo,
          emailAddress: body.emailAddress,
          dob: body[`dob${i}`],
          areaId: Number(body.areaId),
          address: body.address,
          pincode: body.pincode,
          playerType,
          feeAmount: fee,
          photoPath: saveUpload(photo, 'Photos'),
          idProofPath: saveUpload(idProof, 'IdProofs'),
          referral,
        },
        bulkRegId
      );
    }

    await execSp('sp_SavePayment_Bulk', {
      BulkRegId: bulkRegId,
      RazorpayPaymentId: null,
      Amount: totalFee,
      Status: 'Pay at IMA',
    });

    res.json({ success: true, bulkRegId, paymentId: 'Pay-at-IMA' });
  } catch (err) {
    await insertErrorLog(err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
