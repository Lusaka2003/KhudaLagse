import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import {
  FaBox,
  FaCheckCircle,
  FaClock,
  FaMotorcycle,
  FaStar,
  FaSignOutAlt,
  FaHistory,
  FaBullhorn,
  FaMapMarkerAlt,
  FaTruck,
  FaEdit,
  FaTimes,
} from "react-icons/fa";

export default function DeliveryStaffDashboard() {
  const [totalDeliveries, setTotalDeliveries] = useState(0);
  const [completedDeliveries, setCompletedDeliveries] = useState(0);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState([]);
  const [availableOffers, setAvailableOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const staffId = user?.id || user?._id;
  const averageRating = reviews.length
    ? Number(
        (
          reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) /
          reviews.length
        ).toFixed(1)
      )
    : 0;
  const totalReviews = reviews.length;

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== "deliveryStaff") {
        navigate("/");
        return;
      }
      setUser(parsedUser);
      setIsAvailable(parsedUser.isAvailable !== false);
    } catch (err) {
      console.error("Error parsing user data:", err);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const loadDeliveries = async () => {
      try {
        const res = await axiosInstance.get("/api/deliveries/staff/my");
        if (res.data.totals) {
          setTotalDeliveries(res.data.totals.totalDeliveries || 0);
          setCompletedDeliveries(res.data.totals.completedDeliveries || 0);
        } else {
          setTotalDeliveries((res.data.deliveries || []).length);
        }
        setDeliveries(res.data.deliveries || []);
      } catch (err) {
        console.error("Failed to load deliveries", err);
      }
    };

    const loadAvailableOffers = async () => {
      if (!isAvailable) {
        setAvailableOffers([]);
        return;
      }
      setLoadingOffers(true);
      try {
        const res = await axiosInstance.get("/api/deliveries/offers/available");
        setAvailableOffers(res.data.offers || []);
      } catch (err) {
        console.error("Failed to load offers", err);
      } finally {
        setLoadingOffers(false);
      }
    };

    if (user) {
      loadDeliveries();
      loadAvailableOffers();

      const interval = setInterval(() => {
        loadDeliveries();
        if (isAvailable) loadAvailableOffers();
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [user, isAvailable]);

  useEffect(() => {
    const loadReviews = async () => {
      setLoadingReviews(true);
      try {
        const res = await axiosInstance.get("/api/reviews/delivery-staff/me");
        setReviews(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to load reviews", err);
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };

    if (user) {
      loadReviews();
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("userLogout"));
    navigate("/");
  };

  const toggleAvailability = async () => {
    try {
      const res = await axiosInstance.patch(
        "/api/deliveries/availability/toggle"
      );
      if (res.data.success) {
        const newAvailability = res.data.isAvailable;
        setIsAvailable(newAvailability);
        const userData = localStorage.getItem("user");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          parsedUser.isAvailable = newAvailability;
          localStorage.setItem("user", JSON.stringify(parsedUser));
          setUser(parsedUser);
        }
        if (newAvailability) {
          const offersRes = await axiosInstance.get(
            "/api/deliveries/offers/available"
          );
          setAvailableOffers(offersRes.data.offers || []);
        } else {
          setAvailableOffers([]);
        }
      }
    } catch (err) {
      console.error("Failed to toggle availability", err);
    }
  };

  const refreshDeliveries = async () => {
    try {
      const res = await axiosInstance.get("/api/deliveries/staff/my");
      setDeliveries(res.data.deliveries || []);
    } catch (err) {
      console.error("Failed to load deliveries", err);
    }
  };

  const acceptOffer = async (deliveryId) => {
    try {
      const res = await axiosInstance.post(
        `/api/deliveries/offers/${deliveryId}/accept`
      );
      if (res.data.success) {
        await refreshDeliveries();
        if (isAvailable) {
          const offersRes = await axiosInstance.get(
            "/api/deliveries/offers/available"
          );
          setAvailableOffers(offersRes.data.offers || []);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to accept offer");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center pt-24">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-200 border-t-violet-600"></div>
      </div>
    );
  }

  const activeDeliveriesCount = deliveries.filter((d) =>
    ["assigned", "picked_up", "on_the_way"].includes(d.status)
  ).length;

  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-6 mb-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center text-white text-3xl shadow-lg shadow-violet-100">
              <FaMotorcycle />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-800">
                Hello, {user?.name}
              </h1>
              <p className="text-stone-500 font-medium">
                Ready to hit the road?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-violet-300 text-violet-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              <FaSignOutAlt />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<FaHistory />}
            label="Total"
            value={totalDeliveries}
            subtext={`${completedDeliveries} Completed`}
            onClick={() => navigate("/delivery-staff/my-deliveries")}
            interactive
          />
          <StatCard
            icon={<FaTruck />}
            label="Active"
            value={activeDeliveriesCount}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <StatCard
            icon={<FaStar />}
            label="Rating"
            value={averageRating}
            color="text-amber-600"
            bgColor="bg-amber-50"
          />
          <StatCard
            icon={<FaBullhorn />}
            label="Reviews"
            value={totalReviews}
            onClick={() =>
              staffId && navigate(`/delivery-staff/${staffId}/reviews`)
            }
            interactive
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-violet-500 rounded-full"></span>
                Active Deliveries
              </h2>

              <div className="space-y-4">
                {deliveries.filter(
                  (d) => d.status !== "delivered" && d.status !== "cancelled"
                ).length > 0 ? (
                  deliveries
                    .filter(
                      (d) =>
                        d.status !== "delivered" && d.status !== "cancelled"
                    )
                    .map((delivery) => (
                      <ActiveDeliveryCard
                        key={delivery._id}
                        delivery={delivery}
                        onUpdate={refreshDeliveries}
                      />
                    ))
                ) : (
                  <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center shadow-sm">
                    <p className="text-stone-400 italic">
                      No assigned deliveries right now.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                Available Offers
              </h2>

              <div className="grid gap-4">
                {loadingOffers ? (
                  <p className="text-stone-400 animate-pulse">
                    Checking for new orders...
                  </p>
                ) : (() => {
                    const userCity = user?.address?.city?.toLowerCase().trim();
                    const filteredOffers = availableOffers.filter((offer) => {
                      const offerCity = offer.order?.restaurantId?.location?.city?.toLowerCase().trim();
                      return userCity && offerCity && userCity === offerCity;
                    });
                    
                    return filteredOffers.length > 0 ? (
                      filteredOffers.map((offer) => (
                        <OfferCard
                          key={offer._id}
                          offer={offer}
                          onAccept={acceptOffer}
                        />
                      ))
                    ) : (
                      <div className="bg-stone-100 rounded-2xl p-6 text-center text-stone-500 text-sm">
                        {isAvailable
                          ? userCity
                            ? "No orders available in your city right now..."
                            : "Please set your address in profile to see available orders."
                          : "Go online to see available orders."}
                      </div>
                    );
                  })()}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-stone-800">Staff Profile</h3>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-violet-600 hover:text-violet-700 text-sm font-bold flex items-center gap-1.5 transition"
                >
                  <FaEdit /> Edit
                </button>
              </div>
              <div className="space-y-3">
                <ProfileItem
                  label="Vehicle"
                  value={user?.vehicleType || "Not set"}
                />
                <ProfileItem label="Phone" value={user?.phone} />
                <ProfileItem label="Email" value={user?.email} />
                <ProfileItem
                  label="Address"
                  value={
                    user?.address
                      ? `${user.address.house || ""} ${
                          user.address.road || ""
                        }, ${user.address.area || ""}, ${
                          user.address.city || ""
                        }`.trim()
                      : "Not set"
                  }
                />
              </div>
            </div>

            <div className="bg-violet-900 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-2">Driver Tips</h3>
                <p className="text-violet-300 text-sm">
                  Always check the order contents before leaving the kitchen to
                  ensure complete customer satisfaction.
                </p>
              </div>
              <div className="absolute -right-4 -bottom-4 text-violet-800 text-8xl opacity-20">
                <FaMotorcycle />
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <EditProfileModal
          user={user}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={(updatedUser) => {
            setUser(updatedUser);
            const localData = JSON.parse(localStorage.getItem("user") || "{}");
            localStorage.setItem(
              "user",
              JSON.stringify({ ...localData, ...updatedUser })
            );
          }}
        />
      )}
    </div>
  );
}

const EditProfileModal = ({ user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    vehicleType: user?.vehicleType || "",
    address: {
      house: user?.address?.house || "",
      road: user?.address?.road || "",
      area: user?.address?.area || "",
      city: user?.address?.city || "",
    },
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axiosInstance.put("/api/auth/profile", formData);
      if (res.data.success) {
        onUpdate(res.data.data.user);
        onClose();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="sticky top-0 p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
          <h3 className="text-xl font-bold text-stone-800">Edit Profile</h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 transition p-2 hover:bg-stone-100 rounded-full"
          >
            <FaTimes />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5 ml-1">
              Full Name
            </label>
            <input
              type="text"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5 ml-1">
              Phone Number
            </label>
            <input
              type="tel"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5 ml-1">
              Vehicle Type
            </label>
            <select
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition appearance-none"
              value={formData.vehicleType}
              onChange={(e) =>
                setFormData({ ...formData, vehicleType: e.target.value })
              }
              required
            >
              <option value="">Select Vehicle</option>
              <option value="Bike">Bike</option>
              <option value="Bicycle">Bicycle</option>
              <option value="Car">Car</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="pt-2">
            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 ml-1">
              Address
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5 ml-1">
                  House/Flat No.
                </label>
                <input
                  type="text"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition"
                  value={formData.address.house}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, house: e.target.value },
                    })
                  }
                  placeholder="e.g., 123"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5 ml-1">
                  Road/Street
                </label>
                <input
                  type="text"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition"
                  value={formData.address.road}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, road: e.target.value },
                    })
                  }
                  placeholder="e.g., Main Street"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5 ml-1">
                  Area
                </label>
                <input
                  type="text"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition"
                  value={formData.address.area}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, area: e.target.value },
                    })
                  }
                  placeholder="e.g., Gulshan"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5 ml-1">
                  City
                </label>
                <input
                  type="text"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition"
                  value={formData.address.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value },
                    })
                  }
                  placeholder="e.g., Dhaka"
                />
              </div>
            </div>
          </div>
          
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl font-bold text-stone-500 hover:bg-stone-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 shadow-lg shadow-violet-100 transition active:scale-95 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  subtext,
  color = "text-violet-700",
  bgColor = "bg-violet-50",
  onClick,
  interactive,
}) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-2xl border border-stone-200 p-5 shadow-sm transition-all ${
      interactive
        ? "cursor-pointer hover:border-violet-300 hover:shadow-md active:scale-95"
        : ""
    }`}
  >
    <div className="flex items-center gap-3 mb-3">
      <div
        className={`w-10 h-10 rounded-xl ${bgColor} ${color} flex items-center justify-center text-lg`}
      >
        {icon}
      </div>
      <span className="text-stone-500 font-semibold text-xs uppercase tracking-wider">
        {label}
      </span>
    </div>
    <div className="flex items-end gap-2">
      <span className="text-2xl font-bold text-stone-800 leading-none">
        {value}
      </span>
      {subtext && (
        <span className="text-xs text-stone-400 font-medium pb-0.5">
          {subtext}
        </span>
      )}
    </div>
  </div>
);

const ActiveDeliveryCard = ({ delivery, onUpdate }) => {
  const [status, setStatus] = useState(delivery.status);
  const [saving, setSaving] = useState(false);

  const updateStatus = async (newStatus) => {
    try {
      setSaving(true);
      await axiosInstance.patch(`/api/deliveries/${delivery._id}/location`, {
        status: newStatus,
      });
      setStatus(newStatus);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  const statusConfig = {
    assigned: {
      color: "bg-blue-50 text-blue-700 border-blue-100",
      label: "Assigned",
    },
    picked_up: {
      color: "bg-purple-50 text-purple-700 border-purple-100",
      label: "Picked Up",
    },
    on_the_way: {
      color: "bg-orange-50 text-orange-700 border-orange-100",
      label: "On the Way",
    },
    delivered: {
      color: "bg-violet-50 text-violet-700 border-violet-100",
      label: "Delivered",
    },
  };

  const orderId = delivery.order?._id || delivery.order;
  const formattedId = String(orderId).slice(-6).toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm transition hover:shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 text-xl font-bold">
            <FaBox />
          </div>
          <div>
            <h4 className="font-bold text-stone-800">Order #{formattedId}</h4>
            <p className="text-xs text-stone-400 font-mono mb-1">
              {delivery.order?.restaurantId?.name || "Kitchen order"}
            </p>
            <div
              className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                statusConfig[status]?.color || "bg-stone-100"
              }`}
            >
              {statusConfig[status]?.label || status}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => updateStatus(e.target.value)}
            disabled={saving}
            className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          >
            <option value="assigned">Awaiting Pickup</option>
            <option value="picked_up">Picked Up</option>
            <option value="on_the_way">Out for Delivery</option>
            <option value="delivered">Mark Delivered</option>
          </select>
        </div>
      </div>

      <div className="bg-stone-50 rounded-xl p-4 text-sm space-y-2 mb-3">
        <h4 className="font-bold text-stone-800">Pickup Location</h4>
        <div className="flex items-start gap-3">
          <FaMapMarkerAlt className="mt-1 text-orange-500 shrink-0" />
          <span className="text-stone-600">
            {delivery.order?.restaurantId?.location
              ? `${delivery.order.restaurantId.location.house || ""} ${
                  delivery.order.restaurantId.location.road || ""
                }, ${delivery.order.restaurantId.location.area || ""}, ${
                  delivery.order.restaurantId.location.city || ""
                }`.trim()
              : "No address set"}
          </span>
        </div>
      </div>

      <div className="bg-stone-50 rounded-xl p-4 text-sm space-y-2">
        <h4 className="font-bold text-stone-800">Delivery Location</h4>
        <div className="flex items-start gap-3">
          <FaMapMarkerAlt className="mt-1 text-violet-500 shrink-0" />
          <span className="text-stone-600 font-medium">
            {delivery.order?.deliveryAddress?.fullAddress
              ? delivery.order.deliveryAddress.fullAddress
              : delivery.address
              ? `${delivery.address.house} ${delivery.address.road}, ${delivery.address.area}, ${delivery.address.city}`
              : "No address set"}
          </span>
        </div>
        {delivery.order?.deliveryAddress?.coordinates && (
          <div className="flex items-center gap-3 text-xs text-stone-500">
            <span className="text-violet-500">📍</span>
            <span className="font-mono">
              Lat:{" "}
              {delivery.order.deliveryAddress.coordinates.coordinates[1]?.toFixed(
                4
              )}
              , Lng:{" "}
              {delivery.order.deliveryAddress.coordinates.coordinates[0]?.toFixed(
                4
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};


const OfferCard = ({ offer, onAccept }) => (
  <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-center gap-4 transition hover:bg-violet-100/50">
    <div className="flex-1 w-full sm:w-auto">
      <div className="flex items-center gap-2 mb-1">
        <span className="bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
          New Offer
        </span>
        <span className="text-stone-800 font-bold">
          Order #{String(offer.order?._id).slice(-6).toUpperCase()}
        </span>
      </div>
      <p className="text-violet-900 font-medium mb-1">
        {offer.order?.restaurantId?.name}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-violet-700/70 font-medium">
        <span className="flex items-center gap-1.5">
          <FaMapMarkerAlt />{" "}
          {offer.order?.restaurantId?.location?.area || "Nearby"}
        </span>
        <span className="flex items-center gap-1.5">
          <FaCheckCircle /> {offer.order?.total} ৳ Payment
        </span>
      </div>
    </div>
    <button
      onClick={() => onAccept(offer._id)}
      className="w-full sm:w-auto px-6 py-2.5 bg-violet-700 text-white rounded-xl font-bold hover:bg-violet-800 transition active:scale-95 shadow-md shadow-violet-200"
    >
      Accept
    </button>
  </div>
);

const ProfileItem = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
      {label}
    </span>
    <span className="text-stone-700 font-medium truncate">
      {value || "Not set"}
    </span>
  </div>
);

