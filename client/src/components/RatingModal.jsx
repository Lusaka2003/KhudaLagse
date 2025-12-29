import { useState } from "react";
import { FaStar, FaTimes } from "react-icons/fa";
import axiosInstance from "../api/axios";

const RatingModal = ({ isOpen, onClose, staff, orderId, onSubmitSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axiosInstance.post(`/api/reviews/delivery-staff/${staff._id}`, {
        rating,
        comment,
        orderId
      });
      onSubmitSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to submit review:", err);
      setError(err.response?.data?.message || "Failed to submit review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition"
          >
            <FaTimes size={20} />
          </button>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              ⭐
            </div>
            <h3 className="text-2xl font-bold text-stone-800">Rate Your Delivery</h3>
            <p className="text-stone-500">How was your experience with {staff.name}?</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="transition-transform active:scale-90"
                  >
                    <FaStar
                      className={`text-3xl ${
                        star <= (hover || rating) ? "text-amber-400" : "text-stone-200"
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-sm font-bold text-stone-400 uppercase tracking-widest h-5">
                {rating === 5 ? "Excellent!" : 
                 rating === 4 ? "Very Good" : 
                 rating === 3 ? "Good" : 
                 rating === 2 ? "Poor" : 
                 rating === 1 ? "Very Poor" : ""}
              </span>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">
                Leave a comment (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your feedback..."
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition resize-none h-24"
              ></textarea>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-lg border border-red-100">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
                loading 
                  ? "bg-stone-300 cursor-not-allowed" 
                  : "bg-violet-600 hover:bg-violet-700 hover:shadow-violet-200 active:scale-[0.98]"
              }`}
            >
              {loading ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
