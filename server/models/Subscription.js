import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Meal Selection Schema
 * Tracks specific meals selected for specific days
 */
const mealSelectionSchema = new Schema({
  restaurantId: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true 
  },
  menuItemId: { 
    type: Schema.Types.ObjectId, 
    ref: "MenuItem", 
    required: true 
  },
  day: {
    type: String,
    enum: ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    required: true,
  },
  mealType: {
    type: String,
    enum: ["lunch", "dinner"],
    required: true,
  },
  quantity: { 
    type: Number, 
    required: true, 
    default: 1, 
    min: 1,
    max: 10 // Reasonable limit
  },
  price: { 
    type: Number, 
    required: true,
    min: 0 
  }, // Store price at time of subscription
  itemName: {
    type: String,
    // Store menu item name at time of selection
  },
  specialInstructions: {
    type: String,
    trim: true,
    maxlength: 500
  },
  paymentStatus: { 
    type: String, 
    enum: ["pending", "paid", "failed"], 
    default: "pending" 
  },
  deliveryDay: {
    type: Date,
    // Specific date for this meal delivery (calculated from day + week offset)
  },
  isDelivered: {
    type: Boolean,
    default: false
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: "Order",
    // Link to actual order when created
  }
});

/**
 * Subscription Model
 * Tracks customer subscription plans for meal delivery service
 */
const SubscriptionSchema = new Schema(
  {
    subscriptionId: {
      type: String,
      unique: true,
      // Auto-generated: SUB-20231215-001
    },
    user: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true 
    },
    restaurantId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true 
    },
    planType: {
      type: String,
      enum: ["weekly", "monthly", "custom"],
      required: true,
    },
    planName: {
      type: String,
      trim: true,
      // e.g., "Premium Weekly", "Student Monthly"
    },
    startDate: { 
      type: Date, 
      required: true,
      index: true 
    },
    endDate: { 
      type: Date,
      index: true 
    },
    status: {
      type: String,
      enum: ["active", "paused", "cancelled", "expired", "halted", "pending_payment"],
      default: "pending_payment",
      index: true
    },
    pauseStartDate: {
      type: Date,
      // When subscription was paused
    },
    pauseEndDate: {
      type: Date,
      // When subscription should resume
    },
    cancellationDate: {
      type: Date,
      // When subscription was cancelled
    },
    cancellationReason: {
      type: String,
      trim: true
    },
    mealsPerWeek: { 
      type: Number, 
      default: 7, // default: daily meals
      min: 1,
      max: 14 // Lunch + Dinner for all days
    },
    deliveryDays: [{
      type: String,
      enum: ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    }],
    deliveryTime: {
      type: String,
      // e.g., "12:00-13:00" for lunch, "19:00-20:00" for dinner
    },
    isRepeating: { 
      type: Boolean, 
      default: true 
    }, // Whether subscription repeats weekly/monthly
    repeatFrequency: {
      type: Number,
      default: 1,
      min: 1,
      // Frequency in weeks/months
    },
    mealSelections: [mealSelectionSchema], // Specific meals for specific days
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    subtotal: {
      type: Number,
      min: 0
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "mobile_banking", "wallet", "subscription_wallet"],
      default: "cash"
    },
    autoRenew: {
      type: Boolean,
      default: true
    },
    nextBillingDate: {
      type: Date
    },
    lastBillingDate: {
      type: Date
    },
    billingCycle: {
      type: String,
      enum: ["weekly", "monthly", "custom"],
      default: "weekly"
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    deliveredMealsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    remainingMealsCount: {
      type: Number,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
  }
);

// Index for common queries
SubscriptionSchema.index({ user: 1, restaurantId: 1 });
SubscriptionSchema.index({ status: 1, startDate: 1 });
SubscriptionSchema.index({ user: 1, status: 1 });
SubscriptionSchema.index({ restaurantId: 1, status: 1 });
SubscriptionSchema.index({ endDate: 1, status: 1 });

// Pre-save hooks
SubscriptionSchema.pre('save', async function(next) {
  // Generate subscription ID
  if (!this.subscriptionId) {
    const date = new Date();
    const prefix = 'SUB';
    const timestamp = date.getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.subscriptionId = `${prefix}-${timestamp}${random}`;
  }
  
  // Calculate end date if not provided for certain plan types
  if (!this.endDate && this.startDate) {
    const endDate = new Date(this.startDate);
    if (this.planType === 'weekly') {
      endDate.setDate(endDate.getDate() + 7);
    } else if (this.planType === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    this.endDate = endDate;
  }
  
  // Update isActive based on status and dates
  const now = new Date();
  if (this.status === 'active' && this.endDate && this.endDate < now) {
    this.status = 'expired';
    this.isActive = false;
  } else if (['active', 'paused'].includes(this.status)) {
    this.isActive = true;
  } else {
    this.isActive = false;
  }
  
  next();
});

// Instance method to check if subscription is deliverable today
SubscriptionSchema.methods.isDeliverableToday = function() {
  if (this.status !== 'active' && this.status !== 'paused') {
    return false;
  }
  
  const today = new Date();
  if (today < this.startDate || (this.endDate && today > this.endDate)) {
    return false;
  }
  
  // Check if paused
  if (this.status === 'paused') {
    const now = new Date();
    if (this.pauseStartDate && now >= this.pauseStartDate && 
        (!this.pauseEndDate || now <= this.pauseEndDate)) {
      return false;
    }
  }
  
  // Check delivery days
  if (this.deliveryDays && this.deliveryDays.length > 0) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = days[today.getDay()];
    return this.deliveryDays.includes(todayName);
  }
  
  return true;
};

// Static method to find active subscriptions by user
SubscriptionSchema.statics.findActiveByUser = function(userId) {
  return this.find({
    user: userId,
    status: 'active',
    startDate: { $lte: new Date() },
    $or: [
      { endDate: { $gte: new Date() } },
      { endDate: null }
    ]
  }).populate('restaurantId', 'name logo')
    .populate('mealSelections.menuItemId', 'name description image');
};

const Subscription = mongoose.model("Subscription", SubscriptionSchema);

export default Subscription;