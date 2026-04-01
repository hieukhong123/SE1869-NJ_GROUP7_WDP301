import express from 'express';
import { askChatbot } from '../controllers/chatbotController.js';

const router = express.Router();

router.route('/ask').post(askChatbot);

export default router;
