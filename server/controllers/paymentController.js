import Stripe from 'stripe';
import dotenv from 'dotenv';
import Order from '../models/Order.js'; // Ensure this path is correct

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res) => {
  try {
    console.log("💰 Payment Request Received:", req.body.type);
    
    const { items, type, amount, address } = req.body;
    let line_items = [];

    if (!type) {
      return res.status(400).json({ message: "Missing payment type" });
    }

    if (type === 'cart_checkout') {
      if (!items || items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      line_items = items.map((item) => ({
        price_data: {
          currency: 'bdt', 
          product_data: {
            name: item.name,
            description: `Meal for ${item.day || 'scheduled date'}`,
          },
          unit_amount: Math.round(item.price * 100), 
        },
        quantity: item.quantity || 1,
      }));

      line_items.push({
        price_data: {
          currency: 'bdt',
          product_data: { name: 'Delivery Fee' },
          unit_amount: 30 * 100, 
        },
        quantity: 1,
      });

    } else {
      if (!amount) {
        return res.status(400).json({ message: "Amount is required for recharge" });
      }
      line_items = [{
        price_data: {
          currency: 'bdt',
          product_data: { name: 'Wallet Recharge' },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }];
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      metadata: { 
        userId: req.user ? req.user._id.toString() : 'guest', 
        type: type,
        address: type === 'cart_checkout' ? JSON.stringify(address) : ''
      },
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("🔥 Stripe Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// --- THIS IS THE FIXED FUNCTION ---
export const verifyPayment = async (req, res) => {
  try {
    const { sessionId, cartItems } = req.body;
    
    // 1. Retrieve Session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // 2. Check Payment Status
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: "Payment not verified" });
    }

    const type = session.metadata.type;

    // Handle Wallet Recharge
    if (type === 'wallet_recharge') {
      return res.json({ success: true, type: 'wallet_recharge', message: "Funds Added!" });
    } 
    
    // Handle Food Order
    if (type === 'cart_checkout') {
      const address = JSON.parse(session.metadata.address);
      const userId = session.metadata.userId;

      // Create Orders
      const orderPromises = cartItems.map(item => {
        const deliveryDateTime = new Date(item.date || item.deliveryDate);
        deliveryDateTime.setHours(item.deliveryHour ?? (item.mealType === "lunch" ? 13 : 20), 0, 0, 0);

        // --- FIX IS HERE: Renamed fields to match your Error Log ---
        return Order.create({
          userId: userId, // Was 'user', changed to 'userId'
          restaurantId: item.restaurant || item.restaurantId, // Was 'restaurant', changed to 'restaurantId'
          items: [{ 
            itemId: item._id, 
            quantity: item.quantity || 1, 
            price: item.price, 
            mealType: item.mealType || "lunch" 
          }],
          total: (item.price * (item.quantity || 1)) + 30, // Was 'totalAmount', changed to 'total'
          deliveryAddress: address,
          status: 'pending',
          paymentMethod: 'card', // or 'stripe'
          paymentStatus: 'paid',
          deliveryDateTime: deliveryDateTime,
          deliveryFee: 30
        });
      });

      await Promise.all(orderPromises);

      return res.json({ success: true, type: 'cart_checkout', message: "Order Placed Successfully!" });
    }

  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ message: error.message });
  }
};