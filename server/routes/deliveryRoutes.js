import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getMyDeliveries,
  getMyAssignedDeliveries,
  updateDeliveryLocation,
  trackDelivery,
  getAvailableOffers,
  acceptOffer,
  toggleAvailability,
} from "../controllers/deliveryController.js";

const router = express.Router();

// Delivery History – customer
router.get("/my", protect, getMyDeliveries);

// Delivery History – delivery staff
router.get("/staff/my", protect, getMyAssignedDeliveries);

// Toggle availability status for delivery staff
router.patch("/availability/toggle", protect, toggleAvailability);

// Available offers for delivery staff
router.get("/offers/available", protect, getAvailableOffers);

// Accept a delivery offer
router.post("/offers/:deliveryId/accept", protect, acceptOffer);

// Real-Time Delivery Tracking – staff updates location
router.patch("/:id/location", protect, updateDeliveryLocation);

// Real-Time Delivery Tracking – customer views status/location
router.get("/:id/track", protect, trackDelivery);

export default router;


