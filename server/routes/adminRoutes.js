import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import {
	bootstrapAdmin,
	getDashboard,
	listUsers,
	updateUser,
	listOrders,
	updateOrderStatus,
	listDeliveries,
	updateDelivery,
	listSubscriptions,
	updateSubscription,
	listMeals,
	updateMeal,
	deleteMeal,
	listReferrals,
	listRewardPayments,
	listReviews,
	updateReviewStatus,
} from '../controllers/adminController.js';
import {
	getTopMeals,
	getOrdersPerDay,
	getRevenuePerDay,
} from '../controllers/adminReportController.js';

const router = express.Router();

router.post('/bootstrap', bootstrapAdmin);

router.get('/dashboard', protect, requireAdmin, getDashboard);

router.get('/users', protect, requireAdmin, listUsers);
router.patch('/users/:id', protect, requireAdmin, updateUser);

router.get('/orders', protect, requireAdmin, listOrders);
router.patch('/orders/:id/status', protect, requireAdmin, updateOrderStatus);

router.get('/deliveries', protect, requireAdmin, listDeliveries);
router.patch('/deliveries/:id', protect, requireAdmin, updateDelivery);

router.get('/subscriptions', protect, requireAdmin, listSubscriptions);
router.patch('/subscriptions/:id', protect, requireAdmin, updateSubscription);

router.get('/meals', protect, requireAdmin, listMeals);
router.patch('/meals/:id', protect, requireAdmin, updateMeal);
router.delete('/meals/:id', protect, requireAdmin, deleteMeal);

router.get('/reports/top-meals', protect, requireAdmin, getTopMeals);
router.get('/reports/orders-per-day', protect, requireAdmin, getOrdersPerDay);
router.get('/reports/revenue', protect, requireAdmin, getRevenuePerDay);

router.get('/referrals', protect, requireAdmin, listReferrals);
router.get('/rewards', protect, requireAdmin, listRewardPayments);

router.get('/reviews', protect, requireAdmin, listReviews);
router.patch('/reviews/:id/status', protect, requireAdmin, updateReviewStatus);

export default router;

