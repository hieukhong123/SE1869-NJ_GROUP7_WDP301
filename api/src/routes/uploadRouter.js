import express from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/uploadController.js';

const router = express.Router();

// Configure Multer for file uploads
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'uploads/'); // Files will be stored in the 'uploads/' directory
	},
	filename: function (req, file, cb) {
		cb(null, `${Date.now()}-${file.originalname}`);
	},
});

const upload = multer({ storage: storage });

router.post('/', upload.single('image'), uploadImage);

export default router;