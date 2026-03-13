import express from 'express';
import { sendContactMessage, getContacts, replyToContact, markContactRead } from '../controllers/contactController.js';

const router = express.Router();

router.post('/', sendContactMessage);
router.get('/', getContacts);
router.post('/:id/reply', replyToContact);
router.patch('/:id/read', markContactRead);

export default router;
