import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';

/* ---------- Rating Stars Component ---------- */
const RatingStars = ({ rating = 0 }) => {
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          className={star <= rounded ? 'text-amber-400 text-sm' : 'text-stone-300 text-sm'}
        >
          ★
        </span>
      ))}
    </div>
  );
};

/* ---------- Main Restaurants Component ---------- */
export default function Restaurants() {
  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchRestaurants();
    fetchFavorites();
    fetchUserData();
  }, []);

  const fetchUserData = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
  };

  /* ---------- Fetch Restaurants ---------- */
  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/restaurants');
      const restaurantsData = res.data;

      const reviewsResponses = await Promise.all(
        restaurantsData.map(r => axiosInstance.get(`/api/reviews/${r._id}`).then(res => res.data))
      );

      const restaurantsWithRatings = restaurantsData.map((r, i) => {
        const reviews = reviewsResponses[i];
        const totalRatings = reviews.length;
        const avgRating = totalRatings
          ? reviews.reduce((sum, rev) => sum + rev.rating, 0) / totalRatings
          : 0;
        return { ...r, totalRatings, rating: avgRating };
      });

      setRestaurants(restaurantsWithRatings);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Fetch Favorites ---------- */
  const fetchFavorites = async () => {
    try {
      const res = await axiosInstance.get('/api/auth/favorites');
      const favData = res.data.favorites || [];
      const favIds = favData.map(f => typeof f === 'string' ? f : f._id?.toString() || f.toString());
      setFavorites(favIds);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setFavorites([]);
    }
  };

  /* ---------- Toggle Favorite ---------- */
  const toggleFavorite = async (restaurantId) => {
    try {
      const isFavorite = favorites.includes(restaurantId);
      
      if (isFavorite) {
        await axiosInstance.delete(`/api/auth/favorites/${restaurantId}`);
        setFavorites(prev => prev.filter(id => id !== restaurantId));
      } else {
        await axiosInstance.post(`/api/auth/favorites/${restaurantId}`);
        setFavorites(prev => [...prev, restaurantId]);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert('Failed to update favorites. Please try again.');
    }
  };

  /* ---------- Filters ---------- */
  const allCuisines = [...new Set(restaurants.flatMap(r => r.cuisineTypes || []))].sort();

  const filteredRestaurants = restaurants
    .filter(r => {
      const matchesSearch =
        r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.location?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.location?.area?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCuisine = !selectedCuisine || r.cuisineTypes?.includes(selectedCuisine);
      return matchesSearch && matchesCuisine;
    })
    .sort((a, b) => {
      if (a.totalRatings === 0 && b.totalRatings === 0) return 0;
      if (a.totalRatings === 0) return 1;
      if (b.totalRatings === 0) return -1;
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.totalRatings - a.totalRatings;
    });

  const formatAddress = location => {
    if (!location) return 'Address not available';
    return [location.house, location.road, location.area, location.city].filter(Boolean).join(', ');
  };

  /* ---------- Loading / Error ---------- */
  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center pt-24">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-violet-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-stone-600 text-lg">Loading restaurants...</p>
      </div>
    </div>
  );

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-violet-50/30 to-stone-100 pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header Dashboard Widgets (Only if user logged in) */}
        {user && (
          <div className="mb-12">
            {/* Welcome / Title */}
            <div className="bg-gradient-to-r from-violet-700 to-violet-600 rounded-2xl p-8 text-white shadow-lg flex flex-col justify-center text-center md:text-left">
              <h1 className="text-4xl font-bold mb-2">Discover Food</h1>
              <p className="text-violet-100 text-lg">Find your next favorite meal from our curated kitchens.</p>
            </div>
          </div>
        )}

        {/* Search & Filter Header (If not user, show title here) */}
        {!user && (
          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold text-stone-800 mb-3 tracking-tight">Restaurants</h1>
            <p className="text-stone-500 text-lg">Curated kitchens delivering fresh to your door.</p>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/60 mb-10 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">🔍</span>
            <input
              type="text"
              placeholder="Search by name, city, or area..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition"
            />
          </div>
          <div className="md:w-64 relative">
             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">🥘</span>
            <select
              value={selectedCuisine}
              onChange={e => setSelectedCuisine(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-stone-50 border border-stone-200 rounded-xl appearance-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition cursor-pointer"
            >
              <option value="">All Cuisines</option>
              {allCuisines.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">▼</span>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center mb-8">
            <h2 className="text-red-800 font-bold text-xl mb-2">Error Loading Restaurants</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button onClick={fetchRestaurants} className="bg-violet-600 text-white px-6 py-3 rounded-lg hover:bg-violet-700 transition">Try Again</button>
          </div>
        )}

        {/* Restaurant Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRestaurants.map(r => (
            <div 
              key={r._id} 
              onClick={() => navigate(`/restaurants/${r._id}`)} 
              className="group bg-white rounded-2xl border border-stone-200/60 shadow-sm hover:shadow-xl hover:border-violet-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
            >
              {/* Image Placeholder */}
              <div className="h-48 bg-gradient-to-br from-stone-100 to-stone-200 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-500">
                  🍽️
                </div>
                
                {/* Favorite Button */}
                <button
                  onClick={e => { 
                    e.stopPropagation(); 
                    toggleFavorite(r._id); 
                  }}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-white transition"
                >
                  <span className={`text-xl transition-all ${favorites.includes(r._id) ? 'scale-110' : 'grayscale opacity-40 hover:opacity-70 hover:scale-110'}`}>
                    ❤️
                  </span>
                </button>

                {/* Cuisine Tag */}
                {r.cuisineTypes && r.cuisineTypes[0] && (
                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium">
                    {r.cuisineTypes[0]}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-bold text-stone-800 group-hover:text-violet-700 transition line-clamp-1">
                    {r.name}
                  </h2>
                  <div className="flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-lg border border-stone-100">
                    <span className="text-amber-400 text-sm">★</span>
                    <span className="text-sm font-bold text-stone-700">{r.rating.toFixed(1)}</span>
                    <span className="text-xs text-stone-400">({r.totalRatings})</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-stone-500 mb-6 text-sm">
                  <span className="shrink-0 mt-0.5">📍</span>
                  <span className="line-clamp-2">{formatAddress(r.location)}</span>
                </div>

                <div className="mt-auto pt-6 border-t border-stone-100">
                  <button className="w-full py-3 rounded-xl bg-violet-50 text-violet-700 font-semibold hover:bg-violet-600 hover:text-white transition-colors duration-300 flex items-center justify-center gap-2 group/btn">
                    View Menu
                    <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}