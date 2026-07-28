// ─────────────────────────────────────────────
// config/index.js — Centralized configuration
// All values come from environment variables.
// TODO: Copy .env.example to .env and fill in your credentials.
// ─────────────────────────────────────────────

import 'dotenv/config';
import express from 'express';
const config = {
  // Server
  port: parseInt(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  refreshTokenExpire: process.env.REFRESH_TOKEN_EXPIRE || '30d',

  // Cloudinary
  // TODO: Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    isConfigured: !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ),
  },

  // Email (Nodemailer)
  // TODO: Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS in .env
  // Supported providers: Gmail (smtp.gmail.com:587), SendGrid, Mailgun, Resend
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || 'Sahayatra <noreply@sahayatra.com>',
    isConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
  },

  // App
  appName: process.env.APP_NAME || 'Sahayatra',
  appUrl: process.env.APP_URL || 'http://localhost:5173',

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 1000,
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10, // stricter for auth routes
  },

  // Pagination defaults
  pagination: {
    defaultLimit: 10,
    maxLimit: 50,
  },

  // Password reset token expiry (1 hour)
  passwordResetExpiry: 60 * 60 * 1000,

  // Email verification token expiry (24 hours)
  emailVerificationExpiry: 24 * 60 * 60 * 1000,

  // OTP expiry (10 minutes)
  otpExpiry: 10 * 60 * 1000,
};

// Validate critical config in production
if (config.nodeEnv === 'production') {
  const required = ['JWT_SECRET', 'DATABASE_URL', 'FRONTEND_URL'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
} else if (!config.jwtSecret) {
  console.warn(
    '⚠️  JWT_SECRET not set. Using development fallback. DO NOT use in production.'
  );
  config.jwtSecret = 'sahayatra-dev-secret-do-not-use-in-production';
}

export default config;
