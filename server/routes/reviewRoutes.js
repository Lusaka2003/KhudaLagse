import express from "express";
import Review from "../models/Reviews.js";
import DeliveryStaffReview from "../models/DeliveryStaffReview.js";
import { User } from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";
import { getTopReviews, addReview } from "../controllers/reviewController.js";


const router = express.Router();

// DELIVERY STAFF - create/update review for delivery staff
router.post("/delivery-staff/:staffId", protect, async (req, res) => {
  try {
    const { rating, comment, orderId } = req.body;
    const { staffId } = req.params;

    const existing = await DeliveryStaffReview.findOne({ order: orderId });
    if (existing) {
      return res.status(400).json({ message: "You have already reviewed this delivery." });
    }

    const review = await DeliveryStaffReview.create({
      deliveryStaff: staffId,
      user: req.user.id,
      order: orderId,
      rating,
      comment
    });

    // Recalculate delivery staff aggregate rating
    const stats = await DeliveryStaffReview.aggregate([
      { $match: { deliveryStaff: review.deliveryStaff } },
      {
        $group: {
          _id: "$deliveryStaff",
          avgRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 }
        }
      }
    ]);

    await User.findByIdAndUpdate(staffId, {
      rating: stats[0] ? Number(stats[0].avgRating.toFixed(1)) : 0,
      totalRatings: stats[0] ? stats[0].totalRatings : 0
    });

    res.status(200).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit delivery staff review" });
  }
});

router.get("/delivery-staff/me", protect, async (req, res) => {
  try {
    const staffId = req.user._id || req.user.id;
    const reviews = await DeliveryStaffReview.find({ deliveryStaff: staffId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch delivery staff reviews" });
  }
});

router.get("/delivery-staff/:staffId", async (req, res) => {
  try {
    const reviews = await DeliveryStaffReview.find({ deliveryStaff: req.params.staffId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch delivery staff reviews" });
  }
});

// CREATE or UPDATE restaurant review
router.post("/:restaurantId", protect, addReview);

// GET top reviews (must be before /:restaurantId)
router.get("/top", getTopReviews);

// GET restaurant reviews
router.get("/:restaurantId", async (req, res) => {
  try {
    const reviews = await Review.find({ restaurant: req.params.restaurantId, status: 'approved' })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

export default router;
