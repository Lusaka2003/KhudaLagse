import express from 'express';
import { createCheckoutSession, verifyPayment } from '../controllers/paymentController.js'; // Import verifyPayment
import { protect } from '../middleware/authMiddleware.js'; 

const router = express.Router();

router.post('/create-checkout-session', protect, createCheckoutSession);

// --- ADD THIS NEW ROUTE ---
router.post('/success', protect, verifyPayment);

export default router;