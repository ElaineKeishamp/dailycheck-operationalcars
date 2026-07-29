const multer = require('multer');

const MAX_PHOTO_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_PHOTO_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      return cb(new Error('Tipe file foto tidak didukung'));
    }

    return cb(null, true);
  },
});

function uploadPhotoFile(req, res, next) {
  upload.single('photo')(req, res, (err) => {
    if (!err) {
      return next();
    }

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Ukuran foto terlalu besar. Maksimal 8 MB.' });
      }

      return res.status(400).json({ error: 'File foto tidak valid' });
    }

    return res.status(400).json({ error: err.message || 'File foto tidak valid' });
  });
}

module.exports = {
  uploadPhotoFile,
  MAX_PHOTO_SIZE_BYTES,
  ALLOWED_IMAGE_TYPES,
};
