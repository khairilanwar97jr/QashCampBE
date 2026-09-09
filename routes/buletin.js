const router = require('express').Router();
const service = require('../services/buletinService');

router.get('/', async (req, res) => {
  try {
    const buletin = await service.getPublishedBuletin(req.query);
    res.set('Cache-Control', 'public, max-age=30, s-maxage=60');
    res.json({ success: true, buletin });
  } catch (error) {
    res.set('Cache-Control', 'no-store');
    const status = error.status || 500;
    if (status === 500) console.error('Buletin request failed:', error.code || error.name);
    res.status(status).json({
      success: false,
      message: status === 500 ? 'Unable to load buletin. Please try again.' : error.message,
    });
  }
});

module.exports = router;
