const express = require('express');
const { execSp } = require('../services/db');

const router = express.Router();

router.get('/details/:codeValue', async (req, res) => {
  try {
    const result = await execSp('sp_GetPlayerByQrCode', { CodeValue: req.params.codeValue });
    const row = result.recordset?.[0];
    if (!row) return res.status(404).json({ error: 'Player not found' });
    res.json({
      fullName: `${row.FirstName || ''} ${row.LastName || ''}`.trim(),
      playerType: row.PlayerType,
      photoPath: row.PhotoPath,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
