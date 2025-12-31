import mongoose from 'mongoose';
const { Schema } = mongoose;

const MenuItemSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true },
    restaurant: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    calories: { type: Number, default: 0 },
    ingredients: [{ type: String }],
    imageUrl: { type: String, required: true },
    adminComment: { type: String, default: '' },
    adminCommentedAt: { type: Date, default: null },
    adminCommentedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    
    // Day name (kept for backward compatibility and easy filtering)
    day: {
        type: String,
        enum: [
            'sunday',
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
        ],
        required: true
    },
    
    // Meal type: lunch or dinner
    mealType: {
        type: String,
        enum: ['lunch', 'dinner'],
        required: true
    },
    
    // Specific date for this menu item (primary field for monthly planning)
    date: { type: Date, required: true },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Automatically update `updatedAt` on save
MenuItemSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Create a compound index for efficient querying (non-unique to allow multiple items)
// This allows multiple menu items per restaurant per date per meal type
MenuItemSchema.index({ restaurant: 1, date: 1, mealType: 1 });

// Index for efficient querying by date range
MenuItemSchema.index({ date: 1 });

// Index for querying by restaurant and date range
MenuItemSchema.index({ restaurant: 1, date: 1 });

// Virtual field to get date in YYYY-MM-DD format
MenuItemSchema.virtual('dateString').get(function() {
    return this.date.toISOString().split('T')[0];
});

// Method to check if menu item is in the past
MenuItemSchema.methods.isPast = function() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.date < today;
};

// Method to check if menu item is today
MenuItemSchema.methods.isToday = function() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const itemDate = new Date(this.date);
    itemDate.setHours(0, 0, 0, 0);
    return itemDate.getTime() === today.getTime();
};

// Static method to get menu items for a specific date range
MenuItemSchema.statics.getByDateRange = function(restaurantId, startDate, endDate) {
    return this.find({
        restaurant: restaurantId,
        date: {
            $gte: startDate,
            $lte: endDate
        }
    }).sort({ date: 1, mealType: 1 });
};

// Static method to get upcoming menu items
MenuItemSchema.statics.getUpcoming = function(restaurantId, days = 30) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + days);
    
    return this.find({
        restaurant: restaurantId,
        date: {
            $gte: today,
            $lt: endDate
        }
    }).sort({ date: 1, mealType: 1 });
};

// Static method to delete past menu items (cleanup utility)
MenuItemSchema.statics.deletePast = function(restaurantId, daysAgo = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    cutoffDate.setHours(0, 0, 0, 0);
    
    return this.deleteMany({
        restaurant: restaurantId,
        date: { $lt: cutoffDate }
    });
};

export const MenuItem = mongoose.model('MenuItem', MenuItemSchema);