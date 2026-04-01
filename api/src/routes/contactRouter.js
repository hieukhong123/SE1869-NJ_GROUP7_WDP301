import express from 'express';
import { sendContactMessage, getContacts, replyToContact, markContactRead } from '../controllers/contactController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', sendContactMessage);
router.get('/', protect, authorize('admin', 'staff'), getContacts);
router.post('/:id/reply', protect, authorize('admin', 'staff'), replyToContact);
router.patch('/:id/read', protect, authorize('admin', 'staff'), markContactRead);

export default router;
