import Delivery from "../models/Delivery.js";
import Order from "../models/Order.js";
import { User } from "../models/User.js";
import Referral from "../models/Referral.js";
import Payment from "../models/Payment.js";

/**
 * Get delivery history for current customer
 */
export const getMyDeliveries = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const deliveries = await Delivery.find({ customer: userId })
      .populate("order")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, deliveries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get delivery history for current delivery staff
 */
export const getMyAssignedDeliveries = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const deliveries = await Delivery.find({ deliveryStaff: userId })
      .populate({
        path: "order",
        select:
          "total items restaurantId userId deliveryDateTime createdAt deliveryAddress",
        populate: [
          {
            path: "restaurantId",
            select: "name restaurantName location address",
          },
          { path: "userId", select: "name phone" },
        ],
      })
      .populate("customer", "name phone address")
      .sort({ createdAt: -1 });

    // Provide totals so frontend can show total deliveries and completed count
    const totalDeliveries = await Delivery.countDocuments({
      deliveryStaff: userId,
    });
    const completedDeliveries = await Delivery.countDocuments({
      deliveryStaff: userId,
      status: "delivered",
    });

    res.status(200).json({
      success: true,
      deliveries,
      totals: {
        totalDeliveries,
        completedDeliveries,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Manually update current location & status for a delivery (staff)
 */
export const updateDeliveryLocation = async (req, res) => {
  try {
    const staffId = req.user._id || req.user.id;
    const { id } = req.params;
    const { lat, lng, status } = req.body;

    const delivery = await Delivery.findOne({
      _id: id,
      deliveryStaff: staffId,
    });
    if (!delivery) {
      return res
        .status(404)
        .json({ success: false, message: "Delivery not found" });
    }

    if (lat != null && lng != null) {
      delivery.currentLocation = {
        lat,
        lng,
        lastUpdatedAt: new Date(),
      };
    }

    if (status) {
      // Validate status transition
      const validStatuses = [
        "assigned",
        "picked_up",
        "on_the_way",
        "delivered",
      ];
      if (validStatuses.includes(status)) {
        delivery.status = status;

        // If delivery is completed, process referral reward and update order status
        if (status === "delivered") {
          // Update order status to completed
          await Order.findByIdAndUpdate(delivery.order, {
            status: "completed",
          });

          try {
            const customer = await User.findById(delivery.customer);
            if (customer && customer.referredBy) {
              const referral = await Referral.findOne({
                referrer: customer.referredBy,
                referredUser: delivery.customer,
                status: "pending",
              });

              if (referral) {
                const rewardAmount = 30;

                // Reward Referrer
                const referrer = await User.findById(customer.referredBy);
                if (referrer) {
                  referrer.walletBalance =
                    (referrer.walletBalance || 0) + rewardAmount;
                  await referrer.save();

                  await Payment.create({
                    user: referrer._id,
                    order: delivery.order,
                    amount: rewardAmount,
                    type: "referral_reward",
                    method: "wallet",
                    status: "success",
                    metadata: {
                      kind: "referrer_reward",
                      referredUserId: String(delivery.customer),
                      orderId: String(delivery.order),
                    },
                  });
                }

                // Reward Referred User (Customer)
                customer.walletBalance =
                  (customer.walletBalance || 0) + rewardAmount;
                await customer.save();

                await Payment.create({
                  user: customer._id,
                  order: delivery.order,
                  amount: rewardAmount,
                  type: "referral_reward",
                  method: "wallet",
                  status: "success",
                  metadata: {
                    kind: "referred_user_reward",
                    referrerId: String(customer.referredBy),
                    orderId: String(delivery.order),
                  },
                });

                referral.status = "rewarded";
                referral.rewardAmount = rewardAmount * 2; // Total reward given out
                referral.rewardedAt = new Date();
                await referral.save();
              }
            }
          } catch (rewardError) {
            console.error("Error processing referral reward:", rewardError);
            // Don't fail the delivery update if reward processing fails
          }
        }
      }
    }

    await delivery.save();

    res.status(200).json({ success: true, delivery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Track delivery (for customers) - returns current location & status
 * Can track by delivery ID or order ID
 */
export const trackDelivery = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    // Try to find by delivery ID first, then by order ID
    let delivery = await Delivery.findOne({ _id: id, customer: userId })
      .populate("order")
      .populate("deliveryStaff", "name phone");

    if (!delivery) {
      // Try finding by order ID
      delivery = await Delivery.findOne({ order: id, customer: userId })
        .populate("order")
        .populate("deliveryStaff", "name phone");
    }

    if (!delivery) {
      return res
        .status(404)
        .json({ success: false, message: "Delivery not found" });
    }

    res.status(200).json({
      success: true,
      deliveryId: delivery._id,
      status: delivery.status,
      currentLocation: delivery.currentLocation,
      deliveryAddress: delivery.address,
      order: delivery.order,
      deliveryStaff: delivery.deliveryStaff,
      updatedAt: delivery.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get available delivery offers (unassigned deliveries)
 * Only shows deliveries that haven't been assigned yet
 */
export const getAvailableOffers = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    // Check if user is delivery staff
    const user = await User.findById(userId);
    if (!user || user.role !== "deliveryStaff") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Only show offers if staff is available
    if (user.isAvailable === false) {
      return res.status(200).json({ success: true, offers: [] });
    }

    // Only show unassigned deliveries
    const offers = await Delivery.find({
      status: "unassigned",
      $or: [],
    })
      .populate({
        path: "order",
        select: "total items restaurantId deliveryDateTime",
        populate: { path: "restaurantId", select: "name location" },
      })
      .populate("customer", "name phone address")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, offers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Accept a delivery offer (first come first serve)
 * Uses atomic operation to ensure only one staff gets it
 */
export const acceptOffer = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { deliveryId } = req.params;

    // Check if user is delivery staff
    const user = await User.findById(userId);
    if (!user || user.role !== "deliveryStaff") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Check if staff is available
    if (user.isAvailable === false) {
      return res
        .status(400)
        .json({ success: false, message: "You are not available" });
    }

    // Atomic operation: find unassigned delivery and assign it to this staff
    const delivery = await Delivery.findOneAndUpdate(
      {
        _id: deliveryId,
        status: "unassigned",
        $or: [{ deliveryStaff: { $exists: false } }, { deliveryStaff: null }],
      },
      {
        deliveryStaff: userId,
        status: "assigned",
      },
      { new: true }
    );

    if (!delivery) {
      return res.status(409).json({
        success: false,
        message: "Offer already taken by another delivery staff",
      });
    }

    // Populate delivery details
    await delivery.populate([
      {
        path: "order",
        populate: { path: "restaurantId", select: "name location" },
      },
      { path: "customer", select: "name phone address" },
    ]);

    res.status(200).json({ success: true, delivery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Toggle availability status for delivery staff
 */
export const toggleAvailability = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    // Check if user is delivery staff
    const user = await User.findById(userId);
    if (!user || user.role !== "deliveryStaff") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Toggle availability
    user.isAvailable = !user.isAvailable;
    await user.save();

    res.status(200).json({
      success: true,
      isAvailable: user.isAvailable,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * (Optional) Create delivery when order is created.
 * This can be called from order flow later as needed.
 */
export const createDeliveryForOrder = async (
  orderId,
  customerId,
  staffId,
  address
) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  const delivery = await Delivery.create({
    order: orderId,
    customer: customerId,
    deliveryStaff: staffId,
    address,
  });

  return delivery;
};