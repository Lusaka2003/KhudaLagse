import { MenuItem } from '../models/MenuItem.js';
import { User } from '../models/User.js';

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800';

// Fetch image from Pexels
async function fetchPexelsImage(query) {
    try {
        if (!process.env.PEXELS_API_KEY) return FALLBACK_IMAGE;

        const searchQuery = `${query} food meal`;
        const q = encodeURIComponent(searchQuery);
        const url = `https://api.pexels.com/v1/search?query=${q}`;

        const res = await fetch(url, { headers: { Authorization: process.env.PEXELS_API_KEY } });
        if (!res.ok) return FALLBACK_IMAGE;

        const data = await res.json();
        if (!data.photos || !data.photos.length) return FALLBACK_IMAGE;

        const photo = data.photos[0];
        return photo.src.large || photo.src.original || FALLBACK_IMAGE;
    } catch (err) {
        console.error('Error fetching Pexels image:', err.message);
        return FALLBACK_IMAGE;
    }
}

// Get day name from date
function getDayNameFromDate(date) {
    const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = new Date(date).getDay();
    return DAYS[dayIndex];
}

// Create or replace menu item
export const createMenuItem = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const user = await User.findById(userId);
        if (!user || user.role !== 'restaurant') {
            return res.status(403).json({ success: false, message: 'Only restaurants can manage menu' });
        }

        const { name, description = '', price, calories, ingredients, date, mealType, imageUrl } = req.body;
        
        if (!name || typeof price !== 'number' || price < 0) {
            return res.status(400).json({ success: false, message: 'Name and numeric price are required' });
        }
        if (!date) {
            return res.status(400).json({ success: false, message: 'Date is required' });
        }
        if (!mealType || !['lunch', 'dinner'].includes(mealType.toLowerCase())) {
            return res.status(400).json({ success: false, message: 'Meal type is required (lunch or dinner)' });
        }

        // Parse and normalize the date
        const menuDate = new Date(date);
        menuDate.setHours(0, 0, 0, 0);
        
        // Get day name from the provided date
        const day = getDayNameFromDate(menuDate);
        
        // Use provided imageUrl, or fetch from Pexels if not provided
        let finalImageUrl = imageUrl || await fetchPexelsImage(name);

        // Always create a new menu item (allows multiple items per date/meal)
        const item = await MenuItem.create({
            name,
            description,
            price,
            calories: typeof calories === 'number' ? calories : 0,
            ingredients: Array.isArray(ingredients)
                ? ingredients
                : (typeof ingredients === 'string' && ingredients.length ? ingredients.split(',').map(i => i.trim()) : []),
            restaurant: userId,
            day,
            mealType,
            date: menuDate,
            imageUrl: finalImageUrl,
        });
        
        if (Array.isArray(user.menu)) {
            user.menu.push(item._id);
            await user.save();
        }

        res.status(201).json({ success: true, data: item });
    } catch (err) {
        console.error('Error creating menu item:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get menu for the logged-in restaurant
export const getMenuForRestaurant = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        // Get query parameters for filtering
        const { startDate, endDate, upcoming } = req.query;

        let query = { restaurant: userId };

        if (upcoming === 'true') {
            // Get only upcoming menu items
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            query.date = { $gte: today };
        } else if (startDate && endDate) {
            // Get menu items in a specific date range
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else if (startDate) {
            // Get menu items from startDate onwards
            query.date = { $gte: new Date(startDate) };
        }

        const items = await MenuItem.find(query).sort({ date: 1, mealType: 1 });
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get menu by restaurant ID (for customers)
export const getMenuByRestaurantId = async (req, res) => {
    try {
        const restaurantId = req.params.restaurantId;
        const { startDate, endDate, upcoming } = req.query;

        let query = { restaurant: restaurantId };

        if (upcoming === 'true') {
            // Get only upcoming menu items
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            query.date = { $gte: today };
        } else if (startDate && endDate) {
            // Get menu items in a specific date range
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const items = await MenuItem.find(query)
            .select('-adminComment -adminCommentedAt -adminCommentedBy')
            .sort({ date: 1, mealType: 1 });
            
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Update menu item
export const updateMenuItem = async (req, res) => {
    try {
        const userId = req.user?.id;
        const itemId = req.params.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const item = await MenuItem.findById(itemId);
        if (!item) return res.status(404).json({ success: false, message: 'Menu item not found' });
        if (item.restaurant.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Not allowed' });
        }

        const { name, description, price, calories, ingredients, date, mealType, imageUrl, refetchImage, clearAdminComment } = req.body;

        if (name !== undefined) item.name = name;
        if (description !== undefined) item.description = description;
        if (typeof price === 'number') item.price = price;
        if (typeof calories === 'number') item.calories = calories;
        if (ingredients !== undefined) {
            item.ingredients = Array.isArray(ingredients)
                ? ingredients
                : (typeof ingredients === 'string' && ingredients.length ? ingredients.split(',').map(i => i.trim()) : []);
        }
        if (mealType && ['lunch', 'dinner'].includes(mealType.toLowerCase())) {
            item.mealType = mealType;
        }
        
        // Handle date updates
        if (date && date !== item.date.toISOString()) {
            const newDate = new Date(date);
            newDate.setHours(0, 0, 0, 0);
            item.date = newDate;
            item.day = getDayNameFromDate(newDate);
        }

        // Handle image updates
        if (imageUrl !== undefined) {
            item.imageUrl = imageUrl;
        } else if (refetchImage === true || (name && req.body.refetchImage !== false && !req.body.imageUrl)) {
            item.imageUrl = await fetchPexelsImage(item.name);
        }

        if (clearAdminComment === true) {
            item.adminComment = '';
            item.adminCommentedAt = null;
            item.adminCommentedBy = null;
        }

        item.updatedAt = new Date();
        await item.save();

        res.json({ success: true, data: item });
    } catch (err) {
        console.error('Error updating menu item:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Delete menu item
export const deleteMenuItem = async (req, res) => {
    try {
        const userId = req.user?.id;
        const itemId = req.params.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const item = await MenuItem.findById(itemId);
        if (!item) return res.status(404).json({ success: false, message: 'Menu item not found' });
        if (item.restaurant.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Not allowed' });
        }

        await MenuItem.findByIdAndDelete(itemId);
        await User.findByIdAndUpdate(userId, { $pull: { menu: itemId } });

        res.json({ success: true, message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Bulk delete old menu items
export const deleteOldMenuItems = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const user = await User.findById(userId);
        if (!user || user.role !== 'restaurant') {
            return res.status(403).json({ success: false, message: 'Only restaurants can manage menu' });
        }

        const { daysAgo = 7 } = req.query;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysAgo));
        cutoffDate.setHours(0, 0, 0, 0);

        const result = await MenuItem.deleteMany({
            restaurant: userId,
            date: { $lt: cutoffDate }
        });

        res.json({ 
            success: true, 
            message: `Deleted ${result.deletedCount} old menu items`,
            deletedCount: result.deletedCount 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Simple seeded random function
const seededRandom = (seed) => {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

// Get Menu of the Day (today's menu items from all restaurants)
export const getMenuOfTheDay = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get all menu items for today
        const todayItems = await MenuItem.find({
            date: {
                $gte: today,
                $lt: tomorrow
            }
        }).populate('restaurant', 'name');

        // If we have 5 or fewer items, return them all
        if (todayItems.length <= 5) {
            return res.json({ success: true, data: todayItems });
        }

        // Use today's date as seed for consistent daily randomization
        const todayString = today.toISOString().slice(0, 10);
        const seed = todayString.split('-').reduce((a, b) => a + parseInt(b), 0);

        // Shuffle using the seed
        const shuffled = [...todayItems].sort(() => 0.5 - seededRandom(seed));

        // Return first 5
        const motd = shuffled.slice(0, 5);
        res.json({ success: true, data: motd });
    } catch (err) {
        console.error('MOTD Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch Menu of the Day' });
    }
};

// Get menu items for the next N days (useful for weekly/monthly view)
export const getUpcomingMenu = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { days = 30 } = req.query;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const endDate = new Date(today);
        endDate.setDate(today.getDate() + parseInt(days));

        const items = await MenuItem.find({
            restaurant: restaurantId,
            date: {
                $gte: today,
                $lt: endDate
            }
        })
        .select('-adminComment -adminCommentedAt -adminCommentedBy')
        .sort({ date: 1, mealType: 1 });

        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};