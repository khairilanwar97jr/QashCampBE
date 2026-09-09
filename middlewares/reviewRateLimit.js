// Per-process limit. Deployments with multiple instances also need a shared
// gateway/Redis limit; this map does not coordinate across instances.
const attempts = new Map();
const windowMs = 15 * 60 * 1000;
module.exports = function reviewRateLimit(req, res, next) {
  const now = Date.now();
  for (const [key, entry] of attempts) if (entry.expires <= now) attempts.delete(key);
  const key = req.ip;
  const entry = attempts.get(key) || { count: 0, expires: now + windowMs };
  if (entry.count >= 10 || (!attempts.has(key) && attempts.size >= 10000)) {
    res.set('Retry-After', String(Math.max(1, Math.ceil((entry.expires - now) / 1000))));
    return res.status(429).json({ success: false, message: 'Too many review requests. Please try again later.' });
  }
  entry.count++;
  attempts.set(key, entry);
  next();
};
