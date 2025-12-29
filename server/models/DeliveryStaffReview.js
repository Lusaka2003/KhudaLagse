import mongoose from "mongoose";

const deliveryStaffReviewSchema = new mongoose.Schema(
  {
    deliveryStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // delivery staff user
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // customer
      required: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order", // reference to the order
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// One review per user per delivery staff per order
deliveryStaffReviewSchema.index({ deliveryStaff: 1, user: 1, order: 1 }, { unique: true });

export default mongoose.model("DeliveryStaffReview", deliveryStaffReviewSchema);
