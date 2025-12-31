import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import {
	FaMapMarkerAlt,
	FaStar,
	FaTruck,
	FaChevronDown,
	FaCalendarDay,
	FaCalendarWeek,
	FaCalendar,
	FaClock,
	FaExclamationTriangle,
} from 'react-icons/fa';
import FloatingCart from '../components/FloatingCart';
import SubscriptionManager from '../components/SubscriptionManager';

const FALLBACK_IMAGE = '/bgrnd.webp';
const DAYS = [
	'sunday',
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
];

// Time restrictions
const ORDER_DEADLINES = {
	lunch: {
		hour: 10,
		minute: 0,
		label: '10:00 AM'
	},
	dinner: {
		hour: 16,
		minute: 0,
		label: '4:00 PM'
	}
};

// Helper function to check if ordering is allowed for a meal type
const canOrderMeal = (mealType, itemDate = null) => {
	const now = new Date();
	const deadline = ORDER_DEADLINES[mealType];
	
	if (!deadline) return true; // No restriction for unknown meal types
	
	// Create deadline time for today
	const deadlineTime = new Date();
	deadlineTime.setHours(deadline.hour, deadline.minute, 0, 0);
	
	// If itemDate is provided, check if it's for today
	if (itemDate) {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		const itemDateObj = new Date(itemDate);
		itemDateObj.setHours(0, 0, 0, 0);
		
		// If item is not for today, allow ordering (future dates)
		if (itemDateObj.getTime() !== today.getTime()) {
			return true;
		}
	}
	
	// Check if current time is before deadline
	return now < deadlineTime;
};

// Helper function to format time remaining
const getTimeRemainingMessage = (mealType) => {
	const now = new Date();
	const deadline = ORDER_DEADLINES[mealType];
	const deadlineTime = new Date();
	deadlineTime.setHours(deadline.hour, deadline.minute, 0, 0);
	
	if (now >= deadlineTime) {
		const nextDay = new Date(now);
		nextDay.setDate(nextDay.getDate() + 1);
		nextDay.setHours(0, 0, 0, 0);
		
		const hoursUntilTomorrow = Math.ceil((nextDay - now) / (1000 * 60 * 60));
		return `Ordering closed. Opens again in ${hoursUntilTomorrow} hour${hoursUntilTomorrow !== 1 ? 's' : ''}`;
	}
	
	const diffMs = deadlineTime - now;
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
	
	if (diffHours > 0) {
		return `Order closes in ${diffHours}h ${diffMinutes}m`;
	}
	return `Order closes in ${diffMinutes} minutes`;
};

// Helper function to get next 30 days
function getNext30Days() {
    const days = [];
    const today = new Date();
    const todayMs = today.getTime();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    for (let i = 0; i < 30; i++) {
        const date = new Date(todayMs + (i * dayInMs));
        days.push({
            date: date,
            dateString: date.toISOString().split('T')[0],
            displayDate: date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            }),
            dayName: date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        });
    }
    
    return days;
}

export default function KitchenProfile() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [kitchen, setKitchen] = useState(null);
	const [menuItems, setMenuItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [selectedItem, setSelectedItem] = useState(null);
	const [showItemModal, setShowItemModal] = useState(false);
	const [user, setUser] = useState(null);
	const [currentTime, setCurrentTime] = useState(new Date()); // For real-time updates
	
	// Reviews state
	const [reviews, setReviews] = useState([]);
	const [showAllReviews, setShowAllReviews] = useState(false);
	const [showReviewForm, setShowReviewForm] = useState(false);
	const [reviewRating, setReviewRating] = useState(5);
	const [reviewComment, setReviewComment] = useState('');
	const [reviewLoading, setReviewLoading] = useState(false);

	// Subscription state
	const [showSubscription, setShowSubscription] = useState(false);

	// Menu view state
	const [menuView, setMenuView] = useState('today'); // 'today', 'weekly', 'monthly'
	const [activeDay, setActiveDay] = useState(DAYS[new Date().getDay()]);

	const [cart, setCart] = useState(() => {
		const saved = localStorage.getItem('cart');
		return saved ? JSON.parse(saved) : [];
	});

	// Update current time every minute
	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTime(new Date());
		}, 60000); // Update every minute
		
		return () => clearInterval(timer);
	}, []);

	// Check user role
	useEffect(() => {
		const userData = localStorage.getItem('user');
		if (userData) {
			try {
				const parsedUser = JSON.parse(userData);
				setUser(parsedUser);
			} catch (err) {
				console.error('Error parsing user data:', err);
			}
		}
	}, []);

	// Persist cart
	useEffect(() => {
		localStorage.setItem('cart', JSON.stringify(cart));
		window.dispatchEvent(new Event('cartUpdated'));
	}, [cart]);

	// Fetch Data
	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				const [kitchenRes, menuRes, reviewsRes] = await Promise.all([
					axiosInstance.get(`/api/restaurants/${id}`),
					axiosInstance.get(`/api/menu/restaurant/${id}`),
					axiosInstance.get(`/api/reviews/${id}`),
				]);

				setKitchen(kitchenRes.data);
				setMenuItems(menuRes.data.data || []);
				setReviews(reviewsRes.data || []);
			} catch (err) {
				setError(err.message || 'Failed to fetch kitchen data');
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [id]);

	const addToCart = (item) => {
		// Check if ordering is allowed for this meal type and date
		if (!canOrderMeal(item.mealType, item.date)) {
			const deadline = ORDER_DEADLINES[item.mealType];
			alert(`Sorry! ${item.mealType.charAt(0).toUpperCase() + item.mealType.slice(1)} ordering is closed after ${deadline.label}. Please order in advance for tomorrow.`);
			return;
		}
		
		// Get the item's date from the menu item
		const itemDate = new Date(item.date);
		
		const itemWithDelivery = {
			...item,
			quantity: 1,
			date: itemDate.toISOString(),
			deliveryDate: itemDate.toISOString(),
			restaurant: id,
			restaurantId: id,
		};

		const exists = cart.some(
			(ci) =>
				ci._id === item._id &&
				ci.date === itemWithDelivery.date &&
				ci.mealType === item.mealType
		);
		
		if (exists) {
			return alert(`${item.name} is already in your cart for this time.`);
		}

		setCart((prev) => [...prev, itemWithDelivery]);
		alert(`${item.name} added to cart for ${itemDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}!`);
	};

	const submitReview = async () => {
		if (!reviewComment.trim()) return alert('Please write a comment');
		setReviewLoading(true);
		try {
			const { data } = await axiosInstance.post(`/api/reviews/${id}`, {
				rating: reviewRating,
				comment: reviewComment,
			});
			
			const newReview = data.review;
			setReviews((prev) => [newReview, ...prev.filter(r => r._id !== newReview._id)]);
			
			setReviewComment('');
			setReviewRating(5);
			setShowReviewForm(false);
			alert('Review submitted and is now pending admin approval!');
		} catch (err) {
			console.error(err);
			alert(err.response?.data?.message || 'Failed to submit review');
		} finally {
			setReviewLoading(false);
		}
	};

	const formatAddress = (loc) => {
		if (!loc) return 'Address not available';
		const parts = [loc.house, loc.road, loc.area, loc.city].filter(Boolean);
		return parts.length ? parts.join(', ') : 'Address not available';
	};

	// Group menu items based on view
	const getTodayItems = () => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		// Format today's date string in local timezone
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, '0');
		const day = String(today.getDate()).padStart(2, '0');
		const todayString = `${year}-${month}-${day}`;
		
		return menuItems.filter(item => {
			if (!item.date) return false;
			
			const itemDate = new Date(item.date);
			itemDate.setHours(0, 0, 0, 0);
			
			// Format item date in local timezone
			const itemYear = itemDate.getFullYear();
			const itemMonth = String(itemDate.getMonth() + 1).padStart(2, '0');
			const itemDay = String(itemDate.getDate()).padStart(2, '0');
			const itemDateString = `${itemYear}-${itemMonth}-${itemDay}`;
			
			return itemDateString === todayString;
		});
	};

	const getWeeklyItems = () => {
		return DAYS.reduce((acc, day) => {
			acc[day] = {
				lunch: menuItems.filter(
					(item) => item.day === day && item.mealType === 'lunch'
				),
				dinner: menuItems.filter(
					(item) => item.day === day && item.mealType === 'dinner'
				),
			};
			return acc;
		}, {});
	};

	const getMonthlyItems = () => {
		const next30Days = getNext30Days();
		const itemsByDate = {};
		
		next30Days.forEach(day => {
			itemsByDate[day.dateString] = menuItems.filter(item => {
				const itemDate = new Date(item.date).toISOString().split('T')[0];
				return itemDate === day.dateString;
			});
		});
		
		return { next30Days, itemsByDate };
	};

	if (loading) return (
		<div className="min-h-screen flex items-center justify-center pt-20 bg-stone-50">
			<div className="text-center">
				<div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-200 border-t-violet-600 mx-auto mb-4"></div>
				<p className="text-stone-600">Loading kitchen...</p>
			</div>
		</div>
	);

	if (!kitchen) return (
		<div className="min-h-screen flex items-center justify-center pt-20 bg-stone-50">
			<p>Kitchen not found.</p>
		</div>
	);

	const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

	return (
		<div className="min-h-screen bg-stone-50 pt-20 pb-24">
			{/* Hero Section */}
			<div className="relative h-[40vh] min-h-[300px] w-full bg-stone-900 overflow-hidden">
				<img 
					src={kitchen.imageUrl || FALLBACK_IMAGE} 
					alt={kitchen.name}
					className="w-full h-full object-cover opacity-60 scale-105"
					style={{ filter: 'brightness(0.7)' }}
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent" />
				<div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto flex flex-col md:flex-row items-end justify-between gap-6">
					<div className="text-white relative z-10">
						<div className="flex items-center gap-3 mb-3">
							<span className="bg-violet-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
								{kitchen.cuisineTypes?.[0] || 'Home Cooked'}
							</span>
							<div className="flex items-center gap-1 text-amber-400 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full">
								<FaStar />
								<span className="font-bold text-white">{kitchen.rating?.toFixed(1) || '0.0'}</span>
								<span className="text-stone-300 text-xs">({kitchen.totalRatings || 0})</span>
							</div>
						</div>
						<h1 className="text-4xl md:text-6xl font-bold mb-3 tracking-tight text-white drop-shadow-lg">{kitchen.name}</h1>
						<div className="flex flex-wrap items-center gap-6 text-stone-200 text-sm font-medium">
							<span className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-lg"><FaMapMarkerAlt className="text-violet-400" /> {formatAddress(kitchen.location)}</span>
							<span className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-lg"><FaTruck className="text-violet-400" /> Free Delivery</span>
						</div>
					</div>
					
					
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 py-12">
				
				{/* About Section */}
				<div className="mb-12 max-w-3xl">
					<h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">About the Kitchen</h2>
					<p className="text-stone-700 leading-relaxed text-xl font-light">
						{kitchen.about || "Welcome to our kitchen! We prepare fresh, healthy, and delicious home-cooked meals daily. Using only the finest ingredients, we ensure every bite feels like home."}
					</p>
				</div>

				{/* Order Deadline Banner */}
				<div className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
					<div className="flex items-center gap-3 mb-3">
						<div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
							<FaClock />
						</div>
						<div>
							<h3 className="font-bold text-amber-900">Order Deadlines</h3>
							<p className="text-sm text-amber-700">Order in advance to ensure availability</p>
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						<div className={`p-3 rounded-lg border ${canOrderMeal('lunch') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
							<div className="flex justify-between items-center">
								<span className="font-semibold text-stone-800">Lunch</span>
								<span className={`text-xs px-2 py-1 rounded-full ${canOrderMeal('lunch') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
									{canOrderMeal('lunch') ? 'Open' : 'Closed'}
								</span>
							</div>
							<p className="text-sm text-stone-600 mt-1">
								Closes at {ORDER_DEADLINES.lunch.label}
								<br />
								<span className="text-xs font-medium">{getTimeRemainingMessage('lunch')}</span>
							</p>
						</div>
						<div className={`p-3 rounded-lg border ${canOrderMeal('dinner') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
							<div className="flex justify-between items-center">
								<span className="font-semibold text-stone-800">Dinner</span>
								<span className={`text-xs px-2 py-1 rounded-full ${canOrderMeal('dinner') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
									{canOrderMeal('dinner') ? 'Open' : 'Closed'}
								</span>
							</div>
							<p className="text-sm text-stone-600 mt-1">
								Closes at {ORDER_DEADLINES.dinner.label}
								<br />
								<span className="text-xs font-medium">{getTimeRemainingMessage('dinner')}</span>
							</p>
						</div>
					</div>
				</div>

				{/* Reviews & Subscription Layout */}
				<div className="mb-12 space-y-8">
					
					{/* Reviews Section */}
					<div>
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-xl font-bold text-stone-800">What People Say</h2>
							<div className="flex gap-3">
								<button 
									onClick={() => setShowReviewForm(!showReviewForm)}
									className="text-violet-700 font-bold hover:text-violet-800 transition text-xs uppercase tracking-wide"
								>
									Write Review
								</button>
								{reviews.length > 3 && (
									<button 
										onClick={() => setShowAllReviews(!showAllReviews)}
										className="text-stone-400 hover:text-stone-600 font-medium transition text-xs"
									>
										{showAllReviews ? 'Show Less' : 'View All'}
									</button>
								)}
							</div>
						</div>

						{showReviewForm && (
							<div className="bg-white p-4 rounded-xl border border-stone-200 mb-6 shadow-sm">
								<div className="flex gap-2 mb-3">
									{[1, 2, 3, 4, 5].map((star) => (
										<button
											key={star}
											onClick={() => setReviewRating(star)}
											className={`text-xl transition ${star <= reviewRating ? 'text-amber-400' : 'text-stone-300'}`}
										>
											★
										</button>
									))}
								</div>
								<textarea
									value={reviewComment}
									onChange={(e) => setReviewComment(e.target.value)}
									placeholder="Describe your experience..."
									className="w-full rounded-lg border border-stone-200 p-3 mb-3 focus:border-violet-500 focus:outline-none text-sm"
									rows="2"
								/>
								<div className="flex justify-end gap-2">
									<button 
										onClick={() => setShowReviewForm(false)}
										className="px-3 py-1.5 text-stone-500 hover:bg-stone-50 rounded-lg transition text-xs font-medium"
									>
										Cancel
									</button>
									<button
										onClick={submitReview}
										disabled={reviewLoading}
										className="bg-violet-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-violet-700 transition"
									>
										Post
									</button>
								</div>
							</div>
						)}

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{reviews.length === 0 ? (
								<div className="col-span-full bg-stone-50 rounded-xl p-6 text-center text-stone-500 italic text-sm">
									No reviews yet. Be the first to try their food!
								</div>
							) : (
								displayedReviews.map((review) => (
									<div key={review._id || Math.random()} className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm hover:shadow-md transition duration-300 relative overflow-hidden">
										{review.status === 'pending' && (
											<div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider z-10">
												Pending Approval
											</div>
										)}
										<div className="flex justify-between items-start mb-2">
											<div className="flex items-center gap-2">
												<div className="w-8 h-8 rounded-full bg-violet-50 text-violet-700 flex items-center justify-center font-bold text-xs uppercase">
													{review.user?.name?.charAt(0) || 'U'}
												</div>
												<div className="min-w-0">
													<h4 className="font-bold text-stone-800 text-xs truncate max-w-[100px]">{review.user?.name || 'Verified User'}</h4>
													<p className="text-[10px] text-stone-400">{new Date(review.createdAt).toLocaleDateString()}</p>
												</div>
											</div>
											<div className="flex text-amber-400 text-xs">
												{[...Array(5)].map((_, i) => (
													<span key={i}>{i < review.rating ? '★' : '☆'}</span>
												))}
											</div>
										</div>
										<p className="text-stone-600 text-xs leading-relaxed line-clamp-3 italic">"{review.comment}"</p>
									</div>
								))
							)}
						</div>
					</div>

					{/* Subscription */}
					<div>
						<div className="bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden group">
							<button 
								onClick={() => setShowSubscription(!showSubscription)}
								className="w-full flex items-center justify-between p-4 bg-violet-50/50 hover:bg-violet-50 transition duration-300"
							>
								<div className="text-left flex items-center gap-3">
									<div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-xl">📅</div>
									<div>
										<h3 className="font-bold text-violet-900 text-base">Subscription Plans</h3>
										<p className="text-violet-700/70 text-xs font-medium">Automate your meals & save</p>
									</div>
								</div>
								<div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center text-violet-600 transition-transform duration-300 shadow-sm ${showSubscription ? 'rotate-180' : ''}`}>
									<FaChevronDown />
								</div>
							</button>
							
							{showSubscription && (
								<div className="p-6 border-t border-violet-100 bg-white animate-in slide-in-from-top-2 duration-300">
									<SubscriptionManager restaurantId={id} />
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Menu Section */}
				<div id="menu">
					<div className="flex items-center justify-center mb-10">
						<div className="h-px bg-stone-200 w-24"></div>
						<h2 className="text-3xl font-bold text-stone-800 mx-6 tracking-tight">Menu</h2>
						<div className="h-px bg-stone-200 w-24"></div>
					</div>

					{/* Menu View Toggle */}
					<div className="flex justify-center mb-10">
						<div className="inline-flex bg-white p-1.5 rounded-2xl shadow-lg border border-stone-100">
							<button
								onClick={() => setMenuView('today')}
								className={`px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300 ${
									menuView === 'today'
										? 'bg-violet-600 text-white shadow-md'
										: 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
								}`}
							>
								<FaCalendarDay />
								Today
							</button>
							<button
								onClick={() => setMenuView('weekly')}
								className={`px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300 ${
									menuView === 'weekly'
										? 'bg-violet-600 text-white shadow-md'
										: 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
								}`}
							>
								<FaCalendarWeek />
								Weekly
							</button>
							<button
								onClick={() => setMenuView('monthly')}
								className={`px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300 ${
									menuView === 'monthly'
										? 'bg-violet-600 text-white shadow-md'
										: 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
								}`}
							>
								<FaCalendar />
								Monthly
							</button>
						</div>
					</div>

					{/* Menu Content */}
					<div className="min-h-[400px]">
						{menuView === 'today' && (
							<TodayMenu 
								items={getTodayItems()}
								openItemModal={(item) => {
									setSelectedItem(item);
									setShowItemModal(true);
								}}
								addToCart={addToCart}
								isCustomer={user?.role === 'customer'}
								currentTime={currentTime}
							/>
						)}

						{menuView === 'weekly' && (
							<>
								<div className="flex justify-center mb-8">
									<div className="inline-flex bg-stone-100 p-1.5 rounded-full shadow-inner overflow-x-auto max-w-full">
										{DAYS.map((day) => (
											<button
												key={day}
												onClick={() => setActiveDay(day)}
												className={`px-6 py-2.5 rounded-full text-sm font-bold capitalize whitespace-nowrap transition-all duration-300 ${
													activeDay === day
														? 'bg-white text-violet-700 shadow-md ring-1 ring-black/5'
														: 'text-stone-500 hover:text-stone-700 hover:bg-stone-200/50'
												}`}
											>
												{day}
											</button>
										))}
									</div>
								</div>
								<DayMenu 
									day={activeDay}
									items={getWeeklyItems()[activeDay]}
									openItemModal={(item) => {
										setSelectedItem(item);
										setShowItemModal(true);
									}}
									addToCart={addToCart}
									isCustomer={user?.role === 'customer'}
									currentTime={currentTime}
								/>
							</>
						)}

						{menuView === 'monthly' && (
							<MonthlyMenu 
								data={getMonthlyItems()}
								openItemModal={(item) => {
									setSelectedItem(item);
									setShowItemModal(true);
								}}
								addToCart={addToCart}
								isCustomer={user?.role === 'customer'}
								currentTime={currentTime}
							/>
						)}
					</div>
				</div>
			</div>

			{/* Item Modal */}
			{showItemModal && selectedItem && (
				<ItemModal
					item={selectedItem}
					closeModal={() => setShowItemModal(false)}
					addToCart={addToCart}
					isCustomer={user?.role === 'customer'}
					currentTime={currentTime}
				/>
			)}

			<FloatingCart />
		</div>
	);
}

// Today Menu Component (Updated with time restrictions)
const TodayMenu = ({ items, openItemModal, addToCart, isCustomer, currentTime }) => {
	const lunchItems = items.filter(item => item.mealType === 'lunch');
	const dinnerItems = items.filter(item => item.mealType === 'dinner');
	
	// Check if ordering is allowed for today's meals
	const canOrderLunch = canOrderMeal('lunch');
	const canOrderDinner = canOrderMeal('dinner');

	if (items.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-stone-200 border-dashed mx-4">
				<div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center text-4xl mb-4 opacity-50">📅</div>
				<h3 className="text-xl font-bold text-stone-400">No menu for today</h3>
				<p className="text-stone-400 text-sm mt-1">Check back later or view weekly/monthly menu</p>
			</div>
		);
	}

	return (
		<div className="space-y-16 animate-in fade-in duration-500">
			{lunchItems.length > 0 && (
				<div>
					<div className="flex items-center gap-4 mb-8">
						<span className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl shadow-sm">☀️</span>
						<h3 className="text-2xl font-bold text-stone-800">Lunch</h3>
						<div className="h-px bg-stone-200 flex-1 ml-4"></div>
						{!canOrderLunch && (
							<div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
								<FaExclamationTriangle />
								<span>Ordering closed until tomorrow</span>
							</div>
						)}
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{lunchItems.map((item) => (
							<MenuItemCard
								key={item._id}
								item={item}
								onClick={() => openItemModal(item)}
								onAdd={() => addToCart(item)}
								isCustomer={isCustomer}
								canOrder={canOrderLunch}
							/>
						))}
					</div>
					{!canOrderLunch && (
						<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
							<p className="text-red-700 text-sm font-medium">
								Lunch ordering is closed after {ORDER_DEADLINES.lunch.label}. 
								You can still order lunch for future dates.
							</p>
						</div>
					)}
				</div>
			)}

			{dinnerItems.length > 0 && (
				<div>
					<div className="flex items-center gap-4 mb-8">
						<span className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl shadow-sm">🌙</span>
						<h3 className="text-2xl font-bold text-stone-800">Dinner</h3>
						<div className="h-px bg-stone-200 flex-1 ml-4"></div>
						{!canOrderDinner && (
							<div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
								<FaExclamationTriangle />
								<span>Ordering closed until tomorrow</span>
							</div>
						)}
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{dinnerItems.map((item) => (
							<MenuItemCard
								key={item._id}
								item={item}
								onClick={() => openItemModal(item)}
								onAdd={() => addToCart(item)}
								isCustomer={isCustomer}
								canOrder={canOrderDinner}
							/>
						))}
					</div>
					{!canOrderDinner && (
						<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
							<p className="text-red-700 text-sm font-medium">
								Dinner ordering is closed after {ORDER_DEADLINES.dinner.label}. 
								You can still order dinner for future dates.
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

// Day Menu Component (for Weekly view) - Updated
const DayMenu = ({ day, items, openItemModal, addToCart, isCustomer, currentTime }) => {
	const hasLunch = items.lunch.length > 0;
	const hasDinner = items.dinner.length > 0;
	
	// Check if the selected day is today
	const today = new Date();
	const todayDayName = DAYS[today.getDay()];
	const isToday = day === todayDayName;
	
	// For today's items, apply time restrictions
	const canOrderLunch = isToday ? canOrderMeal('lunch') : true;
	const canOrderDinner = isToday ? canOrderMeal('dinner') : true;

	if (!hasLunch && !hasDinner) {
		return (
			<div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-stone-200 border-dashed mx-4">
				<div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center text-4xl mb-4 opacity-50">👨‍🍳</div>
				<h3 className="text-xl font-bold text-stone-400">The chef is resting</h3>
				<p className="text-stone-400 text-sm mt-1">No meals scheduled for {day}</p>
			</div>
		);
	}

	return (
		<div className="space-y-16 animate-in fade-in duration-500">
			{hasLunch && (
				<div>
					<div className="flex items-center gap-4 mb-8">
						<span className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl shadow-sm">☀️</span>
						<h3 className="text-2xl font-bold text-stone-800">Lunch</h3>
						<div className="h-px bg-stone-200 flex-1 ml-4"></div>
						{!canOrderLunch && (
							<div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
								<FaExclamationTriangle />
								<span>Ordering closed</span>
							</div>
						)}
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{items.lunch.map((item) => (
							<MenuItemCard
								key={item._id}
								item={item}
								onClick={() => openItemModal(item)}
								onAdd={() => addToCart(item)}
								isCustomer={isCustomer}
								canOrder={canOrderLunch}
							/>
						))}
					</div>
					{isToday && !canOrderLunch && (
						<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
							<p className="text-red-700 text-sm font-medium">
								Today's lunch ordering is closed after {ORDER_DEADLINES.lunch.label}. 
								You can still order lunch for future days.
							</p>
						</div>
					)}
				</div>
			)}

			{hasDinner && (
				<div>
					<div className="flex items-center gap-4 mb-8">
						<span className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl shadow-sm">🌙</span>
						<h3 className="text-2xl font-bold text-stone-800">Dinner</h3>
						<div className="h-px bg-stone-200 flex-1 ml-4"></div>
						{!canOrderDinner && (
							<div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
								<FaExclamationTriangle />
								<span>Ordering closed</span>
							</div>
						)}
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{items.dinner.map((item) => (
							<MenuItemCard
								key={item._id}
								item={item}
								onClick={() => openItemModal(item)}
								onAdd={() => addToCart(item)}
								isCustomer={isCustomer}
								canOrder={canOrderDinner}
							/>
						))}
					</div>
					{isToday && !canOrderDinner && (
						<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
							<p className="text-red-700 text-sm font-medium">
								Today's dinner ordering is closed after {ORDER_DEADLINES.dinner.label}. 
								You can still order dinner for future days.
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

// Monthly Menu Component - Updated
const MonthlyMenu = ({ data, openItemModal, addToCart, isCustomer, currentTime }) => {
	const { next30Days, itemsByDate } = data;

	return (
		<div className="space-y-4">
			{next30Days.map(day => {
				const dayItems = itemsByDate[day.dateString] || [];
				const lunchItems = dayItems.filter(item => item.mealType === 'lunch');
				const dinnerItems = dayItems.filter(item => item.mealType === 'dinner');
				
				// Check if this day is today
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				const dayDate = new Date(day.dateString);
				dayDate.setHours(0, 0, 0, 0);
				const isToday = dayDate.getTime() === today.getTime();
				
				// Apply time restrictions only for today
				const canOrderLunch = isToday ? canOrderMeal('lunch') : true;
				const canOrderDinner = isToday ? canOrderMeal('dinner') : true;

				return (
					<div key={day.dateString} className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm hover:shadow-md transition">
						<div className="flex items-center justify-between mb-4">
							<div>
								<h3 className="font-bold text-stone-900 text-lg">
									{day.displayDate}
									{isToday && <span className="ml-2 text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full">Today</span>}
								</h3>
								<p className="text-sm text-stone-500 capitalize">{day.dayName}</p>
							</div>
							<span className="bg-violet-50 text-violet-700 px-3 py-1 rounded-full text-xs font-bold">
								{dayItems.length} item{dayItems.length !== 1 ? 's' : ''}
							</span>
						</div>

						{dayItems.length === 0 ? (
							<p className="text-sm text-stone-400 italic py-4">No meals scheduled</p>
						) : (
							<div className="space-y-6">
								{lunchItems.length > 0 && (
									<div>
										<div className="flex items-center gap-2 mb-3">
											<span className="text-lg">☀️</span>
											<span className="font-semibold text-stone-700">Lunch</span>
											{isToday && !canOrderLunch && (
												<span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Ordering closed</span>
											)}
										</div>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
											{lunchItems.map(item => (
												<div key={item._id} className="flex gap-3 border border-stone-100 rounded-lg p-3 hover:shadow-sm transition cursor-pointer" onClick={() => openItemModal(item)}>
													<img
														src={item.imageUrl || FALLBACK_IMAGE}
														alt={item.name}
														className="w-16 h-16 object-cover rounded flex-shrink-0"
														onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
													/>
													<div className="flex-1 min-w-0">
														<div className="font-medium text-sm truncate">{item.name}</div>
														<div className="text-xs text-stone-500 line-clamp-1">{item.description}</div>
														<div className="flex items-center justify-between mt-1">
															<span className="text-sm font-bold text-violet-700">{item.price} ৳</span>
															{isCustomer && (
																<button
																	onClick={(e) => {
																		e.stopPropagation();
																		if (canOrderLunch) {
																			addToCart(item);
																		} else {
																			alert(`Lunch ordering is closed for today after ${ORDER_DEADLINES.lunch.label}. You can order for future dates.`);
																		}
																	}}
																	className={`px-2 py-1 rounded text-xs font-semibold transition ${
																		canOrderLunch 
																			? 'bg-violet-100 text-violet-700 hover:bg-violet-200' 
																			: 'bg-gray-100 text-gray-400 cursor-not-allowed'
																	}`}
																	disabled={!canOrderLunch}
																>
																	{canOrderLunch ? 'Add' : 'Closed'}
																</button>
															)}
														</div>
													</div>
												</div>
											))}
										</div>
									</div>
								)}

								{dinnerItems.length > 0 && (
									<div>
										<div className="flex items-center gap-2 mb-3">
											<span className="text-lg">🌙</span>
											<span className="font-semibold text-stone-700">Dinner</span>
											{isToday && !canOrderDinner && (
												<span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Ordering closed</span>
											)}
										</div>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
											{dinnerItems.map(item => (
												<div key={item._id} className="flex gap-3 border border-stone-100 rounded-lg p-3 hover:shadow-sm transition cursor-pointer" onClick={() => openItemModal(item)}>
													<img
														src={item.imageUrl || FALLBACK_IMAGE}
														alt={item.name}
														className="w-16 h-16 object-cover rounded flex-shrink-0"
														onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
													/>
													<div className="flex-1 min-w-0">
														<div className="font-medium text-sm truncate">{item.name}</div>
														<div className="text-xs text-stone-500 line-clamp-1">{item.description}</div>
														<div className="flex items-center justify-between mt-1">
															<span className="text-sm font-bold text-violet-700">{item.price} ৳</span>
															{isCustomer && (
																<button
																	onClick={(e) => {
																		e.stopPropagation();
																		if (canOrderDinner) {
																			addToCart(item);
																		} else {
																			alert(`Dinner ordering is closed for today after ${ORDER_DEADLINES.dinner.label}. You can order for future dates.`);
																		}
																	}}
																	className={`px-2 py-1 rounded text-xs font-semibold transition ${
																		canOrderDinner 
																			? 'bg-violet-100 text-violet-700 hover:bg-violet-200' 
																			: 'bg-gray-100 text-gray-400 cursor-not-allowed'
																	}`}
																	disabled={!canOrderDinner}
																>
																	{canOrderDinner ? 'Add' : 'Closed'}
																</button>
															)}
														</div>
													</div>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
};

// Item Card Component (Updated with time restrictions)
const MenuItemCard = ({ item, isCustomer, onAdd, onClick, canOrder = true }) => {
	const isOrderable = isCustomer && canOrder;

	return (
		<div 
			className={`group bg-white rounded-2xl border border-stone-100 p-6 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden ${
				!canOrder ? 'opacity-80' : ''
			}`}
			onClick={onClick}
		>
			<div className="flex gap-4">
				<div className="w-24 h-24 flex-shrink-0">
					<img
						src={item.imageUrl || FALLBACK_IMAGE}
						alt={item.name}
						className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
						onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
					/>
				</div>
				
				<div className="flex-1 flex flex-col justify-between min-w-0 py-1">
					<div>
						<div className="flex justify-between items-start mb-1">
							<h4 className="font-bold text-stone-800 group-hover:text-violet-700 transition line-clamp-1 text-lg">{item.name}</h4>
							<span className="font-bold text-violet-600 shrink-0 ml-2 bg-violet-50 px-2 py-0.5 rounded-lg">{item.price} ৳</span>
						</div>
						<div className="flex flex-wrap gap-1 mb-2">
							{item.calories && <span className="text-[10px] font-bold text-stone-400 bg-stone-50 px-1.5 py-0.5 rounded uppercase tracking-wide">{item.calories} CAL</span>}
							<span className="text-[10px] font-bold text-stone-400 bg-stone-50 px-1.5 py-0.5 rounded uppercase tracking-wide">{item.mealType}</span>
							{!canOrder && (
								<span className="text-[10px] font-bold text-red-400 bg-red-50 px-1.5 py-0.5 rounded uppercase tracking-wide">Closed</span>
							)}
						</div>
						<p className="text-stone-500 text-sm line-clamp-2 pr-4 leading-relaxed">{item.description}</p>
					</div>
				</div>
				
				{isCustomer && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							if (canOrder) {
								onAdd();
							} else {
								const deadline = ORDER_DEADLINES[item.mealType];
								alert(`Sorry! ${item.mealType} ordering is closed after ${deadline.label}. Please order in advance for tomorrow.`);
							}
						}}
						className={`absolute bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm group-hover:scale-110 ${
							canOrder 
								? 'bg-stone-100 text-stone-600 hover:bg-violet-600 hover:text-white' 
								: 'bg-gray-100 text-gray-400 cursor-not-allowed'
						}`}
						title={canOrder ? "Add to Cart" : "Ordering closed"}
						disabled={!canOrder}
					>
						<span className="font-bold text-xl mb-0.5">+</span>
					</button>
				)}
			</div>
			
			{!canOrder && (
				<div className="mt-3 pt-3 border-t border-stone-100">
					<p className="text-xs text-red-500 flex items-center gap-1">
						<FaExclamationTriangle className="text-xs" />
						Ordering closed for today's {item.mealType}
					</p>
				</div>
			)}
		</div>
	);
};

// Item Modal Component (Updated with time restrictions)
const ItemModal = ({ item, isCustomer, addToCart, closeModal, currentTime }) => {
	if (!item) return null;
	
	// Check if ordering is allowed for this item
	const itemDate = new Date(item.date);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	itemDate.setHours(0, 0, 0, 0);
	const isToday = itemDate.getTime() === today.getTime();
	const canOrder = isToday ? canOrderMeal(item.mealType, item.date) : true;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
			<div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
				<div className="relative">
					<img
						src={item.imageUrl || FALLBACK_IMAGE}
						alt={item.name}
						className="w-full h-64 object-cover"
						onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
					/>
					<button
						onClick={closeModal}
						className="absolute top-4 right-4 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white"
					>
						×
					</button>
				</div>
				
				<div className="p-8">
					<div className="mb-6">
						<div className="flex justify-between items-start mb-2">
							<h3 className="text-2xl font-bold text-stone-900">{item.name}</h3>
							<span className="text-2xl font-bold text-violet-700">{item.price} ৳</span>
						</div>
						<div className="flex gap-2">
							{item.calories && <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded">{item.calories} CAL</span>}
							<span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded capitalize">{item.mealType}</span>
							{item.day && <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded capitalize">{item.day}</span>}
							{isToday && !canOrder && (
								<span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-1 rounded">Ordering Closed</span>
							)}
						</div>
					</div>

					{item.description && (
						<div className="mb-8">
							<h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">About this meal</h4>
							<p className="text-stone-700 leading-relaxed text-lg font-light">{item.description}</p>
						</div>
					)}

					{item.ingredients?.length > 0 && (
						<div className="mb-8">
							<h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Ingredients</h4>
							<div className="flex flex-wrap gap-2">
								{item.ingredients.map((ing, i) => (
									<span
										key={i}
										className="bg-stone-100 text-stone-600 px-3 py-1.5 rounded-lg text-sm font-medium border border-stone-200"
									>
										{ing}
									</span>
								))}
							</div>
						</div>
					)}

					{isToday && !canOrder && (
						<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
							<div className="flex items-center gap-2 text-red-700 font-medium mb-2">
								<FaExclamationTriangle />
								<span>Ordering Closed</span>
							</div>
							<p className="text-red-600 text-sm">
								{item.mealType.charAt(0).toUpperCase() + item.mealType.slice(1)} ordering is closed after {ORDER_DEADLINES[item.mealType].label} for today.
								You can still order this meal for future dates.
							</p>
						</div>
					)}

					{isCustomer ? (
						<button
							onClick={() => {
								if (canOrder) {
									addToCart(item);
									closeModal();
								} else {
									alert(`Sorry! ${item.mealType} ordering is closed for today after ${ORDER_DEADLINES[item.mealType].label}. You can order for future dates.`);
								}
							}}
							className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 ${
								canOrder 
									? 'bg-violet-600 text-white hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-200' 
									: 'bg-gray-300 text-gray-500 cursor-not-allowed'
							}`}
							disabled={!canOrder}
						>
							<span>{canOrder ? 'Add to Cart' : 'Ordering Closed'}</span>
							<span className={`px-2 py-0.5 rounded text-sm ${
								canOrder ? 'bg-violet-700/50' : 'bg-gray-400'
							}`}>{item.price} ৳</span>
						</button>
					) : (
						<div className="w-full bg-stone-100 text-stone-400 py-4 rounded-xl font-bold text-center">
							Login to Order
						</div>
					)}
				</div>
			</div>
		</div>
	);
};









