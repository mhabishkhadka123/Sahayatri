import rateLimit from 'express-rate-limit';
import config from '../config/index.js';

/**
 * General rate limiter — applied to all API routes
 */
export const generalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutes
  max: config.rateLimit.max,           // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please try again later.',
  },
  skip: (req) => config.isDev && req.ip === '::1', // Skip in dev for localhost
});

/**
 * Strict rate limiter for auth endpoints (signup, login, forgot-password)
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rateLimit.authMax, // 10 attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many attempts. Please try again in 15 minutes.',
  },
  skip: () => true, // <--- ADD THIS LINE: This completely turns off the auth limiter for now!
});

/**
 * Upload rate limiter — max 20 photo uploads per hour
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many uploads. Please try again later.',
  },
});
