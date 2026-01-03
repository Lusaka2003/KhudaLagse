import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Payment Model
 *
 * Stores all financial transactions:
 * - Wallet recharges
 * - Order payments
 * - Refunds
 */
const PaymentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ["wallet_recharge", "order_payment", "refund", "reward", "referral_reward"],
      required: true,
    },
    method: {
      type: String,
      enum: ["wallet", "card", "local_app", "stripe"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "success",
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model("Payment", PaymentSchema);

export default Payment;


