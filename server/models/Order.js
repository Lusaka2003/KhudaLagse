import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MenuItem",
    required: true,
  },
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true },
  mealType: { type: String, enum: ["lunch", "dinner"], required: true }, // added
  day: { type: String }, // optional: store the day of the meal
});

const orderSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "cooking", "ready", "completed", "cancelled"],
      default: "pending",
    },
    deliveryDateTime: { type: Date }, // store both date and time
    deliveryAddress: {
      fullAddress: { type: String, required: true },
      coordinates: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], required: true }, // [longitude, latitude]
      },
      house: { type: String, default: "" },
      road: { type: String, default: "" },
      area: { type: String, default: "" },
      city: { type: String, default: "Dhaka" },
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    }, // optional: links if it was a sub order
    paymentStatus: { type: String, enum: ["paid", "unpaid"], default: "paid" },
    isSubscription: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);