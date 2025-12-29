import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../api/axios";

export default function DeliveryStaffReviewSection() {
  const { id: staffId, orderId } = useParams();
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setFetching(true);
        const res = await axiosInstance.get(`/api/reviews/delivery-staff/${staffId}`);
        setReviews(res.data);
      } catch (err) {
        console.error("Failed to fetch delivery-staff reviews:", err.response?.data || err);
        setError(err.response?.data?.message || "Failed to fetch reviews");
      } finally {
        setFetching(false);
      }
    };

    if (staffId) fetchReviews();
  }, [staffId]);

  const submitReview = async () => {
    if (!rating) return alert("Select a rating");

    try {
      setLoading(true);
      const payload = { rating, comment };
      if (orderId) payload.orderId = orderId;

      const res = await axiosInstance.post(
        `/api/reviews/delivery-staff/${staffId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Delivery staff review submitted:", res.data);

      setRating(0);
      setComment("");

      const updated = await axiosInstance.get(`/api/reviews/delivery-staff/${staffId}`);
      setReviews(updated.data);
    } catch (err) {
      console.error("Failed to submit delivery-staff review:", err.response?.data || err);
      alert(err.response?.data?.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 max-w-2xl mx-auto">
      <h3 className="text-2xl font-bold mb-4">⭐ Delivery Staff Reviews</h3>

      {error ? (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      ) : null}

      {token && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <p className="font-semibold mb-2">Rate this delivery staff</p>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-2xl ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}>
                ★
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Write a review..."
            className="w-full border rounded-lg p-2 mb-3"
          />

          <button
            onClick={submitReview}
            disabled={loading}
            className={`w-full bg-violet-600 text-white px-4 py-2 rounded-lg ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:bg-violet-700"
            }`}
          >
            {loading ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      )}

      {fetching ? (
        <p className="text-center mt-8 text-gray-500">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-center mt-8 text-gray-500">No reviews yet.</p>
      ) : (
        reviews.map(r => (
          <div key={r._id} className="border-b border-gray-200 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-900">{r.user?.name || "Anonymous"}</p>
              <p className="text-yellow-500 text-lg">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
            </div>
            {r.comment && <p className="text-gray-700 mt-2">{r.comment}</p>}
            <p className="text-xs text-gray-500 mt-2">{new Date(r.createdAt).toLocaleDateString()}</p>
          </div>
        ))
      )}
    </div>
  );
}
