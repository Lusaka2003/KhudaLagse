import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../api/axios";

export default function ReviewSection() {
  const { id: restaurantId } = useParams(); // grab restaurant ID from route
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");
  void reviews;
  void fetching;
  void error;

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setFetching(true);
        const res = await axiosInstance.get(`/api/reviews/${restaurantId}`);
        setReviews(res.data);
      } catch (err) {
        console.error("Failed to fetch reviews:", err.response?.data || err);
        setError(err.response?.data?.message || "Failed to fetch reviews");
      } finally {
        setFetching(false);
      }
    };

    if (restaurantId) fetchReviews();
  }, [restaurantId]);

  // Submit review
  const submitReview = async () => {
    if (!rating) return alert("Select a rating");

    try {
      setLoading(true);
      const res = await axiosInstance.post(
        `/api/reviews/${restaurantId}`,
        { rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Review submitted:", res.data);

      // Reset form
      setRating(0);
      setComment("");

      // Refresh reviews
      const updated = await axiosInstance.get(`/api/reviews/${restaurantId}`);
      setReviews(updated.data);
    } catch (err) {
      console.error("Failed to submit review:", err.response?.data || err);
      alert(err.response?.data?.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 max-w-2xl mx-auto">
      <h3 className="text-2xl font-bold mb-4">⭐ Reviews</h3>

      {/* Review Form */}
      {token && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <p className="font-semibold mb-2">Rate this restaurant</p>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-2xl ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
              >
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
    </div>
  );
}
