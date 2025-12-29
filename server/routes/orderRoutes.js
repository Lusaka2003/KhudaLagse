import express from "express";
import Order from "../models/Order.js";
import { User } from "../models/User.js";
import Payment from "../models/Payment.js";
import Subscription from "../models/Subscription.js";
import Delivery from "../models/Delivery.js";
import Referral from "../models/Referral.js";
import DeliveryStaffReview from "../models/DeliveryStaffReview.js";

import jwt from "jsonwebtoken";

const router = express.Router();

/* ----------------------------------
   Middleware: Protect Routes
---------------------------------- */
const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>
    if (!token) return res.status(401).json({ message: "Unauthorized: No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id isActive");
    if (!user) return res.status(401).json({ message: "Unauthorized: Invalid token" });
    if (user.isActive === false) return res.status(403).json({ message: "Account is disabled" });
    req.userId = user._id.toString();
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

/* ----------------------------------
   POST /api/orders
   Create a new order with delivery date & time
   Validates wallet balance and subscription (if applicable)
   Processes payment and creates payment record
---------------------------------- */
router.post("/", protect, async (req, res) => {
  try {
    const { restaurantId, items, total, deliveryDateTime, paymentMethod = "wallet" } = req.body;

    if (!restaurantId || !items || !items.length || !total || !deliveryDateTime) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only customers can place orders
    if (user.role !== "customer") {
      return res.status(403).json({ 
        message: "Only customers can place orders. Restaurants and delivery drivers cannot place orders." 
      });
    }

    // Check for active subscription (optional - if subscription exists)
    const activeSubscription = await Subscription.findOne({
      user: userId,
      status: "active",
      $or: [
        { endDate: { $gte: new Date() } },
        { endDate: null }
      ]
    });

    // Validate wallet balance if paying with wallet
    if (paymentMethod === "wallet") {
      const walletBalance = user.walletBalance || 0;
      if (walletBalance < total) {
        return res.status(400).json({
          message: "Insufficient wallet balance",
          walletBalance,
          required: total,
        });
      }
    }

    // Convert deliveryDateTime to Date object
    const deliveryDate = new Date(deliveryDateTime);
    if (isNaN(deliveryDate.getTime())) {
      return res.status(400).json({ message: "Invalid deliveryDateTime format" });
    }

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items array is required and must not be empty" });
    }

    // Validate each item
    for (const item of items) {
      if (!item.itemId || !item.quantity || item.quantity < 1 || !item.price || item.price < 0) {
        return res.status(400).json({ message: "Each item must have valid itemId, quantity (>=1), and price (>=0)" });
      }
      if (!item.mealType || !["lunch", "dinner"].includes(item.mealType)) {
        return res.status(400).json({ message: "Each item must have a valid mealType (lunch or dinner)" });
      }
    }

    // Create order
    const order = new Order({
      restaurantId,
      userId,
      items,
      total,
      status: "pending",
      deliveryDateTime: deliveryDate,
    });

    const saved = await order.save();

    // Order is created as 'pending'. Delivery will be created only when restaurant marks it as 'ready'.

    // Process payment
    if (paymentMethod === "wallet") {
      // Deduct from wallet
      user.walletBalance = (user.walletBalance || 0) - total;
      await user.save();

      // Create payment record
      await Payment.create({
        user: userId,
        order: saved._id,
        amount: total,
        type: "order_payment",
        method: "wallet",
        status: "success",
      });



      const orderPaymentCount = await Payment.countDocuments({
        user: userId,
        type: "order_payment",
        status: "success",
      });

      if (orderPaymentCount > 0 && orderPaymentCount % 10 === 0) {
        const milestone = orderPaymentCount;
        const existingReward = await Payment.exists({
          user: userId,
          type: "reward",
          "metadata.kind": "loyalty",
          "metadata.milestone": milestone,
        });

        if (!existingReward) {
          const rewardAmount = 20;
          user.walletBalance = (user.walletBalance || 0) + rewardAmount;
          await user.save();
          await Payment.create({
            user: userId,
            amount: rewardAmount,
            type: "reward",
            method: "wallet",
            status: "success",
            metadata: { kind: "loyalty", milestone },
          });
        }
      }
    } else {
      // For card/local_app, create pending payment record
      // In production, integrate with payment gateway here
      await Payment.create({
        user: userId,
        order: saved._id,
        amount: total,
        type: "order_payment",
        method: paymentMethod,
        status: "pending", // Will be updated when payment gateway confirms
      });
    }

    res.status(201).json(saved);
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ message: "Failed to create order" });
  }
});

/* ----------------------------------
   GET /api/orders/user/:userId
   Returns orders with payment and delivery info
---------------------------------- */
router.get("/user/:userId", protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate("items.itemId", "name price");

    // Enrich orders with payment and delivery info
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const payment = await Payment.findOne({
          order: order._id,
          type: "order_payment",
        });
        const delivery = await Delivery.findOne({ order: order._id });

        return {
          ...order.toObject(),
          payment: payment || null,
          delivery: delivery || null,
        };
      })
    );

    res.json(enrichedOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch user orders" });
  }
});

/* ----------------------------------
   GET /api/orders/restaurant/:restaurantId
---------------------------------- */
router.get("/restaurant/:restaurantId", protect, async (req, res) => {
  try {
    const orders = await Order.find({ restaurantId: req.params.restaurantId })
      .populate("userId", "name email phone")  // customer info
      .populate("items.itemId", "name price"); // menu item info

    res.json(orders);
  } catch (err) {
    console.error("Error fetching restaurant orders:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ----------------------------------
   PATCH /api/orders/:orderId/status
   Updates order status and creates delivery record when accepted
---------------------------------- */
router.patch("/:orderId/status", protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, completionTime } = req.body;

    if (!["pending", "cooking", "ready", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findById(orderId).populate("userId");
    if (!order) return res.status(404).json({ message: "Order not found" });

    // When status is changed to 'ready', create the unassigned delivery record
    if (status === "ready" && order.status !== "ready") {
      const existingDelivery = await Delivery.findOne({ order: orderId });
      if (!existingDelivery) {
        const customer = await User.findById(order.userId);
        const address = customer?.address || {
          house: "",
          road: "",
          area: "",
          city: "",
        };

        await Delivery.create({
          order: orderId,
          customer: order.userId,
          address,
          status: "unassigned",
          completionTime: order.deliveryDateTime, // or a specific ready time
        });
      }
    }

    // If order is cancelled, process refund
    if (status === "cancelled" && order.status !== "cancelled") {
      const payment = await Payment.findOne({
        order: orderId,
        type: "order_payment",
        status: "success",
      });

      if (payment && payment.method === "wallet") {
        // Refund to wallet
        const user = await User.findById(order.userId);
        if (user) {
          user.walletBalance = (user.walletBalance || 0) + payment.amount;
          await user.save();

          // Create refund record
          await Payment.create({
            user: order.userId,
            order: orderId,
            amount: payment.amount,
            type: "refund",
            method: "wallet",
            status: "success",
          });
        }
      }

      // Also cancel associated delivery if it exists
      await Delivery.findOneAndUpdate({ order: orderId }, { status: "cancelled" });
    }

    order.status = status;
    const updated = await order.save();

    // Replicate referral logic if completed
    if (status === "completed" || status === "delivered") {
      try {
        const customer = await User.findById(order.userId);
        if (customer && customer.referredBy) {
          const referral = await Referral.findOne({
            referrer: customer.referredBy,
            referredUser: order.userId,
            status: "pending"
          });

          if (referral) {
            const rewardAmount = 30;
            const referrer = await User.findById(customer.referredBy);
            
            // Reward Referrer
            if (referrer) {
              referrer.walletBalance = (referrer.walletBalance || 0) + rewardAmount;
              await referrer.save();
              await Payment.create({
                user: referrer._id,
                order: order._id,
                amount: rewardAmount,
                type: "referral_reward",
                method: "wallet",
                status: "success",
                metadata: { kind: "referrer_reward", referredUserId: String(order.userId), orderId: String(order._id) }
              });
            }

            // Reward Referred User
            customer.walletBalance = (customer.walletBalance || 0) + rewardAmount;
            await customer.save();
            await Payment.create({
              user: customer._id,
              order: order._id,
              amount: rewardAmount,
              type: "referral_reward",
              method: "wallet",
              status: "success",
              metadata: { kind: "referred_user_reward", referrerId: String(customer.referredBy), orderId: String(order._id) }
            });

            referral.status = "rewarded";
            referral.rewardAmount = rewardAmount * 2;
            referral.rewardedAt = new Date();
            await referral.save();
          }
        }
      } catch (err) {
        console.error("Referral processing error:", err);
      }
    }


    res.json(updated);
  } catch (error) {
    console.error("Failed to update order status:", error);
    if (error.message === "No available delivery staff to assign this order") {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to update order status" });
  }
});


/* ----------------------------------
   GET /api/orders/my
   Get current user's orders (using JWT userId)
---------------------------------- */
router.get("/my", protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .populate("items.itemId", "name price")
      .populate("restaurantId", "name");

    // Enrich orders with payment and delivery info
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const payment = await Payment.findOne({
          order: order._id,
          type: "order_payment",
        });
        const delivery = await Delivery.findOne({ order: order._id })
          .populate("deliveryStaff", "name phone");
        
        const review = await DeliveryStaffReview.exists({ order: order._id });

        return {
          ...order.toObject(),
          payment: payment || null,
          delivery: delivery || null,
          isReviewed: !!review
        };

      })
    );

    res.json(enrichedOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

/* ----------------------------------
   GET /api/orders/:orderId
   Get single order with full details (payment + delivery)
---------------------------------- */
router.get("/:orderId", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("items.itemId", "name price")
      .populate("restaurantId", "name")
      .populate("userId", "name email phone");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user owns this order or is restaurant owner
    const user = await User.findById(req.userId);
    const isOwner = order.userId._id.toString() === req.userId;
    const isRestaurantOwner = user?.role === "restaurant" && 
      order.restaurantId._id.toString() === req.userId;

    if (!isOwner && !isRestaurantOwner && user?.role !== "deliveryStaff") {
      return res.status(403).json({ message: "Access denied" });
    }

    const payment = await Payment.findOne({
      order: order._id,
      type: "order_payment",
    });
    const delivery = await Delivery.findOne({ order: order._id })
      .populate("deliveryStaff", "name phone");

    const review = await DeliveryStaffReview.exists({ order: order._id });

    res.json({
      ...order.toObject(),
      payment: payment || null,
      delivery: delivery || null,
      isReviewed: !!review
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch order" });
  }
});

router.delete("/:orderId", protect, async (req, res) => {
  const { orderId } = req.params;
  try {
    const deleted = await Order.findByIdAndDelete(orderId);
    if (!deleted) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete order" });
  }
});

export default router;
