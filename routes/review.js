const express = require('express');
const multer = require('multer');
const service = require('../services/reviewService');
const router = express.Router();
const rateLimit = require('../middlewares/reviewRateLimit');
router.use('/:bookingRef/review', rateLimit);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 3, fields: 2, fieldSize: 20000, parts: 6 },
  fileFilter(req, file, callback) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return callback(Object.assign(new Error('Photos must be JPEG, PNG, or WebP'), { status: 400 }));
    }
    callback(null, true);
  },
}).array('photos', 3);

// A matching reference validates the receipt, but is not authenticated ownership.
router.get('/:bookingRef/review', async (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  try {
    res.json({ success: true, ...await service.getStatusByRef(req.params.bookingRef) });
  } catch (error) { next(error); }
});

router.post('/:bookingRef/review', async (req, res, next) => {
  try {
    await service.assertAvailableByRef(req.params.bookingRef);
    next();
  } catch (error) { next(error); }
}, upload, async (req, res, next) => {
  try {
    res.status(201).json({ success: true, ...await service.submitByRef(req.params.bookingRef, req.body, req.files) });
  } catch (error) { next(error); }
});

router.use((error, req, res, next) => {
  const status = error instanceof multer.MulterError ? 400 : error.status || 500;
  if (status === 500) console.error('Review request failed:', error.message);
  res.status(status).json({
    success: false,
    ...(status === 409 ? { status: 'SUBMITTED' } : {}),
    message: status === 500 ? 'Unable to process review. Please try again.' : error.message,
  });
});

module.exports = router;
