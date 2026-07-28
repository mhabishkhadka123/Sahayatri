import express from 'express';
import {
  getMyProfile,
  getProfile,
  updateProfile,
  uploadPhoto,
  setPrimaryPhoto,
  deletePhoto,
  getPhotos,
  getProfileViews,
  toggleFavorite,
  getFavorites,
  blockUser,
  getBlockedUsers,
  reportUser,
} from '../controllers/profileController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validateUpdateProfile, validateReport, validatePagination, validate } from '../middleware/validation.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';
import { uploadMiddleware } from '../middleware/upload.js';

const router = express.Router();

// ─── Own Profile ──────────────────────────────────────────────────────────────
// IMPORTANT: Specific paths BEFORE /:userId to avoid route conflicts
router.get('/me', authenticate, getMyProfile);
router.put('/me', authenticate, validateUpdateProfile, validate, updateProfile);

// ─── Photos ──────────────────────────────────────────────────────────────────
router.get('/me/photos', authenticate, getPhotos);
router.post('/me/photos', authenticate, uploadRateLimiter, uploadMiddleware, uploadPhoto);
router.patch('/me/photos/:photoId/primary', authenticate, setPrimaryPhoto);
router.delete('/me/photos/:photoId', authenticate, deletePhoto);

// ─── Who Viewed Me ────────────────────────────────────────────────────────────
router.get('/me/views', authenticate, validatePagination, validate, getProfileViews);

// ─── Favorites ────────────────────────────────────────────────────────────────
router.get('/me/favorites', authenticate, validatePagination, validate, getFavorites);
router.post('/:userId/favorite', authenticate, toggleFavorite);

// ─── Block / Report ──────────────────────────────────────────────────────────
router.get('/me/blocked', authenticate, getBlockedUsers);
router.post('/:userId/block', authenticate, blockUser);
router.post('/:userId/report', authenticate, validateReport, validate, reportUser);

// ─── Public Profile (must be last to avoid conflicts) ──────────────────────────
router.get('/:userId', optionalAuth, getProfile);

export default router;
