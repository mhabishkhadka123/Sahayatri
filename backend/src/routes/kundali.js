import express from 'express';
import { getKundali, upsertKundali, generateAndSaveKundali, getCompatibility } from '../controllers/kundaliController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getKundali);
router.put('/', authenticate, upsertKundali);
router.post('/generate', authenticate, generateAndSaveKundali);
router.get('/compatibility/:userId', authenticate, getCompatibility);

export default router;
