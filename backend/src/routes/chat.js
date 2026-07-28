import express from 'express';
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
} from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/conversations', authenticate, getConversations);
router.get('/conversations/:conversationId/messages', authenticate, getMessages);
router.post('/conversations/:conversationId/messages', authenticate, sendMessage);
router.put('/conversations/:conversationId/read', authenticate, markAsRead);
router.delete('/messages/:messageId', authenticate, deleteMessage);

export default router;
