import express from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  createUser,
  toggleUserStatus,
} from '../controllers/userController.js';

const router = express.Router();

router.route('/').get(getUsers).post(createUser);
router.route('/:id').get(getUserById).put(updateUser).delete(deleteUser);
router.route('/:id/toggle-status').put(toggleUserStatus);

export default router;

