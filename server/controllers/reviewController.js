import Review from "../models/Reviews.js";
import DeliveryStaffReview from "../models/DeliveryStaffReview.js";
import { User } from "../models/User.js";

export const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { restaurantId } = req.params; // <- get from URL param
    const userId = req.user.id;

    if (!restaurantId) {
      return res.status(400).json({ error: "Restaurant ID is required" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // Create or update review
    const review = await Review.findOneAndUpdate(
      { restaurant: restaurantId, user: userId },
      { rating, comment, status: 'approved' },
      { new: true, upsert: true, runValidators: true }
    );

    // Populate user info so frontend can show the name immediately
    await review.populate("user", "name");

    // Recalculate restaurant rating (based on approved reviews only)
    await Review.getAverageRating(review.restaurant);

    res.status(201).json({ success: true, review });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getTopReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'approved', rating: 5, comment: { $ne: "" } })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("user", "name role");
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch top reviews" });
  }
};
