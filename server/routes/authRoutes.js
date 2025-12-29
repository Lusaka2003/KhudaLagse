import express from 'express';
import { 
	register, 
	login, 
	verifyEmail, 
	resendVerificationCode ,
	forgotPassword, 
	resetPassword
} from '../controllers/authController.js';
import { validateRegister, validateLogin } from '../middleware/validate.js';
import { protect } from '../middleware/authMiddleware.js';
import {
	updateRestaurantAddress,
	updateRestaurantStatus,
} from '../controllers/restaurantController.js';
import {
	addFavorite,
	removeFavorite,
	getFavorites,
	getProfile,
	updateProfile,
} from '../controllers/userController.js';

const router = express.Router();

// Authentication routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/verify-email', verifyEmail); // New - Email verification
router.post('/resend-verification', resendVerificationCode); // New - Resend code

// Restaurant routes
router.put('/update-restaurant', protect, updateRestaurantAddress);
router.put('/update-restaurant-status', protect, updateRestaurantStatus);

// User profile routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Favorites routes
router.post('/favorites/:restaurantId', protect, addFavorite);
router.delete('/favorites/:restaurantId', protect, removeFavorite);
router.get('/favorites', protect, getFavorites);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
export default router;