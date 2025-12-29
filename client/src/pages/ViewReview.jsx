import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../api/axios";

export default function ViewReview() {
  const { id } = useParams(); // restaurant ID
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axiosInstance.get(`/api/reviews/${id}`);
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
    <div className="max-w-2xl mx-auto mt-8 p-4 space-y-4">
      <h2 className="text-2xl font-bold mb-4">All Reviews</h2>
      {reviews.map((r) => (
        <div
          key={r._id}
          className="border rounded-lg p-4 shadow-sm hover:shadow-md transition"
        >
          <div className="flex justify-between items-center mb-2">
            <p className="font-semibold">{r.user?.name || "Anonymous"}</p>
            <p className="text-gray-400 text-sm">
              {new Date(r.createdAt).toLocaleString()}
            </p>
          </div>
          <p className="text-yellow-500 text-lg">
            {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
          </p>
          {r.comment && <p className="text-gray-700 mt-2">{r.comment}</p>}
        </div>
      ))}
    </div>
  );
}
