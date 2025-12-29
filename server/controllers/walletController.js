import { User } from "../models/User.js";
import Payment from "../models/Payment.js";

/**
 * Get current user's wallet balance and recent transactions
 */
export const getWallet = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("walletBalance");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const transactions = await Payment.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      walletBalance: user.walletBalance || 0,
      transactions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Recharge wallet
 * For now this simulates a successful payment and updates wallet balance.
 */
export const rechargeWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, method = "card" } = req.body;

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Amount must be greater than zero" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Simulate successful recharge
    user.walletBalance = (user.walletBalance || 0) + amount;
    await user.save();

    const payment = await Payment.create({
      user: userId,
      amount,
      type: "wallet_recharge",
      method,
      status: "success",
    });

    res.status(201).json({
      success: true,
      message: "Wallet recharged successfully",
      walletBalance: user.walletBalance,
      payment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * List all payments for the current user (transaction management)
 */
export const getMyPayments = async (req, res) => {
  try {
    const userId = req.user.id;

    const payments = await Payment.find({ user: userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


