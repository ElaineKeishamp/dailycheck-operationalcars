const { rateLimit } = require('express-rate-limit');

function createLoginRateLimiter({ windowMs = 15 * 60 * 1000, limit = 20, store } = {}) {
  return rateLimit({
    windowMs,
    limit,
    store,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    requestWasSuccessful: (_req, res) => res.statusCode < 400 || res.statusCode >= 500,
    message: {
      error: 'Terlalu banyak percobaan login. Tunggu sebentar, lalu coba lagi.',
      code: 'LOGIN_RATE_LIMITED',
    },
  });
}

module.exports = { createLoginRateLimiter };
