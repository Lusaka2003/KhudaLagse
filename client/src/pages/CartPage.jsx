import { useState, useEffect } from "react";
import axiosInstance from "../api/axios";
import { useNavigate } from "react-router-dom";
import MapAddressSelector from "../components/MapAddressSelector";

const FALLBACK_IMAGE =
  "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800";
const DELIVERY_FEE = 30; // Delivery fee in BDT

const CartPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState(null);

  // Check user role and redirect
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        if (parsedUser.role !== "customer") {
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Error parsing user data:", err);
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Fetch wallet balance
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const { data } = await axiosInstance.get("/api/wallet");
        setWalletBalance(data.walletBalance || 0);
      } catch (err) {
        console.error("Failed to fetch wallet:", err);
      } finally {
        setWalletLoading(false);
      }
    };
    fetchWallet();
  }, []);

  const removeItem = (index) =>
    setCart((prev) => prev.filter((_, i) => i !== index));
  const clearCart = () => setCart([]);

  const updateQuantity = (index, quantity) => {
    if (quantity < 1) return;
    setCart((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity } : item))
    );
  };

  const toggleDeliveryHour = (index) => {
    setCart((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const currentHour = item.deliveryHour ?? (item.mealType === "lunch" ? 13 : 20);
        const newHour =
          item.mealType === "lunch"
            ? currentHour === 13 ? 14 : 13
            : currentHour === 20 ? 21 : 20;
        return { ...item, deliveryHour: newHour };
      })
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const totalPrice = subtotal + DELIVERY_FEE;

  // --- NEW STRIPE CHECKOUT LOGIC ---
  // --- UPDATED STRIPE CHECKOUT LOGIC WITH REAL ERRORS ---
  const handleStripeCheckout = async () => {
    if (cart.length === 0) return;
    if (!selectedAddress) {
      alert("Please select a delivery address before checkout. 📍");
      return;
    }

    try {
      setLoading(true);
      const { data } = await axiosInstance.post("/api/payment/create-checkout-session", {
        items: cart,
        address: selectedAddress,
        deliveryFee: DELIVERY_FEE,
        type: "cart_checkout" 
      });

      if (data.url) {
        window.location.href = data.url; 
      }
    } catch (err) {
      // THIS PART IS CHANGED:
      console.error("Full Error Object:", err);
      
      // This looks for the message the server sent back
      const errorMessage = err.response?.data?.message || err.message || "Unknown error occurred";
      
      alert(`Stripe Error: ${errorMessage}`); 
    } finally {
      setLoading(false);
    }
  };

  // --- ORIGINAL WALLET CHECKOUT LOGIC ---
  const handleWalletCheckout = async () => {
    if (cart.length === 0 || !selectedAddress) {
      alert("Please check your cart and address! 🎀");
      return;
    }

    if (walletBalance < totalPrice) {
      alert("Insufficient wallet balance! Please use Card or Recharge.");
      return;
    }

    if (!window.confirm(`Place order for ${totalPrice} BDT using Wallet?`)) return;

    try {
      setLoading(true);
      const orderPromises = cart.map(item => {
        const deliveryDateTime = new Date(item.date || item.deliveryDate);
        deliveryDateTime.setHours(item.deliveryHour ?? (item.mealType === "lunch" ? 13 : 20), 0, 0, 0);

        return axiosInstance.post("/api/orders", {
          restaurantId: item.restaurant || item.restaurantId,
          items: [{ itemId: item._id, quantity: item.quantity || 1, price: item.price, mealType: item.mealType || "lunch" }],
          total: (item.price * (item.quantity || 1)) + DELIVERY_FEE,
          deliveryDateTime: deliveryDateTime.toISOString(),
          paymentMethod: "wallet",
          deliveryAddress: selectedAddress,
          deliveryFee: DELIVERY_FEE,
        });
      });

      await Promise.all(orderPromises);
      alert("Orders placed successfully! 🎉");
      clearCart();
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.error("Wallet Checkout failed:", err);
      alert("One or more orders failed. Check console.");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 pt-24">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty 🎀</h2>
        <button onClick={() => navigate('/')} className="text-violet-600 underline">Back to Shopping</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 px-4 pb-12">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Your Cart</h2>

        {/* Address Section */}
        <div className="mb-8 pb-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 font-display">Delivery Address</h3>
          <MapAddressSelector onAddressSelect={setSelectedAddress} initialAddress={selectedAddress} />
        </div>

        {/* Items Section */}
        <div className="space-y-4">
          {cart.map((item, index) => (
            <div key={index} className="flex flex-col md:flex-row items-center justify-between border-b pb-4 gap-4">
              <div className="flex items-center gap-4">
                <img src={item.imageUrl || FALLBACK_IMAGE} alt={item.name} className="w-24 h-20 object-cover rounded-lg" />
                <div>
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-gray-500 text-sm">Delivery: {new Date(item.date).toLocaleDateString()} at {item.deliveryHour ?? (item.mealType === 'lunch' ? 13 : 20)}:00</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button onClick={() => updateQuantity(index, (item.quantity || 1) - 1)} className="bg-gray-100 px-2 rounded">-</button>
                    <span>{item.quantity || 1}</span>
                    <button onClick={() => updateQuantity(index, (item.quantity || 1) + 1)} className="bg-gray-100 px-2 rounded">+</button>
                  </div>
                </div>
              </div>
              <p className="text-lg font-bold text-violet-700">{(item.price || 0) * (item.quantity || 1)} BDT</p>
            </div>
          ))}
        </div>

        {/* Checkout Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex justify-between mb-2"><span>Subtotal</span><span>{subtotal.toFixed(2)} BDT</span></div>
          <div className="flex justify-between mb-2"><span>Delivery Fee</span><span>{DELIVERY_FEE.toFixed(2)} BDT</span></div>
          <div className="flex justify-between text-xl font-bold text-gray-900 border-t pt-2">
            <span>Total</span><span>{totalPrice.toFixed(2)} BDT</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <button onClick={clearCart} className="text-red-500 font-semibold hover:underline">Clear Cart</button>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleWalletCheckout}
              disabled={loading || walletBalance < totalPrice}
              className="bg-violet-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-violet-700 transition disabled:opacity-50"
            >
              {loading ? "Placing..." : "Pay with Wallet"}
            </button>

            <button
              onClick={handleStripeCheckout}
              disabled={loading}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2"
            >
              {loading ? "Redirecting..." : "Pay with Card 💳"}
            </button>
          </div>
        </div>

        {walletBalance < totalPrice && (
          <p className="text-center text-red-500 mt-4 text-sm font-medium italic">
            * Insufficient wallet balance. Please use Card or recharge your wallet.
          </p>
        )}
      </div>
    </div>
  );
};

export default CartPage;