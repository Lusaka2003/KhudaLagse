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

    // One menu item per day
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

    // Actual date of the next occurrence of this weekday
    date: { type: Date, required: true },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Automatically update `updatedAt` on save
MenuItemSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

export const MenuItem = mongoose.model('MenuItem', MenuItemSchema);
