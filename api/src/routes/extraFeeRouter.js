import express from 'express';
import {
	getExtraFees,
	getExtraFeeById,
	createExtraFee,
	updateExtraFee,
	deleteExtraFee,
} from '../controllers/extraFeeController.js';

const router = express.Router();

router.route('/').get(getExtraFees).post(createExtraFee);
router
	.route('/:id')
	.get(getExtraFeeById)
	.put(updateExtraFee)
	.delete(deleteExtraFee);

export default router;
