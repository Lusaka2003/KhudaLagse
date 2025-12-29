import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../api/axios";

const DeliveryStaffViewReview = () => {
  const { id } = useParams();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axiosInstance.get(`/api/reviews/delivery-staff/${id}`);
        setReviews(res.data);
      } catch (err) {
        console.error("Failed to fetch reviews:", err.response || err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [id]);

  if (loading)
    return <p className="text-center mt-8 text-gray-500">Loading reviews...</p>;

  if (reviews.length === 0)
    return <p className="text-center mt-8 text-gray-500">No reviews yet.</p>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Delivery Staff Reviews</h2>
        {reviews.map((r) => (
          <div
            key={r._id}
            className="border-b border-gray-200 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-900">{r.user?.name || "Anonymous"}</p>
              <p className="text-yellow-500 text-lg">
                {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
              </p>
            </div>
            {r.comment && (
              <p className="text-gray-700 mt-2">{r.comment}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {new Date(r.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeliveryStaffViewReview;
