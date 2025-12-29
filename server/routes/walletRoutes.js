import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getWallet,
  rechargeWallet,
  getMyPayments,
} from "../controllers/walletController.js";

const router = express.Router();

// Wallet & Payment Options – core financial feature
router.get("/", protect, getWallet);
router.post("/recharge", protect, rechargeWallet);

// Payment & Transaction Management
router.get("/payments", protect, getMyPayments);

export default router;


