import { useState, useEffect } from "react";
import axiosInstance from "../api/axios";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showCompletionTimeModal, setShowCompletionTimeModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [completionTime, setCompletionTime] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const restaurantId = user?.id;

        if (!restaurantId) {
          setError("User ID missing. Please log in again.");
          setLoading(false);
          return;
        }

        const token = localStorage.getItem("token");
        const { data } = await axiosInstance.get(
          `/api/orders/restaurant/${restaurantId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // NEW — separate arrays
        const upcomingOrders = data.filter(
          (order) => order.status === "pending" || order.status === "accepted"
        );

        const completed = data.filter((order) => order.status === "completed");

        setOrders(upcomingOrders);
        setCompletedOrders(completed);

      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setError("Failed to fetch orders. Try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-amber-100 text-amber-700 border-amber-200";
      case "cooking": return "bg-blue-100 text-blue-700 border-blue-200";
      case "ready": return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "completed": return "bg-violet-100 text-violet-700 border-violet-200";
      case "cancelled": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-stone-100 text-stone-700 border-stone-200";
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    const token = localStorage.getItem("token");

    try {
      await axiosInstance.patch(
        `/api/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );

      if (newStatus === "completed") {
        const completedOrder = orders.find(o => o._id === orderId);
        setOrders(prev => prev.filter(o => o._id !== orderId));
        setCompletedOrders(prev => [{ ...completedOrder, status: "completed" }, ...prev]);
      }

      alert(`Order marked as ${newStatus}!`);
    } catch (err) {
      console.error("Failed to update status:", err);
      alert(err.response?.data?.message || "Failed to update status. Try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const rejectOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to reject this order?")) return;

    setUpdatingId(orderId);
    const token = localStorage.getItem("token");

    try {
      await axiosInstance.delete(`/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrders((prev) => prev.filter((o) => o._id !== orderId));
      alert("Order rejected and deleted.");
    } catch (err) {
      console.error("Failed to reject order:", err);
      alert("Failed to reject order. Try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const displayList = showCompleted ? completedOrders : orders;

  if (loading) return (
    <div className="min-h-screen bg-stone-50/50 flex items-center justify-center pt-24">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-stone-50/50 flex items-center justify-center pt-24">
      <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">{error}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50/50 pt-32 pb-20 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Order Management</h1>
            <p className="text-stone-500 text-sm mt-1">Manage preparation and dispatch of your active orders.</p>
          </div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-stone-200 text-stone-700 rounded-xl hover:bg-stone-50 transition-all font-semibold shadow-sm text-sm"
          >
            {showCompleted ? "View Active Orders" : "View History"}
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-stone-800 font-bold text-lg mb-2">
            <span className="w-2 h-2 rounded-full bg-violet-500"></span>
            {showCompleted ? "Order History" : "Active Orders"}
            <span className="ml-2 px-2 py-0.5 bg-stone-100 text-stone-500 text-xs rounded-full font-medium">
              {displayList.length}
            </span>
          </div>

          {displayList.length === 0 ? (
            <div className="bg-white border border-stone-100 rounded-2xl p-20 text-center shadow-sm">
              <div className="text-4xl mb-4">📦</div>
              <p className="text-stone-500 font-medium">
                {showCompleted ? "Your completed orders will appear here." : "No active orders right now."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayList.map((order) => (
                <div key={order._id} className="group bg-white border border-stone-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-stone-50 p-2 rounded-xl border border-stone-100">
                      <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-0.5">Order ID</div>
                      <div className="text-xs font-mono text-stone-600">#{order._id.slice(-6)}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6 flex-grow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center text-lg">💰</div>
                      <div>
                        <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-0.5">Total Amount</div>
                        <div className="text-sm font-bold text-stone-800">{order.total} BDT</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">⏰</div>
                      <div>
                        <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-0.5">Fulfillment</div>
                        <div className="text-xs font-semibold text-stone-700">
                          {new Date(order.deliveryDateTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(order.deliveryDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    {order.isSubscription && (
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${order.paymentStatus === 'paid' ? 'bg-violet-50 text-violet-600' : 'bg-amber-50 text-amber-600'}`}>
                          {order.paymentStatus === 'paid' ? '✅' : '⏳'}
                        </div>
                        <div>
                          <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-0.5">Payment Status</div>
                          <div className={`text-xs font-bold ${order.paymentStatus === 'paid' ? 'text-violet-700' : 'text-amber-700'}`}>
                            {order.paymentStatus === 'paid' ? 'Paid' : 'Awaiting Daily Processing'}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-stone-50">
                      <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-2">Order Items</div>
                      <div className="space-y-2">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs bg-stone-50/50 p-2 rounded-lg border border-stone-50">
                            <span className="text-stone-700 font-semibold">{item.quantity}x {item.itemId?.name}</span>
                            <span className="text-stone-400">{item.price * item.quantity}৳</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {!showCompleted && (
                    <div className="flex flex-col gap-2 pt-4 border-t border-stone-50">
                      {order.status === "pending" && (
                        <div className="flex flex-col gap-2">
                          {order.isSubscription && order.paymentStatus === 'unpaid' && (
                            <div className="bg-amber-50 border border-amber-100 rounded-lg p-2 text-[10px] text-amber-800 text-center font-medium">
                              ⚠️ Subscription payment processing...
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => updateOrderStatus(order._id, "cooking")}
                              disabled={updatingId === order._id || (order.isSubscription && order.paymentStatus === 'unpaid')}
                              className="px-3 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition font-bold text-xs shadow-lg shadow-violet-100 disabled:opacity-50 disabled:grayscale"
                            >
                              🍳 Start Cooking
                            </button>
                            <button
                              onClick={() => rejectOrder(order._id)}
                              disabled={updatingId === order._id}
                              className="px-3 py-2 bg-stone-100 text-stone-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition font-bold text-xs disabled:opacity-50"
                            >
                              ✕ Reject
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {order.status === "cooking" && (
                        <button
                          onClick={() => updateOrderStatus(order._id, "ready")}
                          disabled={updatingId === order._id}
                          className="w-full px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold text-xs shadow-lg shadow-blue-100 disabled:opacity-50"
                        >
                          📦 Mark Ready for Pickup
                        </button>
                      )}

                      {order.status === "ready" && (
                        <div className="flex flex-col items-center justify-center p-3 bg-indigo-50 rounded-xl border border-indigo-100 border-dashed">
                          <span className="text-xs font-bold text-indigo-700 animate-pulse">Waiting for Driver...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
