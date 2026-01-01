import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axios";
import {
  FaBoxOpen,
  FaCheckCircle,
  FaClock,
  FaMapMarkerAlt,
  FaMotorcycle,
  FaTimesCircle,
  FaStore,
  FaChevronRight,
  FaReceipt,
  FaStar,
} from "react-icons/fa";
import RatingModal from "../components/RatingModal";

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [tracking, setTracking] = useState({}); // orderId -> tracking info
  const [ratingModal, setRatingModal] = useState({
    isOpen: false,
    staff: null,
    orderId: null,
  });

  const formatDeliveryAddress = (address) => {
    if (!address) return "";

    // Handle new format with fullAddress (from order.deliveryAddress)
    if (address.fullAddress) {
      return address.fullAddress;
    }

    // Handle old format with separate fields
    const house = String(address.house ?? "").trim();
    const road = String(address.road ?? "").trim();
    const area = String(address.area ?? "").trim();
    const city = String(address.city ?? "").trim();
    return [house, road, area, city].filter(Boolean).join(", ");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, profileRes] = await Promise.all([
          axiosInstance.get("/api/orders/my"),
          axiosInstance.get("/api/auth/profile"),
        ]);
        setOrders(ordersRes.data || []);
        if (profileRes.data.success) {
          setUser(profileRes.data.data.user);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load your orders. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const cancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setUpdatingId(orderId);
    try {
      await axiosInstance.patch(`/api/orders/${orderId}/status`, {
        status: "cancelled",
      });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: "cancelled" } : o))
      );
      alert("Order cancelled successfully.");
    } catch (err) {
      alert("Failed to cancel order.");
    } finally {
      setUpdatingId(null);
    }
  };

  const fetchTracking = async (orderId) => {
    try {
      const { data } = await axiosInstance.get(
        `/api/deliveries/${orderId}/track`
      );
      setTracking((prev) => ({ ...prev, [orderId]: data }));
    } catch (err) {
      alert("Tracking information not available yet.");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-200 border-t-violet-600"></div>
      </div>
    );

  const upcomingOrders = orders.filter((o) =>
    ["pending", "accepted", "preparing", "ready", "on_the_way"].includes(
      o.status
    )
  );
  const previousOrders = orders.filter((o) =>
    ["completed", "delivered", "cancelled"].includes(o.status)
  );

  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-violet-100 p-3 rounded-xl text-violet-600">
            <FaReceipt className="text-2xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-stone-800">My Orders</h1>
            <p className="text-stone-500">
              Track current orders and view history
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        {/* Upcoming Orders */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-8 bg-violet-500 rounded-full"></span>
            Active Orders
          </h2>

          {upcomingOrders.length > 0 ? (
            <div className="grid gap-6">
              {upcomingOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  isUpcoming={true}
                  cancelOrder={cancelOrder}
                  updatingId={updatingId}
                  fetchTracking={fetchTracking}
                  tracking={tracking[order._id]}
                  formatDeliveryAddress={formatDeliveryAddress}
                  userAddress={user?.address}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
              <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                🍽️
              </div>
              <h3 className="font-bold text-stone-600">No active orders</h3>
              <p className="text-stone-400 text-sm">
                Hungry? Explore kitchens near you!
              </p>
              <Link
                to="/restaurants"
                className="inline-block mt-4 text-violet-600 font-bold hover:underline"
              >
                Browse Kitchens →
              </Link>
            </div>
          )}
        </div>

        {/* Previous Orders */}
        <div>
          <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-8 bg-stone-400 rounded-full"></span>
            Past Orders
          </h2>
          {previousOrders.length > 0 ? (
            <div className="grid gap-4 opacity-80 hover:opacity-100 transition-opacity duration-300">
              {previousOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  isUpcoming={false}
                  formatDeliveryAddress={formatDeliveryAddress}
                  userAddress={user?.address}
                  onRateDriver={(staff, oid) =>
                    setRatingModal({ isOpen: true, staff, orderId: oid })
                  }
                />
              ))}
            </div>
          ) : (
            <p className="text-stone-500 italic">No past orders found.</p>
          )}
        </div>

        <RatingModal
          isOpen={ratingModal.isOpen}
          onClose={() =>
            setRatingModal({ isOpen: false, staff: null, orderId: null })
          }
          staff={ratingModal.staff}
          orderId={ratingModal.orderId}
          onSubmitSuccess={() => {
            setOrders((prev) =>
              prev.map((o) =>
                o._id === ratingModal.orderId ? { ...o, isReviewed: true } : o
              )
            );
            alert("Thank you for your feedback!");
          }}
        />
      </div>
    </div>
  );
};

const OrderCard = ({
  order,
  isUpcoming,
  cancelOrder,
  updatingId,
  fetchTracking,
  tracking,
  formatDeliveryAddress,
  userAddress,
  onRateDriver,
}) => {
  const statusColors = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    accepted: "bg-blue-100 text-blue-700 border-blue-200",
    preparing: "bg-indigo-100 text-indigo-700 border-indigo-200",
    ready: "bg-purple-100 text-purple-700 border-purple-200",
    on_the_way: "bg-orange-100 text-orange-700 border-orange-200",
    completed: "bg-violet-100 text-violet-700 border-violet-200",
    delivered: "bg-violet-100 text-violet-700 border-violet-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
  };

  const statusIcons = {
    pending: <FaClock />,
    accepted: <FaCheckCircle />,
    preparing: <FaStore />,
    on_the_way: <FaMotorcycle />,
    completed: <FaCheckCircle />,
    delivered: <FaCheckCircle />,
    cancelled: <FaTimesCircle />,
  };

  const isTrackingAvailable = [
    "accepted",
    "preparing",
    "ready",
    "on_the_way",
  ].includes(order.status);

  return (
    <div
      className={`bg-white rounded-2xl border ${
        isUpcoming
          ? "border-violet-100 shadow-lg shadow-violet-50"
          : "border-stone-200"
      } overflow-hidden transition-all hover:shadow-md`}
    >
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-stone-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 font-bold text-xl">
            {order.restaurantId?.name?.charAt(0) || <FaStore />}
          </div>
          <div>
            <h3 className="font-bold text-stone-800 text-lg">
              {order.restaurantId?.name || "Unknown Kitchen"}
            </h3>
            <p className="text-stone-400 text-xs font-mono">
              #{order._id.slice(-6).toUpperCase()} •{" "}
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div
          className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 border ${
            statusColors[order.status] || "bg-gray-100 text-gray-600"
          }`}
        >
          {statusIcons[order.status]}
          {order.status.replace("_", " ")}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-6 grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">
            Order Items
          </h4>
          <ul className="space-y-2">
            {order.items.map((item, i) => (
              <li
                key={i}
                className="flex justify-between text-sm text-stone-700 font-medium"
              >
                <span className="flex items-center gap-2">
                  <span className="bg-stone-100 text-stone-600 text-xs w-5 h-5 flex items-center justify-center rounded">
                    {item.quantity}x
                  </span>
                  {item.itemId?.name || "Item"}
                </span>
                <span className="text-stone-500">
                  {item.price * item.quantity} ৳
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
            <span className="font-bold text-stone-800">Total Amount</span>
            <span className="font-bold text-violet-600 text-lg">
              {order.total} ৳
            </span>
          </div>
        </div>

        <div className="bg-stone-50 rounded-xl p-4 text-sm">
          <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">
            Delivery Details
          </h4>
          <p className="flex items-start gap-2 mb-2 text-stone-600">
            <FaMapMarkerAlt className="mt-1 text-violet-500 flex-shrink-0" />
            <span className="break-words">
              {order.deliveryAddress
                ? formatDeliveryAddress(order.deliveryAddress)
                : userAddress
                ? formatDeliveryAddress(userAddress)
                : order.delivery?.address
                ? formatDeliveryAddress(order.delivery.address)
                : "No address provided"}
            </span>
          </p>
          {order.deliveryAddress?.coordinates?.coordinates && (
            <p className="flex items-center gap-2 text-stone-500 text-xs mt-2">
              <span className="font-mono bg-white px-2 py-1 rounded">
                {order.deliveryAddress.coordinates.coordinates[1]?.toFixed(6) || "N/A"},{" "}
                {order.deliveryAddress.coordinates.coordinates[0]?.toFixed(6) || "N/A"}
              </span>
            </p>
          )}
          {order.delivery?.deliveryStaff ? (
            <p className="flex items-center gap-2 text-stone-600 mt-3 pt-3 border-t border-stone-200">
              <FaMotorcycle className="text-violet-500" />
              <span>
                Staff:{" "}
                <span className="font-bold">
                  {order.delivery.deliveryStaff.name}
                </span>
              </span>
            </p>
          ) : (
            order.status !== "cancelled" && (
              <p className="text-amber-500 text-xs italic mt-3 pt-3 border-t border-stone-200">
                Assigning delivery staff...
              </p>
            )
          )}
        </div>
      </div>

      {/* Actions Footer */}
      {isUpcoming &&
        order.status !== "cancelled" &&
        order.status !== "delivered" && (
          <div className="p-4 bg-stone-50 border-t border-stone-100 flex flex-wrap gap-3 justify-end">
            {order.status === "pending" && (
              <button
                onClick={() => cancelOrder(order._id)}
                disabled={updatingId === order._id}
                className="text-red-500 text-sm font-bold hover:bg-red-50 px-4 py-2 rounded-lg transition"
              >
                {updatingId === order._id ? "Cancelling..." : "Cancel Order"}
              </button>
            )}

            {isTrackingAvailable && (
              <button
                onClick={() => fetchTracking(order._id)}
                className="bg-violet-600 text-white text-sm font-bold px-5 py-2 rounded-lg shadow-sm hover:bg-violet-700 transition flex items-center gap-2"
              >
                <FaMotorcycle /> Track Order
              </button>
            )}
          </div>
        )}

      {/* Past Orders Review Action */}
      {!isUpcoming &&
        (order.status === "delivered" || order.status === "completed") &&
        order.delivery?.deliveryStaff &&
        !order.isReviewed && (
          <div className="p-4 bg-violet-50/30 border-t border-violet-100 flex justify-end">
            <button
              onClick={() =>
                onRateDriver(order.delivery.deliveryStaff, order._id)
              }
              className="bg-white text-violet-600 border border-violet-200 text-sm font-bold px-5 py-2 rounded-lg shadow-sm hover:bg-violet-600 hover:text-white transition flex items-center gap-2"
            >
              <FaStar /> Rate Driver
            </button>
          </div>
        )}

      {/* Tracking Info Panel */}
      {tracking && (
        <div className="bg-stone-900 text-stone-300 p-4 text-sm animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 mb-2 text-violet-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>
            Live Tracking
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-xs uppercase text-stone-500">
                Status
              </span>
              <span className="text-white capitalize">
                {tracking.status?.replace("_", " ")}
              </span>
            </div>
            {tracking.deliveryStaff && (
              <div>
                <span className="block text-xs uppercase text-stone-500">
                  Courier
                </span>
                <span className="text-white">
                  {tracking.deliveryStaff.name}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrders;