const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/env');

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png'];
const MAX_BYTES = 2097152;

function ensureDirs() {
  fs.mkdirSync(path.join(config.uploadDir, 'Photos'), { recursive: true });
  fs.mkdirSync(path.join(config.uploadDir, 'IdProofs'), { recursive: true });
}

function getUploadExtension(fileName) {
  if (!fileName) return '.jpg';
  const ext = path.extname(fileName).toLowerCase();
  return ext || '.jpg';
}

function validateFile(file) {
  if (!file || !file.buffer?.length) return 'File is required.';
  if (file.size > MAX_BYTES) return 'File must be less than 2 MB.';
  const ext = getUploadExtension(file.originalname);
  if (!ALLOWED_EXT.includes(ext)) return 'Only JPG or PNG files allowed.';
  return null;
}

function saveUpload(file, folder) {
  const ext = getUploadExtension(file.originalname);
  const fileName = `${uuidv4()}${ext}`;
  const subDir = folder === 'IdProofs' ? 'IdProofs' : 'Photos';
  const diskPath = path.join(config.uploadDir, subDir, fileName);
  fs.writeFileSync(diskPath, file.buffer);
  return `/Uploads/${subDir}/${fileName}`;
}

module.exports = { ensureDirs, validateFile, saveUpload, getUploadExtension, MAX_BYTES, ALLOWED_EXT };
