const express = require('express');
const config = require('../config/env');
const { requireAdmin, setAdminSession, clearAdminSession } = require('../middleware/auth');
const { upload } = require('../middleware/multer');
const { execSp, getPool } = require('../services/db');
const { saveUpload } = require('../services/upload');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await execSp('sp_UserLogin', { UserName: username, Password: password });
    const row = result.recordset?.[0];
    const userId = row?.UserId ? Number(row.UserId) : 0;
    if (userId <= 0) return res.status(401).json({ error: 'Invalid username or password.' });
    setAdminSession(res, { userId, isAdmin: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/logout', (req, res) => {
  clearAdminSession(res);
  res.json({ success: true });
});

router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const result = await execSp('sp_GetDashboardCounts');
    res.json(result.recordset?.[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/registrations/paged', requireAdmin, async (req, res) => {
  try {
    const draw = req.body.draw;
    const start = parseInt(req.body.start || '0', 10);
    const length = parseInt(req.body.length || '10', 10);
    const search = req.body.search?.value || req.body['search[value]'] || '';
    const orderCol = req.body.order?.[0]?.column ?? req.body['order[0][column]'];
    const columns = req.body.columns || [];
    let sortColumn = 'RegisterDate';
    if (orderCol !== undefined && columns[orderCol]) {
      sortColumn = columns[orderCol].data || sortColumn;
    } else if (req.body['columns[' + orderCol + '][data]']) {
      sortColumn = req.body['columns[' + orderCol + '][data]'];
    }
    const sortDir = (req.body.order?.[0]?.dir || req.body['order[0][dir]'] || 'DESC').toUpperCase();
    const pageNumber = length > 0 ? Math.floor(start / length) + 1 : 1;

    const result = await execSp('GetPlayerRegistrationsPaged_Dy', {
      PageNumber: pageNumber,
      PageSize: length,
      SearchTerm: search || null,
      SortColumn: sortColumn,
      SortDirection: sortDir,
    });

    const data = (result.recordsets?.[0] || []).map(mapPlayerRow);
    let recordsFiltered = 0;
    let recordsTotal = 0;
    if (result.recordsets?.[1]?.[0]) {
      recordsFiltered = Number(Object.values(result.recordsets[1][0])[0]) || 0;
    }
    if (result.recordsets?.[2]?.[0]) {
      recordsTotal = Number(Object.values(result.recordsets[2][0])[0]) || 0;
    }

    res.json({ draw, recordsTotal, recordsFiltered, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function mapPlayerRow(row) {
  return {
    PlayerId: String(row.PlayerId),
    RegistrationNo: row.RegistrationNo,
    PlayerType: row.PlayerType,
    FirstName: row.FirstName,
    LastName: row.LastName,
    Mobileno: row.Mobileno,
    EmailAddress: row.EmailAddress,
    DateOfBirth: row.DateOfBirth,
    Address: row.Address,
    AreaName: row.AreaName,
    Pincode: row.Pincode,
    RegisterDate: row.RegisterDate,
    RazorpayPaymentId: row.RazorpayPaymentId,
    PaidAmount: row.PaidAmount,
    PaymentStatus: row.PaymentStatus,
    Referral: row.Referral,
    ApprovalStatus: row.ApprovalStatus,
    CodeValue: row.CodeValue,
    PhotoPath: row.PhotoPath || '/assets/img/no-image.png',
    IdProofPath: row.IdProofPath || '/assets/img/no-image.png',
  };
}

router.get('/registrations/export', requireAdmin, async (req, res) => {
  try {
    const result = await execSp('GetPlayerRegistrationsList');
    const rows = result.recordset || [];
    const header = 'Registration No,Player Type,First Name,Last Name,Mobile No,Email,Date of Birth,Address,Area,Pincode,Register Date,Razorpay Payment Id,Paid Amount,Payment Status,Referral,Approval Status,CodeValue';
    const lines = rows.map((r) => {
      const addr = (r.Address || '').replace(/[\r\n]+/g, ' ').replace(/,/g, ' ');
      return [
        r.RegistrationNo, r.PlayerType, r.FirstName, r.LastName, r.Mobileno,
        r.EmailAddress, formatDate(r.DateOfBirth), addr, r.AreaName, r.Pincode,
        formatDate(r.RegisterDate), r.RazorpayPaymentId, r.PaidAmount,
        r.PaymentStatus, r.Referral, r.ApprovalStatus, r.CodeValue,
      ].join(',');
    });
    const csv = [header, ...lines].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=RegistrationList-${Date.now()}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}-${String(dt.getMonth() + 1).padStart(2, '0')}-${dt.getFullYear()}`;
}

router.get('/players/:id', requireAdmin, async (req, res) => {
  try {
    const result = await execSp('sp_GetPlayerById', { PlayerId: Number(req.params.id) });
    res.json(result.recordset?.[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/players/:id', requireAdmin, upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'idProof', maxCount: 1 },
]), async (req, res) => {
  try {
    let photoPath = null;
    let idProofPath = null;
    if (req.files?.photo?.[0]) photoPath = saveUpload(req.files.photo[0], 'Photos');
    if (req.files?.idProof?.[0]) idProofPath = saveUpload(req.files.idProof[0], 'IdProofs');

    await execSp('sp_UpdatePlayer', {
      PlayerId: Number(req.params.id),
      FirstName: req.body.firstName,
      LastName: req.body.lastName,
      MobileNo: req.body.mobileNo,
      Address: req.body.address,
      PhotoPath: photoPath,
      IdProofPath: idProofPath,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/approve', requireAdmin, async (req, res) => {
  try {
    const { playerId, status } = req.body;
    await execSp('sp_ApproveRegistration', {
      PlayerId: Number(playerId),
      Status: status,
      ApprovedBy: req.adminSession.userId || 1,
    });
    res.json({ success: true, message: `Registration ${status} successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/qr/unassigned', requireAdmin, async (req, res) => {
  try {
    const result = await execSp('sp_GetUnassignedQrCodes');
    const codes = (result.recordset || []).map((r) => ({ CodeValue: r.CodeValue }));
    res.json(codes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/qr/search', requireAdmin, async (req, res) => {
  try {
    const result = await execSp('sp_SearchQrCodes', { Term: req.query.term || null });
    res.json(result.recordset || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/qr/assign', requireAdmin, async (req, res) => {
  try {
    const { playerId, codeValue } = req.body;
    await execSp('sp_AssignQrCode', {
      PlayerId: Number(playerId),
      CodeValue: codeValue,
      ApprovedBy: req.adminSession.userId,
    });
    res.json({ success: true, message: 'QR Code assigned successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

router.get('/bulk-links', requireAdmin, async (req, res) => {
  try {
    const result = await execSp('sp_GetBulkLinks');
    res.json(result.recordset || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/bulk-links/generate', requireAdmin, async (req, res) => {
  try {
    const { v4: uuidv4 } = require('uuid');
    const token = uuidv4().replace(/-/g, '');
    const link = `${config.clientUrl}/register/bulk/${token}`;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 3);
    await execSp('sp_GenerateBulkLink', { Token: token, Link: link, ExpiryDate: expiry });
    res.json({
      success: true,
      token,
      link,
      expiry: expiry.toISOString().slice(0, 16).replace('T', ' '),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/bulk-links/:id/expire', requireAdmin, async (req, res) => {
  try {
    await execSp('sp_ExpireBulkLink', { Id: Number(req.params.id) });
    res.json({ success: true });
  } catch {
    res.json({ success: false });
  }
});

router.delete('/bulk-links/:id', requireAdmin, async (req, res) => {
  try {
    await execSp('sp_DeleteBulkLink', { Id: Number(req.params.id) });
    res.json({ success: true });
  } catch {
    res.json({ success: false });
  }
});

module.exports = router;
