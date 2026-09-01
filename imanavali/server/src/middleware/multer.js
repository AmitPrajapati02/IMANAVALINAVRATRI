const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 2097152 },
});

const bulkUpload = multer({
  storage,
  limits: { fileSize: 2097152, files: 200 },
});

module.exports = { upload, bulkUpload };
