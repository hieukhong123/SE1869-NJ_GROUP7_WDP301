import express from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  createUser,
  registerUser,
  verifyEmail,
  resendVerificationCode,
  loginUser,
  forgotPassword,
  resetPassword,
  toggleUserStatus,
  getUserProfile,
  updateUserProfile,
  changePassword,
} from '../controllers/userController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/register').post(registerUser);
router.route('/verify-email').post(verifyEmail);
router.route('/resend-verification').post(resendVerificationCode);
router.route('/login').post(loginUser);
router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password').post(resetPassword);

// Protected routes
router.use(protect);

router.route('/profile/:userId').get(getUserProfile).put(updateUserProfile);
router.route('/change-password/:userId').put(changePassword);

// Admin only routes
router.use(authorize('admin'));
router.route('/').get(getUsers).post(createUser);
router.route('/:id').get(getUserById).put(updateUser).delete(deleteUser);
router.route('/:id/toggle-status').put(toggleUserStatus);

export default router;

