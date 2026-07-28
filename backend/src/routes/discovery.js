import express from 'express';
import {
  browseProfiles,
  searchProfiles,
  getProfileDetails,
} from '../controllers/discoveryController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/profiles', authenticate, browseProfiles);
router.get('/search', authenticate, searchProfiles);
router.get('/profiles/:userId', authenticate, getProfileDetails);

export default router;
