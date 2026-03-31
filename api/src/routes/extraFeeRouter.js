import express from 'express';
import {
	getExtraFees,
	getExtraFeeById,
	createExtraFee,
	updateExtraFee,
	deleteExtraFee,
} from '../controllers/extraFeeController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'staff'));

router.route('/').get(getExtraFees).post(createExtraFee);
router
	.route('/:id')
	.get(getExtraFeeById)
	.put(updateExtraFee)
	.delete(deleteExtraFee);

export default router;
