import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    createMenuItem,
    getMenuForRestaurant,
    getMenuByRestaurantId,
    updateMenuItem,
    deleteMenuItem,
    getMenuOfTheDay,
} from '../controllers/menuController.js';

const router = express.Router();

// Protected endpoints for the authenticated restaurant user
router.post('/', protect, createMenuItem);
router.get('/', protect, getMenuForRestaurant);
router.put('/:id', protect, updateMenuItem);
router.delete('/:id', protect, deleteMenuItem);


// Public endpoint to fetch menu by restaurant id
router.get('/restaurant/:restaurantId', getMenuByRestaurantId);

// Menu of the Day
router.get('/motd', getMenuOfTheDay);

export default router;