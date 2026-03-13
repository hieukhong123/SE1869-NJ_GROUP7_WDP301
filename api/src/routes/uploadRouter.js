import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadImage } from '../controllers/uploadController.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
	fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, UPLOADS_DIR); // Files will be stored in the 'uploads/' directory
	},
	filename: function (req, file, cb) {
		const safeOriginalName = path.basename(file.originalname);
		cb(null, `${Date.now()}-${safeOriginalName}`);
	},
});

const upload = multer({ storage: storage });

router.post('/', upload.single('image'), uploadImage);

export default router;
