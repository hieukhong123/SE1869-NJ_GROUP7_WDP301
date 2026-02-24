import express from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  createUser,
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  toggleUserStatus,
} from '../controllers/userController.js';

const router = express.Router();

router.route('/').get(getUsers).post(createUser);
router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password').post(resetPassword);
router.route('/:id').get(getUserById).put(updateUser).delete(deleteUser);
router.route('/:id/toggle-status').put(toggleUserStatus);

export default router;

