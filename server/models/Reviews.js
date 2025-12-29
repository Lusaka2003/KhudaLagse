import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // restaurant user
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // customer
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
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      required: true
    }
  },
  { timestamps: true }
);

// One review per user per restaurant
reviewSchema.index({ restaurant: 1, user: 1 }, { unique: true });

reviewSchema.statics.getAverageRating = async function(restaurantId) {
  const stats = await this.aggregate([
    { $match: { restaurant: restaurantId, status: "approved" } },
    {
      $group: {
        _id: "$restaurant",
        avgRating: { $avg: "$rating" },
        totalRatings: { $sum: 1 }
      }
    }
  ]);

  try {
    await mongoose.model("User").findByIdAndUpdate(restaurantId, {
      rating: stats[0] ? Number(stats[0].avgRating.toFixed(1)) : 0,
      totalRatings: stats[0] ? stats[0].totalRatings : 0
    });
  } catch (err) {
    console.error(err);
  }
};

export default mongoose.model("Review", reviewSchema);
