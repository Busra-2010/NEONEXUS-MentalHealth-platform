import express from 'express';
import { authenticate } from '../middleware/auth';
import * as chatbotController from '../controllers/chatbotController';

const router = express.Router();

// Real API endpoint connected to the chatbot controller
router.post('/message', authenticate, chatbotController.handleChatMessage);

export default router;