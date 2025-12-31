import express from 'express';
import { uploadImage, upload } from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, upload.single('image'), uploadImage);

export default router;