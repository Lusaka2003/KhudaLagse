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
    const token = req.headers.authorization?.split(" ")[1];
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
---------------------------------- */
router.post("/", protect, async (req, res) => {
  try {
    const {
      restaurantId,
      items,
      total,
      deliveryDateTime,
      paymentMethod = "wallet",
      deliveryAddress,
    } = req.body;

    if (!restaurantId || !items || !items.length || !total || !deliveryDateTime) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate delivery address
    if (!deliveryAddress || !deliveryAddress.fullAddress || !deliveryAddress.coordinates) {
      return res.status(400).json({ 
        message: "Delivery address is required with fullAddress and coordinates" 
      });
    }

    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Only customers can place orders
    if (user.role !== "customer") {
      return res.status(403).json({ 
        message: "Only customers can place orders" 
      });
    }

    // Validate wallet balance
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

    // Validate deliveryDateTime
    const deliveryDate = new Date(deliveryDateTime);
    if (isNaN(deliveryDate.getTime())) {
      return res.status(400).json({ message: "Invalid deliveryDateTime format" });
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items array is required" });
    }

    for (const item of items) {
      if (!item.itemId || !item.quantity || item.quantity < 1 || !item.price || item.price < 0) {
        return res.status(400).json({ 
          message: "Each item must have valid itemId, quantity (>=1), and price (>=0)" 
        });
      }
      if (!item.mealType || !["lunch", "dinner"].includes(item.mealType)) {
        return res.status(400).json({ 
          message: "Each item must have a valid mealType (lunch or dinner)" 
        });
      }
    }

    // Create order with deliveryAddress
    const order = new Order({
      restaurantId,
      userId,
      items,
      total,
      status: "pending",
      deliveryDateTime: deliveryDate,
      deliveryAddress: {
        fullAddress: deliveryAddress.fullAddress,
        coordinates: {
          type: "Point",
          coordinates: deliveryAddress.coordinates,
        },
        house: deliveryAddress.house || "",
        road: deliveryAddress.road || "",
        area: deliveryAddress.area || "",
        city: deliveryAddress.city || "Dhaka",
      },
    });

    const savedOrder = await order.save();

    // Process payment
    if (paymentMethod === "wallet") {
      // Deduct from wallet
      user.walletBalance = (user.walletBalance || 0) - total;
      await user.save();

      // Create payment record
      await Payment.create({
        user: userId,
        order: savedOrder._id,
        amount: total,
        type: "order_payment",
        method: "wallet",
        status: "success",
      });

      // Loyalty rewards
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
      // For other payment methods
      await Payment.create({
        user: userId,
        order: savedOrder._id,
        amount: total,
        type: "order_payment",
        method: paymentMethod,
        status: "pending",
      });
    }

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ message: "Failed to create order", error: error.message });
  }
});

/* ----------------------------------
   GET /api/orders/user/:userId
---------------------------------- */
router.get("/user/:userId", protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate("items.itemId", "name price");

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
      .populate("userId", "name email phone")
      .populate("items.itemId", "name price");

    res.json(orders);
  } catch (err) {
    console.error("Error fetching restaurant orders:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ----------------------------------
   GET /api/orders/calendar
   Get user's orders for a date range (for calendar view)
---------------------------------- */
router.get("/calendar", protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false,
        message: "startDate and endDate are required" 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD" 
      });
    }

    // Adjust end date to include the entire day
    end.setHours(23, 59, 59, 999);

    console.log(`📅 Fetching calendar data for user ${req.userId} from ${startDate} to ${endDate}`);

    // Get orders for the user within the date range
    const orders = await Order.find({
      userId: req.userId,
      deliveryDateTime: { $gte: start, $lte: end },
      status: { $nin: ['cancelled'] } // Exclude cancelled orders
    })
      .populate("items.itemId", "name price mealType imageUrl calories")
      .populate("restaurantId", "name imageUrl")
      .sort({ deliveryDateTime: 1 });

    console.log(`📊 Found ${orders.length} orders for the date range`);

    // Group orders by date
    const groupedByDate = {};
    
    orders.forEach(order => {
      const deliveryDate = new Date(order.deliveryDateTime);
      const dateKey = deliveryDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = {
          date: dateKey,
          orders: []
        };
      }

      // Flatten each item in the order
      order.items.forEach(item => {
        groupedByDate[dateKey].orders.push({
          _id: order._id,
          orderId: order._id,
          itemId: item.itemId,
          restaurant: order.restaurantId,
          mealType: item.mealType || (item.itemId?.mealType || 'lunch').toLowerCase(),
          quantity: item.quantity,
          price: item.price,
          status: order.status,
          isSubscription: order.isSubscription || false,
          deliveryDateTime: order.deliveryDateTime,
          createdAt: order.createdAt
        });
      });
    });

    // Convert to array format for frontend
    const result = Object.values(groupedByDate);

    console.log(`✅ Calendar data prepared: ${result.length} days with meals`);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("Calendar endpoint error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch calendar data",
      error: error.message 
    });
  }
});

/* ----------------------------------
   PATCH /api/orders/:orderId/status
---------------------------------- */
router.patch("/:orderId/status", protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!["pending", "cooking", "ready", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Create delivery record when order is ready
    if (status === "ready" && order.status !== "ready") {
      const existingDelivery = await Delivery.findOne({ order: orderId });
      if (!existingDelivery) {
        // Use the deliveryAddress from the order
        await Delivery.create({
          order: orderId,
          customer: order.userId,
          address: order.deliveryAddress || {
            house: "",
            road: "",
            area: "",
            city: "",
          },
          status: "unassigned",
          completionTime: order.deliveryDateTime,
        });
      }
    }

    // Process refund if cancelled
    if (status === "cancelled" && order.status !== "cancelled") {
      const payment = await Payment.findOne({
        order: orderId,
        type: "order_payment",
        status: "success",
      });

      if (payment && payment.method === "wallet") {
        const user = await User.findById(order.userId);
        if (user) {
          user.walletBalance = (user.walletBalance || 0) + payment.amount;
          await user.save();

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

      await Delivery.findOneAndUpdate({ order: orderId }, { status: "cancelled" });
    }

    order.status = status;
    const updatedOrder = await order.save();

    // Process referral rewards for completed orders
    if (status === "completed" || status === "delivered") {
      try {
        const customer = await User.findById(order.userId);
        if (customer && customer.referredBy) {
          const referral = await Referral.findOne({
            referrer: customer.referredBy,
            referredUser: order.userId,
            status: "pending",
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
                metadata: {
                  kind: "referrer_reward",
                  referredUserId: String(order.userId),
                  orderId: String(order._id),
                },
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
              metadata: {
                kind: "referred_user_reward",
                referrerId: String(customer.referredBy),
                orderId: String(order._id),
              },
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

    res.json(updatedOrder);
  } catch (error) {
    console.error("Failed to update order status:", error);
    res.status(500).json({ message: "Failed to update order status", error: error.message });
  }
});

/* ----------------------------------
   GET /api/orders/my
---------------------------------- */
router.get("/my", protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .populate("items.itemId", "name price")
      .populate("restaurantId", "name");

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
          isReviewed: !!review,
        };
      })
    );

    res.json(enrichedOrders);
  } catch (error) {
    console.error("Error in /my endpoint:", error);
    res.status(500).json({ 
      message: "Failed to fetch orders", 
      error: error.message 
    });
  }
});

/* ----------------------------------
   GET /api/orders/:orderId
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
      isReviewed: !!review,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch order" });
  }
});

/* ----------------------------------
   DELETE /api/orders/:orderId
---------------------------------- */
router.delete("/:orderId", protect, async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.orderId);
    if (!deleted) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete order" });
  }
});

export default router;