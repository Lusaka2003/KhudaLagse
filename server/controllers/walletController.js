import { User } from "../models/User.js";
import Payment from "../models/Payment.js";

export const getWallet = async (req, res) => {
  try {
    // FIX: Using _id instead of id
    const userId = req.user._id || req.user.id;

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

export const rechargeWallet = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { amount, method } = req.body; // Removed default "card" here to see what frontend sends

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.walletBalance = (user.walletBalance || 0) + Number(amount);
    await user.save();

    // The method MUST be one of: "wallet", "card", "local_app", or "stripe"
    const payment = await Payment.create({
      user: userId,
      amount: Number(amount),
      type: "wallet_recharge",
      method: method || "card", // Fallback to card if stripe isn't passed
      status: "success",
    });

    res.status(201).json({
      success: true,
      message: "Wallet recharged successfully",
      walletBalance: user.walletBalance,
      payment,
    });
  } catch (error) {
    console.error("Recharge Error:", error);
    // This will now tell you if it's a Validation Error (like the enum issue)
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyPayments = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const payments = await Payment.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};