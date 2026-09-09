const router = require('express').Router();
const service = require('../services/reviewService');

router.get('/', async (req, res) => {
  try {
    const result = await service.listPublicReviews(req.query);
    // Short public cache allows repeat visits/CDN hits without querying Supabase.
    res.set('Cache-Control', 'public, max-age=30, s-maxage=60');
    res.json({ success: true, ...result });
  } catch (error) {
    res.set('Cache-Control', 'no-store');
    const status = error.status || 500;
    if (status === 500) console.error('Public reviews failed:', error.code || error.name);
    res.status(status).json({ success: false, message: status === 500 ? 'Unable to load reviews. Please try again.' : error.message });
  }
});

module.exports = router;
