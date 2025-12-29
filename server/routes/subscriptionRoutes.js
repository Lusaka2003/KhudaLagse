import express from "express";
import jwt from "jsonwebtoken";
import Subscription from "../models/Subscription.js";
import { User } from "../models/User.js";
import { MenuItem } from "../models/MenuItem.js";
import Payment from "../models/Payment.js";
import Order from "../models/Order.js";

const router = express.Router();

// Middleware: Protect Routes
const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized: No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id isActive role");
    if (!user) return res.status(401).json({ message: "Unauthorized: Invalid token" });
    if (user.isActive === false) return res.status(403).json({ message: "Account is disabled" });
    if (user.role !== "customer") return res.status(403).json({ message: "Only customers can manage subscriptions" });
    
    req.userId = user._id.toString();
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

// GET /api/subscriptions - Get user's subscriptions
router.get("/", protect, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.userId })
      .populate("restaurantId", "name")
      .populate("mealSelections.menuItemId", "name description imageUrl price")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: subscriptions });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ success: false, message: "Failed to fetch subscriptions" });
  }
});

// POST /api/subscriptions - Create a new subscription
router.post("/", protect, async (req, res) => {
  try {
    const { restaurantId, mealSelections, planType = "weekly", isRepeating = true } = req.body;

    if (!restaurantId || !mealSelections || !Array.isArray(mealSelections) || mealSelections.length === 0) {
      return res.status(400).json({ success: false, message: "Restaurant ID and meal selections are required" });
    }

    // Validate meal selections
    for (const selection of mealSelections) {
      if (!selection.menuItemId || !selection.day || !selection.mealType || !selection.quantity) {
        return res.status(400).json({ success: false, message: "Each meal selection must have menuItemId, day, mealType, and quantity" });
      }
      
      const menuItem = await MenuItem.findById(selection.menuItemId);
      if (!menuItem) {
        return res.status(404).json({ success: false, message: `Menu item ${selection.menuItemId} not found` });
      }
      
      selection.price = menuItem.price;
      selection.restaurantId = restaurantId;
      selection.paymentStatus = "unpaid";
    }

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // Start of today
    const endDate = isRepeating ? null : new Date(startDate);
    if (!isRepeating) {
      endDate.setDate(endDate.getDate() + 7);
    }

    const subscription = await Subscription.create({
      user: req.userId,
      restaurantId,
      planType,
      startDate,
      endDate,
      isRepeating,
      mealSelections,
      mealsPerWeek: mealSelections.length,
      status: "active",
    });

    // --- Calculate Upfront Cost and Pre-generate Orders ---
    try {
      const today = new Date();
      const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const currentDayIndex = today.getDay();
      const remainingDaysCount = 7 - currentDayIndex;

      let totalUpfrontCost = 0;
      const ordersToCreate = [];

      for (let i = 0; i < remainingDaysCount; i++) {
        const orderDate = new Date(today);
        orderDate.setDate(today.getDate() + i);
        orderDate.setHours(12, 0, 0, 0);
        
        const dayName = days[orderDate.getDay()];
        const selectionsForDay = mealSelections.filter(s => s.day.toLowerCase() === dayName);
        
        if (selectionsForDay.length > 0) {
          const items = selectionsForDay.map(s => ({
            itemId: s.menuItemId,
            quantity: s.quantity,
            price: s.price,
            mealType: s.mealType,
            day: s.day
          }));

          const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
          totalUpfrontCost += total;

          ordersToCreate.push({
            restaurantId,
            userId: req.userId,
            items,
            total,
            status: "pending",
            paymentStatus: "paid", // Charged upfront now!
            isSubscription: true,
            deliveryDateTime: orderDate,
            subscriptionId: subscription._id
          });
        }
      }

      // Check User Wallet
      const user = await User.findById(req.userId);
      if (user.walletBalance < totalUpfrontCost) {
        // Rollback subscription creation if insufficient funds
        await Subscription.findByIdAndDelete(subscription._id);
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient wallet balance. Total for this week: ${totalUpfrontCost} BDT, Available: ${user.walletBalance} BDT` 
        });
      }

      // Deduct Funds
      user.walletBalance -= totalUpfrontCost;
      await user.save();

      // Create Orders
      await Order.insertMany(ordersToCreate);

      // Create Payment Record
      await Payment.create({
        user: req.userId,
        amount: totalUpfrontCost,
        type: "order_payment",
        method: "wallet",
        status: "success",
        metadata: {
          note: "Upfront subscription payment (initial week)",
          subscriptionId: String(subscription._id)
        }
      });

    } catch (genError) {
      console.error("Error processing upfront subscription payment:", genError);
      // Even if pre-generation fails partially, the sub exists. 
      // But we should ideally be atomic.
    }

    const populated = await Subscription.findById(subscription._id)
      .populate("restaurantId", "name")
      .populate("mealSelections.menuItemId", "name description imageUrl price");

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ success: false, message: "Failed to create subscription" });
  }
});

import Delivery from "../models/Delivery.js"; // Ensure Delivery is imported

// POST /api/subscriptions/process-daily - Process daily payments and deliveries (Triggered by Admin or Cron)
router.post("/process-daily", async (req, res) => {
  try {
    const today = new Date();
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const todayDayName = days[today.getDay()];

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Find all unpaid orders for today
    const unpaidOrders = await Order.find({
      isSubscription: true,
      paymentStatus: "unpaid",
      status: "pending",
      deliveryDateTime: { $gte: todayStart, $lte: todayEnd }
    }).populate("userId").populate("subscriptionId");

    const results = {
      processed: 0,
      paid: 0,
      halted: 0,
      errors: []
    };

    for (const order of unpaidOrders) {
      // ... existing daily payment logic (for any missed or legacy unpaid orders) ...
      try {
        const user = order.userId;
        const sub = order.subscriptionId;

        if (!sub || sub.status === "cancelled" || sub.status === "paused") {
          order.status = "cancelled";
          await order.save();
          continue;
        }

        if (user.walletBalance < order.total) {
          sub.status = "halted";
          await sub.save();
          results.halted++;
          continue;
        }

        user.walletBalance -= order.total;
        await user.save();

        order.paymentStatus = "paid";
        if (sub.status === "halted") {
          sub.status = "active";
          await sub.save();
        }

        await order.save();
        results.paid++;
        results.processed++;
      } catch (err) {
        results.errors.push({ orderId: order._id, error: err.message });
      }
    }

    // --- Weekly Renewal Logic: Every Sunday, charge all repeating subs for the FULL next week ---
    if (todayDayName === "sunday") {
      const activeRepeatingSubs = await Subscription.find({
        status: "active",
        isRepeating: true
      }).populate("user");

      for (const sub of activeRepeatingSubs) {
        try {
          const nextWeekStart = new Date(today);
          nextWeekStart.setDate(today.getDate() + 7); // Next Sunday
          
          let totalNextWeekCost = 0;
          const nextWeekOrders = [];

          for (let i = 0; i < 7; i++) {
            const orderDate = new Date(nextWeekStart);
            orderDate.setDate(nextWeekStart.getDate() + i);
            orderDate.setHours(12, 0, 0, 0);

            const dayName = days[orderDate.getDay()];
            const selectionsForDay = sub.mealSelections.filter(s => s.day.toLowerCase() === dayName);

            if (selectionsForDay.length > 0) {
              const items = selectionsForDay.map(s => ({
                itemId: s.menuItemId,
                quantity: s.quantity,
                price: s.price,
                mealType: s.mealType,
                day: s.day
              }));

              const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
              totalNextWeekCost += total;

              nextWeekOrders.push({
                restaurantId: sub.restaurantId,
                userId: sub.user._id,
                items,
                total,
                status: "pending",
                paymentStatus: "paid",
                isSubscription: true,
                deliveryDateTime: orderDate,
                subscriptionId: sub._id
              });
            }
          }

          if (totalNextWeekCost > 0) {
            const user = sub.user;
            if (user.walletBalance >= totalNextWeekCost) {
              // Deduct Funds
              user.walletBalance -= totalNextWeekCost;
              await user.save();

              // Create Orders
              await Order.insertMany(nextWeekOrders);

              // Create Payment Record
              await Payment.create({
                user: user._id,
                amount: totalNextWeekCost,
                type: "order_payment",
                method: "wallet",
                status: "success",
                metadata: {
                  note: "Weekly subscription renewal payment",
                  subscriptionId: String(sub._id)
                }
              });
            } else {
              // Insufficient funds for renewal
              sub.status = "halted";
              await sub.save();
              results.halted++;
            }
          }
        } catch (renewalErr) {
          console.error(`Renewal failed for sub ${sub._id}:`, renewalErr);
        }
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error("Error processing daily subscriptions:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/subscriptions/:id/pause - Pause a subscription
router.patch("/:id/pause", protect, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ _id: req.params.id, user: req.userId });
    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    if (subscription.status !== "active") {
      return res.status(400).json({ success: false, message: "Only active subscriptions can be paused" });
    }

    subscription.status = "paused";
    await subscription.save();

    // Also update any future unpaid orders to reflect the pause (optional, but good for UI)
    // Actually, the daily job handles this, but let's at least make them cancelled so they don't clutter.
    // However, if we resume, we might want them back. 
    // Let's just leave them as 'pending' - the 'paused' badge on sub might be enough, 
    // BUT the restaurant needs to know. Let's mark them as 'cancelled' for now if paused? 
    // No, 'cancelled' is permanent. Let's just keep them as is, the daily job will handle it.
    // Wait, let's at least cancel them if the subscription is TERMINATED (cancelled).

    const populated = await Subscription.findById(subscription._id)
      .populate("restaurantId", "name")
      .populate("mealSelections.menuItemId", "name description imageUrl price");

    res.json({ success: true, data: populated });
  } catch (error) {
    console.error("Error pausing subscription:", error);
    res.status(500).json({ success: false, message: "Failed to pause subscription" });
  }
});

// PATCH /api/subscriptions/:id/resume - Resume a paused subscription
router.patch("/:id/resume", protect, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ _id: req.params.id, user: req.userId });
    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    if (subscription.status !== "paused") {
      return res.status(400).json({ success: false, message: "Only paused subscriptions can be resumed" });
    }

    subscription.status = "active";
    await subscription.save();

    const populated = await Subscription.findById(subscription._id)
      .populate("restaurantId", "name")
      .populate("mealSelections.menuItemId", "name description imageUrl price");

    res.json({ success: true, data: populated });
  } catch (error) {
    console.error("Error resuming subscription:", error);
    res.status(500).json({ success: false, message: "Failed to resume subscription" });
  }
});

// DELETE /api/subscriptions/:id - Cancel a subscription
router.delete("/:id", protect, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ _id: req.params.id, user: req.userId });
    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    subscription.status = "cancelled";
    await subscription.save();

    // Cancel all future unpaid orders immediately
    await Order.updateMany(
      { subscriptionId: req.params.id, paymentStatus: "unpaid", status: "pending" },
      { status: "cancelled" }
    );

    res.json({ success: true, message: "Subscription cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    res.status(500).json({ success: false, message: "Failed to cancel subscription" });
  }
});

// PATCH /api/subscriptions/:id - Update subscription meal selections
router.patch("/:id", protect, async (req, res) => {
  try {
    const { mealSelections, isRepeating } = req.body;
    const subscription = await Subscription.findOne({ _id: req.params.id, user: req.userId });
    
    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    if (subscription.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Cannot update cancelled subscription" });
    }

    if (mealSelections && Array.isArray(mealSelections)) {
      // Validate and update meal selections
      for (const selection of mealSelections) {
        if (!selection.menuItemId || !selection.day || !selection.mealType || !selection.quantity) {
          return res.status(400).json({ success: false, message: "Each meal selection must have menuItemId, day, mealType, and quantity" });
        }
        
        const menuItem = await MenuItem.findById(selection.menuItemId);
        if (!menuItem) {
          return res.status(404).json({ success: false, message: `Menu item ${selection.menuItemId} not found` });
        }
        
        selection.price = menuItem.price;
        selection.restaurantId = subscription.restaurantId;
      }
      
      subscription.mealSelections = mealSelections;
      subscription.mealsPerWeek = mealSelections.length;
    }

    if (isRepeating !== undefined) {
      subscription.isRepeating = isRepeating;
      if (!isRepeating && !subscription.endDate) {
        subscription.endDate = new Date();
        subscription.endDate.setDate(subscription.endDate.getDate() + 7);
      } else if (isRepeating) {
        subscription.endDate = null;
      }
    }

    await subscription.save();

    const populated = await Subscription.findById(subscription._id)
      .populate("restaurantId", "name")
      .populate("mealSelections.menuItemId", "name description imageUrl price");

    res.json({ success: true, data: populated });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ success: false, message: "Failed to update subscription" });
  }
});

// POST /api/subscriptions/trigger-payment - Manually trigger payment for active subscriptions (Demo)
router.post("/trigger-payment", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // 1. Calculate total cost of active subscriptions
    const subscriptions = await Subscription.find({ 
      user: req.userId, 
      status: "active" 
    });

    if (subscriptions.length === 0) {
      return res.status(400).json({ success: false, message: "No active subscriptions to pay for" });
    }

    let totalAmount = 0;
    for (const sub of subscriptions) {
      let subTotal = 0;
      if (sub.mealSelections && sub.mealSelections.length > 0) {
        // Calculate based on selections (using stored price or current price? Stored is safer for subs)
        // logic: sum(quantity * price)
        subTotal = sub.mealSelections.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      }
      totalAmount += subTotal;
    }

    if (totalAmount <= 0) {
      return res.status(400).json({ success: false, message: "Total payment amount is zero" });
    }

    // 2. Check wallet balance
    if (user.walletBalance < totalAmount) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient wallet balance. Required: ${totalAmount} BDT, Available: ${user.walletBalance} BDT` 
      });
    }

    // 3. Process Payment
    user.walletBalance -= totalAmount;
    await user.save();

    const payment = await Payment.create({
      user: req.userId,
      amount: totalAmount,
      type: "order_payment", // or 'subscription_payment' if added to enum, but order_payment works
      method: "wallet",
      status: "success",
      metadata: {
        note: "Subscription weekly payment (Demo)",
        subscriptionCount: subscriptions.length
      }
    });

    res.json({ 
      success: true, 
      message: `Successfully paid ${totalAmount} BDT for ${subscriptions.length} active subscriptions`,
      data: {
        payment,
        newBalance: user.walletBalance
      }
    });

  } catch (error) {
    console.error("Error processing subscription payment:", error);
    res.status(500).json({ success: false, message: "Failed to process payment" });
  }
});

export default router;

