import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Delivery Model
 *
 * Tracks assignment and progress of deliveries for:
 * - Delivery history
 * - Real-time delivery tracking (manual location updates)
 */
const DeliverySchema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deliveryStaff: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false, // Initially unassigned, becomes required when assigned
    },
    address: {
      house: { type: String, default: "" },
      road: { type: String, default: "" },
      area: { type: String, default: "" },
      city: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["unassigned", "assigned", "picked_up", "on_the_way", "delivered", "cancelled"],
      default: "unassigned",
    },
    completionTime: {
      type: Date, // When restaurant expects order to be ready
    },
    currentLocation: {
      lat: { type: Number },
      lng: { type: Number },
      lastUpdatedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

const Delivery = mongoose.model("Delivery", DeliverySchema);

export default Delivery;


