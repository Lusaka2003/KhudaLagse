import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Meal Selection Schema
 * Tracks specific meals selected for specific days
 */
const mealSelectionSchema = new Schema({
  restaurantId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
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
  quantity: { type: Number, required: true, default: 1, min: 1 },
  price: { type: Number, required: true }, // Store price at time of subscription
  paymentStatus: { type: String, enum: ["paid", "unpaid"], default: "unpaid" },
});

/**
 * Subscription Model
 * 
 * Tracks customer subscription plans for meal delivery service
 */
const SubscriptionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    planType: {
      type: String,
      enum: ["weekly", "monthly", "custom"],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ["active", "paused", "cancelled", "expired", "halted"],
      default: "active",
    },
    mealsPerWeek: { type: Number, default: 7 }, // default: daily meals
    isRepeating: { type: Boolean, default: true }, // Whether subscription repeats weekly
    mealSelections: [mealSelectionSchema], // Specific meals for specific days
  },
  {
    timestamps: true,
  }
);

const Subscription = mongoose.model("Subscription", SubscriptionSchema);

export default Subscription;

