import express from 'express';
import { 
  createSubscription,
  getUserSubscriptions,
  getSubscription,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription
} from '../controllers/subscriptionController.js';
import { protect } from '../middleware/authMiddleware.js'; // Your auth middleware

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create subscription
router.post('/', createSubscription);

// Get user's subscriptions
router.get('/', getUserSubscriptions);

// Get single subscription
router.get('/:id', getSubscription);

// Pause subscription
router.patch('/:id/pause', pauseSubscription);

// Resume subscription
router.patch('/:id/resume', resumeSubscription);

// Cancel subscription
router.delete('/:id', cancelSubscription);

export default router;