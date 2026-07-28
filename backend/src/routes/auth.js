import express from 'express';
import {
  signup,
  login,
  logout,
  getCurrentUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  updateProfile,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validateSignup, validateLogin, validate } from '../middleware/validation.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes (with rate limiting on auth endpoints)
router.post('/signup', authRateLimiter, validateSignup, validate, signup);
router.post('/login', authRateLimiter, validateLogin, validate, login);
router.post('/refresh-token', authRateLimiter, refreshToken);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', authRateLimiter, resendVerification);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.post('/change-password', authenticate, changePassword);
router.post('/logout', authenticate, logout);
router.put('/profile', authenticate, updateProfile); // Added profile update route

export default router;