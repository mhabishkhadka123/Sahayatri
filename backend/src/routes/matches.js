import express from 'express';
import {
  likeProfile,
  skipProfile,
  getMatches,
  getMatchDetails,
  unmatch,
} from '../controllers/matchController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/like/:userId', authenticate, likeProfile);
router.post('/skip/:userId', authenticate, skipProfile);
router.get('/mutual', authenticate, getMatches);
router.get('/:matchId', authenticate, getMatchDetails);
router.delete('/:userId', authenticate, unmatch);

export default router;
