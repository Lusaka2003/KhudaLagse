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

// Get next occurrence of a weekday
function getNextDateForDay(dayName) {
    const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const dayIndex = DAYS.indexOf(dayName.toLowerCase());
    if (dayIndex === -1) return new Date();

    const today = new Date();
    const todayIndex = today.getDay();
    let diff = dayIndex - todayIndex;
    if (diff <= 0) diff += 7;
    const nextDate = new Date();
    nextDate.setDate(today.getDate() + diff);
    return nextDate;
}

// Create or replace menu item
export const createMenuItem = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const user = await User.findById(userId);
        if (!user || user.role !== 'restaurant') return res.status(403).json({ success: false, message: 'Only restaurants can manage menu' });

        const { name, description = '', price, calories, ingredients, day, mealType } = req.body;
        if (!name || typeof price !== 'number' || price < 0) return res.status(400).json({ success: false, message: 'Name and numeric price are required' });
        if (!day) return res.status(400).json({ success: false, message: "Day is required" });
        if (!mealType || !['lunch','dinner'].includes(mealType.toLowerCase())) return res.status(400).json({ success: false, message: "Meal type is required (lunch or dinner)" });

        const date = getNextDateForDay(day);
        const imageUrl = await fetchPexelsImage(name);

        // Check existing menu for same day + mealType
        let item = await MenuItem.findOne({ restaurant: userId, day, mealType });

        if (item) {
            // Replace existing menu
            item.name = name;
            item.description = description;
            item.price = price;
            item.calories = typeof calories === 'number' ? calories : 0;
            item.ingredients = Array.isArray(ingredients)
                ? ingredients
                : (typeof ingredients === 'string' && ingredients.length ? ingredients.split(',').map(i => i.trim()) : []);
            item.date = date;
            item.imageUrl = imageUrl;
            await item.save();
        } else {
            // Create new menu item
            item = await MenuItem.create({
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
                date,
                imageUrl,
            });
            if (Array.isArray(user.menu)) {
                user.menu.push(item._id);
                await user.save();
            }
        }

        res.status(201).json({ success: true, data: item });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


// Get menu for the logged-in restaurant
export const getMenuForRestaurant = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const items = await MenuItem.find({ restaurant: userId }).sort({ createdAt: -1 });
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get menu by restaurant ID
export const getMenuByRestaurantId = async (req, res) => {
    try {
        const restaurantId = req.params.restaurantId;
        const items = await MenuItem.find({ restaurant: restaurantId })
            .select('-adminComment -adminCommentedAt -adminCommentedBy')
            .sort({ day: 1 });
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
        if (item.restaurant.toString() !== userId) return res.status(403).json({ success: false, message: 'Not allowed' });

        const { name, description, price, calories, ingredients, day, mealType, refetchImage, clearAdminComment } = req.body;

        if (name !== undefined) item.name = name;
        if (description !== undefined) item.description = description;
        if (typeof price === 'number') item.price = price;
        if (typeof calories === 'number') item.calories = calories;
        if (ingredients !== undefined) {
            item.ingredients = Array.isArray(ingredients)
                ? ingredients
                : (typeof ingredients === 'string' && ingredients.length ? ingredients.split(',').map(i => i.trim()) : []);
        }
        if (mealType && ['lunch','dinner'].includes(mealType.toLowerCase())) item.mealType = mealType;
        if (day && day !== item.day) {
            item.day = day;
            item.date = getNextDateForDay(day);
        }

        if (refetchImage === true || (name && req.body.refetchImage !== false)) {
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
        if (item.restaurant.toString() !== userId) return res.status(403).json({ success: false, message: 'Not allowed' });

        await MenuItem.findByIdAndDelete(itemId);
        await User.findByIdAndUpdate(userId, { $pull: { menu: itemId } });

        res.json({ success: true, message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Simple seeded random function
const seededRandom = (seed) => {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

// Get Menu of the Day
export const getMenuOfTheDay = async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0); // Simple seed sum

        const allItems = await MenuItem.find({}).populate('restaurant', 'name');
        
        if (allItems.length <= 5) {
            return res.json({ success: true, data: allItems });
        }

        // Shuffle using the seed
        const shuffled = [...allItems].sort(() => 0.5 - seededRandom(seed));

        // Return first 5
        const motd = shuffled.slice(0, 5);
        res.json({ success: true, data: motd });
    } catch (err) {
        console.error("MOTD Error:", err);
        res.status(500).json({ success: false, message: "Failed to fetch Menu of the Day" });
    }
};
