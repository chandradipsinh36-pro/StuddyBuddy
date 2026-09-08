import rateLimit from 'express-rate-limit';

const standardHeaders = true;
const legacyHeaders = false;

// General API limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 500,
  standardHeaders,
  legacyHeaders,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' } },
});

// Strict limiter for auth endpoints (brute force protection)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders,
  legacyHeaders,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many auth attempts, please try again later.' } },
});

// Review creation limiter
export const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders,
  legacyHeaders,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many reviews created.' } },
});

// Message HTTP fallback limiter
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders,
  legacyHeaders,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Message rate limit exceeded.' } },
});

// Report creation limiter
export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders,
  legacyHeaders,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many reports submitted.' } },
});
