import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getMyReferral, applyReferralCode } from '../controllers/referralController.js';

const router = express.Router();

router.get('/me', protect, getMyReferral);
router.post('/apply', protect, applyReferralCode);

export default router;

