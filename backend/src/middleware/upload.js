import multer from 'multer';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Multer middleware for photo uploads.
 * Stores in memory (buffer) for Cloudinary upload.
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
  cb(null, true);
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
}).single('photo');

/** Wrap multer in a promise for cleaner async/await usage in controllers */
export const handleUpload = (req, res) => {
  return new Promise((resolve, reject) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          reject(new Error('File is too large. Maximum size is 5MB.'));
        } else {
          reject(err);
        }
      } else if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};
