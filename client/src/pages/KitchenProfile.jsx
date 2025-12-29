import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import {
	FaMapMarkerAlt,
	FaStar,
	FaTruck,
	FaChevronDown,
} from 'react-icons/fa';
import FloatingCart from '../components/FloatingCart';
import SubscriptionManager from '../components/SubscriptionManager';

const FALLBACK_IMAGE =
	'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800';
const DAYS = [
	'sunday',
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
];

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
	
	// Reviews state
	const [reviews, setReviews] = useState([]);
	const [showAllReviews, setShowAllReviews] = useState(false);
	const [showReviewForm, setShowReviewForm] = useState(false);
	const [reviewRating, setReviewRating] = useState(5);
	const [reviewComment, setReviewComment] = useState('');
	const [reviewLoading, setReviewLoading] = useState(false);

	// Subscription state
	const [showSubscription, setShowSubscription] = useState(false);

	// Menu state
	const [activeDay, setActiveDay] = useState(DAYS[new Date().getDay()]);

	const [cart, setCart] = useState(() => {
		const saved = localStorage.getItem('cart');
		return saved ? JSON.parse(saved) : [];
	});

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
	// Get the current date
	const today = new Date();
	const currentDayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
	
	// Get the target day index from the item
	const targetDayIndex = DAYS.indexOf(item.day.toLowerCase());
	
	// Calculate days until the target day
	let daysUntilTarget = targetDayIndex - currentDayIndex;
	
	// If the target day has already passed this week, schedule for next week
	if (daysUntilTarget < 0) {
		daysUntilTarget += 7;
	}
	
	// If it's the same day but the meal time has passed, schedule for next week
	if (daysUntilTarget === 0) {
		const now = new Date();
		const mealHour = item.mealType === 'lunch' ? 13 : 20;
		
		if (now.getHours() >= mealHour) {
			daysUntilTarget = 7;
		}
	}
	
	// Create delivery date
	const deliveryDate = new Date(today);
	deliveryDate.setDate(today.getDate() + daysUntilTarget);
	
	// Set meal time
	if (item.mealType === 'lunch') {
		deliveryDate.setHours(13, 0, 0, 0);
	} else if (item.mealType === 'dinner') {
		deliveryDate.setHours(20, 0, 0, 0);
	}

	const itemWithDelivery = {
		...item,
		quantity: 1,
		date: deliveryDate.toISOString(),
		deliveryDate: deliveryDate.toISOString(),
		restaurant: id,
		restaurantId: id,
	};

	const exists = cart.some(
		(ci) =>
			ci._id === item._id &&
			ci.date === itemWithDelivery.date &&
			ci.mealType === item.mealType &&
			ci.day === item.day
	);
	
	if (exists) {
		return alert(`${item.name} is already in your cart for this time.`);
	}

	setCart((prev) => [...prev, itemWithDelivery]);
	alert(`${item.name} added to cart for ${deliveryDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}!`);
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
			// Update local state: remove any existing review from this user and add the new one
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

	const groupedMenuItems = DAYS.reduce((acc, day) => {
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
					
					{/* Rating Summary Card */}
					<div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-white min-w-[220px] shadow-2xl">
						<div className="text-4xl font-bold mb-1">{reviews.length}</div>
						<div className="text-sm font-medium text-violet-300 uppercase tracking-wider">Happy Customers</div>
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

						{/* Review Form */}
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

						{/* Recent Reviews List - Grid */}
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

					{/* Subscription (Collapsible) - Full Width Below Reviews */}
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
						<h2 className="text-3xl font-bold text-stone-800 mx-6 tracking-tight">Weekly Menu</h2>
						<div className="h-px bg-stone-200 w-24"></div>
					</div>

					{/* Day Tabs */}
					<div className="flex justify-center mb-10">
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

					{/* Menu Content for Active Day */}
					<div className="min-h-[400px]">
						<DayMenu 
							day={activeDay}
							items={groupedMenuItems[activeDay]}
							openItemModal={(item) => {
								setSelectedItem(item);
								setShowItemModal(true);
							}}
							addToCart={addToCart}
							isCustomer={user?.role === 'customer'}
						/>
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
				/>
			)}

			<FloatingCart />
		</div>
	);
}

// Day Menu Component
const DayMenu = ({ day, items, openItemModal, addToCart, isCustomer }) => {
	const hasLunch = items.lunch.length > 0;
	const hasDinner = items.dinner.length > 0;

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
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{items.lunch.map((item) => (
							<MenuItemCard
								key={item._id}
								item={item}
								onClick={() => openItemModal(item)}
								onAdd={() => addToCart(item)}
								isCustomer={isCustomer}
							/>
						))}
					</div>
				</div>
			)}

			{hasDinner && (
				<div>
					<div className="flex items-center gap-4 mb-8">
						<span className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl shadow-sm">🌙</span>
						<h3 className="text-2xl font-bold text-stone-800">Dinner</h3>
						<div className="h-px bg-stone-200 flex-1 ml-4"></div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{items.dinner.map((item) => (
							<MenuItemCard
								key={item._id}
								item={item}
								onClick={() => openItemModal(item)}
								onAdd={() => addToCart(item)}
								isCustomer={isCustomer}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

// Redesigned Menu Item Card
const MenuItemCard = ({ item, onClick, onAdd, isCustomer }) => (
	<div 
		onClick={onClick}
		className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm hover:shadow-xl hover:border-violet-200 transition-all duration-300 cursor-pointer group flex gap-5 h-36 relative overflow-hidden"
	>
		<div className="w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-stone-100 relative shadow-inner">
			<img
				src={item.imageUrl || FALLBACK_IMAGE}
				alt={item.name}
				className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
				</div>
				<p className="text-stone-500 text-sm line-clamp-2 pr-4 leading-relaxed">{item.description}</p>
			</div>
		</div>
		
		{/* Add Button - Hover Effect */}
		{isCustomer && (
			<button
				onClick={(e) => {
					e.stopPropagation();
					onAdd();
				}}
				className="absolute bottom-4 right-4 bg-stone-100 text-stone-600 w-10 h-10 rounded-full flex items-center justify-center hover:bg-violet-600 hover:text-white transition-all shadow-sm group-hover:scale-110"
				title="Add to Cart"
			>
				<span className="font-bold text-xl mb-0.5">+</span>
			</button>
		)}
	</div>
);

// Item Modal
const ItemModal = ({ item, closeModal, addToCart, isCustomer }) => (
	<div
		className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
		onClick={closeModal}
	>
		<div
			className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
			onClick={(e) => e.stopPropagation()}
		>
			<div className="relative h-72">
				<img
					src={item.imageUrl || FALLBACK_IMAGE}
					alt={item.name}
					className="w-full h-full object-cover"
					onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-8">
					<div className="w-full">
						<div className="flex justify-between items-end mb-2">
							<h3 className="text-3xl font-bold text-white shadow-sm leading-tight">{item.name}</h3>
							<span className="text-2xl font-bold text-violet-400 shadow-sm bg-black/30 px-3 py-1 rounded-lg backdrop-blur-md">{item.price} ৳</span>
						</div>
						<div className="flex items-center gap-3 text-white/90 text-sm font-medium">
							<span className="capitalize bg-white/20 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">{item.mealType}</span>
							{item.calories && (
								<span className="flex items-center gap-1"><span className="text-orange-400">🔥</span> {item.calories} cal</span>
							)}
						</div>
					</div>
				</div>
				<button
					onClick={closeModal}
					className="absolute top-4 right-4 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors border border-white/10"
				>
					✕
				</button>
			</div>

			<div className="p-8">
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

				{isCustomer ? (
					<button
						onClick={() => {
							addToCart(item);
							closeModal();
						}}
						className="w-full bg-violet-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-200 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
					>
						<span>Add to Cart</span>
						<span className="bg-violet-700/50 px-2 py-0.5 rounded text-sm">{item.price} ৳</span>
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
