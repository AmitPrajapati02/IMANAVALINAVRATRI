const express = require('express');
const { getRegSession, setRegSession, clearRegSession, requireRegSession } = require('../middleware/auth');
const { upload } = require('../middleware/multer');
const {
  resolveFeeAmount,
  resolveImaRegistrationFee,
  isImaBundleRegistration,
  normalizeBundlePayments,
  computeBundleTotal,
} = require('../services/fees');
const { validateRegistration, validateDonor } = require('../services/validation');
const { validateFile, saveUpload } = require('../services/upload');
const {
  saveRegistration,
  getRegistrationCountByMobile,
  getAreas,
  getPincodeByAreaId,
  savePaymentsForBundle,
  enrichBundlePlayerTypes,
  deleteRegistrationsForBundle,
} = require('../services/registration');
const { insertErrorLog } = require('../services/db');
const { bundlePaymentsForRegSession } = require('../lib/regSession');

const router = express.Router();

router.get('/areas', async (req, res) => {
  try {
    const areas = await getAreas();
    res.json(areas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/pincode/:areaId', async (req, res) => {
  try {
    const pincode = await getPincodeByAreaId(req.params.areaId);
    res.json({ pincode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/register/session', (req, res) => {
  const session = getRegSession(req);
  if (!session?.mobile) return res.status(401).json({ error: 'No session' });
  res.json({
    mobile: session.mobile,
    passType: session.passType,
    price: session.price,
    bundlePayments: session.bundlePayments || null,
  });
});

router.post('/check-mobile-registrations', async (req, res) => {
  try {
    const { mobileNo } = req.body;
    const count = await getRegistrationCountByMobile(mobileNo);
    res.json({ regCount: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post(
  '/register',
  requireRegSession,
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'idProof', maxCount: 1 },
    { name: 'donorPhoto0', maxCount: 1 },
    { name: 'donorIdProof0', maxCount: 1 },
    { name: 'donorPhoto1', maxCount: 1 },
    { name: 'donorIdProof1', maxCount: 1 },
    { name: 'donorPhoto2', maxCount: 1 },
    { name: 'donorIdProof2', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const session = req.regSession;
      const body = req.body;
      const files = {
        photo: req.files?.photo?.[0],
        idProof: req.files?.idProof?.[0],
      };

      let errors = validateRegistration(
        {
          ...body,
          mobileNo: body.mobileNo || session.mobile,
        },
        files
      );

      for (const f of ['photo', 'idProof']) {
        const err = validateFile(files[f]);
        if (err) errors.push({ field: f, message: err });
      }

      const donorCount = Math.min(3, parseInt(body.donorCount || '0', 10) || 0);
      const donors = [];
      for (let i = 0; i < donorCount; i++) {
        const rawType = body[`donorPlayerType${i}`];
        const donorType = (Array.isArray(rawType) ? rawType[0] : rawType || '').trim();
        const donorData = {
          firstName: body[`donorFirstName${i}`],
          lastName: body[`donorLastName${i}`],
          dob: body[`donorDob${i}`],
          playerType: donorType,
        };
        const donorFiles = {
          photo: req.files?.[`donorPhoto${i}`]?.[0],
          idProof: req.files?.[`donorIdProof${i}`]?.[0],
        };
        errors = errors.concat(validateDonor(donorData, donorFiles, i));
        for (const f of ['photo', 'idProof']) {
          const err = validateFile(donorFiles[f]);
          if (err) errors.push({ field: `donor${i}.${f}`, message: err });
        }
        donors.push({ ...donorData, files: donorFiles });
      }

      const playerType = (body.playerType || session.passType || '').trim();
      let paymentOption = body.paymentOption || 'Online';
      if (playerType !== 'Male IMA Member' && playerType !== 'Male MSN Member') {
        paymentOption = 'Online';
      } else if (!paymentOption) {
        errors.push({ field: 'paymentOption', message: 'Please select a payment option.' });
      }

      if (errors.length) return res.status(400).json({ errors });

      const imaBundle = isImaBundleRegistration(playerType);
      const mainFee = imaBundle
        ? resolveImaRegistrationFee(playerType)
        : resolveFeeAmount(playerType, body.feeAmount);
      if (mainFee <= 0) return res.status(400).json({ error: 'Invalid fee amount.' });

      const photoPath = saveUpload(files.photo, 'Photos');
      const idProofPath = saveUpload(files.idProof, 'IdProofs');

      const mainResult = await saveRegistration({
        firstName: body.firstName,
        lastName: body.lastName,
        mobileNo: body.mobileNo || session.mobile,
        emailAddress: body.emailAddress,
        dob: body.dob,
        areaId: Number(body.areaId),
        address: body.address,
        pincode: body.pincode,
        playerType,
        feeAmount: mainFee,
        photoPath,
        idProofPath,
        referral: body.referral || null,
      });

      if (!mainResult.playerId) {
        return res.status(500).json({ error: 'Registration could not be saved.' });
      }

      const bundlePayments = [{
        playerId: mainResult.playerId,
        tempNo: mainResult.tempNo,
        fee: mainFee,
        playerType,
      }];

      for (const donor of donors) {
        const dFee = imaBundle
          ? resolveImaRegistrationFee(donor.playerType)
          : resolveFeeAmount(donor.playerType, 0);
        const dPhoto = saveUpload(donor.files.photo, 'Photos');
        const dId = saveUpload(donor.files.idProof, 'IdProofs');
        const dResult = await saveRegistration({
          firstName: donor.firstName,
          lastName: donor.lastName,
          mobileNo: body.mobileNo || session.mobile,
          emailAddress: body.emailAddress,
          dob: donor.dob,
          areaId: Number(body.areaId),
          address: body.address,
          pincode: body.pincode,
          playerType: donor.playerType,
          feeAmount: dFee,
          photoPath: dPhoto,
          idProofPath: dId,
          referral: body.referral || null,
        });
        if (dResult.playerId) {
          bundlePayments.push({
            playerId: dResult.playerId,
            tempNo: dResult.tempNo,
            fee: dFee,
            playerType: (donor.playerType || '').trim(),
          });
        }
      }

      const normalizedBundle = normalizeBundlePayments(bundlePayments, imaBundle);
      const totalFee = computeBundleTotal(normalizedBundle, imaBundle);

      if (paymentOption === 'IMA') {
        await savePaymentsForBundle(normalizedBundle, {
          razorpayPaymentId: null,
          amount: totalFee,
          status: 'Pay at IMA',
        });
        clearRegSession(res);
        return res.json({
          success: true,
          payAtIma: true,
          tempPlayerNo: mainResult.tempNo,
          playerId: mainResult.playerId,
          paymentId: 'Pay-at-IMA',
        });
      }

      setRegSession(res, {
        mobile: session.mobile,
        passType: session.passType,
        price: session.price,
        bundlePayments: bundlePaymentsForRegSession(normalizedBundle),
        mainTempNo: mainResult.tempNo,
        mainPlayerId: mainResult.playerId,
        totalFee,
      });

      res.json({
        success: true,
        redirect: `/account/payment?id=${mainResult.playerId}&tempNo=${mainResult.tempNo}&fee=${totalFee}`,
        playerId: mainResult.playerId,
        tempNo: mainResult.tempNo,
        fee: totalFee,
      });
    } catch (err) {
      await insertErrorLog(err.message, err.stack);
      res.status(500).json({ error: err.message });
    }
  }
);

router.post('/cancel', requireRegSession, async (req, res) => {
  try {
    const session = req.regSession;
    let bundlePayments = session.bundlePayments || [
      { playerId: Number(req.body.playerId), tempNo: req.body.tempNo },
    ];
    bundlePayments = await enrichBundlePlayerTypes(bundlePayments);
    await deleteRegistrationsForBundle(bundlePayments);
    clearRegSession(res);
    res.json({
      success: true,
      tempNo: bundlePayments[0]?.tempNo,
      playerId: bundlePayments[0]?.playerId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
