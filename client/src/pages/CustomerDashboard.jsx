import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import MealCalendar from '../components/MealCalendar';
import SubscriptionManager from '../components/SubscriptionManager';

export default function CustomerDashboard() {
	const navigate = useNavigate();
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [favorites, setFavorites] = useState([]);
	const [showFavorites, setShowFavorites] = useState(false);
	const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' or 'subscriptions'
	const [walletBalance, setWalletBalance] = useState(0);
	const [subscriptions, setSubscriptions] = useState([]);

	// ------------------ Load user ------------------
	useEffect(() => {
		const userData = localStorage.getItem('user');
		if (!userData) {
			navigate('/login');
			return;
		}

		try {
			const parsedUser = JSON.parse(userData);
			if (parsedUser.role !== 'customer') {
				navigate('/');
				return;
			}
			setUser(parsedUser);
			setWalletBalance(parsedUser.walletBalance || 0);
		} catch (err) {
			console.error('Error parsing user data:', err);
			navigate('/login');
		} finally {
			setLoading(false);
		}
	}, [navigate]);

	// Fetch wallet balance and subscriptions for payment info
	useEffect(() => {
		if (user) {
			fetchWalletBalance();
			fetchSubscriptions();
		}
	}, [user]);

	const fetchWalletBalance = async () => {
		try {
			const res = await axiosInstance.get('/api/wallet');
			if (res.data.success) {
				setWalletBalance(res.data.walletBalance || 0);
			}
		} catch (err) {
			console.error('Failed to fetch wallet balance', err);
		}
	};

	const fetchSubscriptions = async () => {
		try {
			const res = await axiosInstance.get('/api/subscriptions');
			if (res.data.success) {
				setSubscriptions(res.data.data || []);
			}
		} catch (err) {
			console.error('Failed to fetch subscriptions', err);
		}
	};

	// ------------------ Handle user updates ------------------
	const handleUserUpdate = (updatedUser) => {
		setUser(updatedUser);
	};

	// ------------------ Logout ------------------
	const handleLogout = () => {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		window.dispatchEvent(new Event('userLogout'));
		navigate('/');
	};

	// ------------------ Fetch Favorites ------------------
	const fetchFavorites = async () => {
		try {
			const res = await axiosInstance.get('/api/auth/favorites');
			const favoriteIds = res.data.favorites || [];

			const favoriteRestaurants = await Promise.all(
				favoriteIds.map((id) =>
					axiosInstance
						.get(`/api/restaurants/${id}`)
						.then((res) => res.data)
				)
			);

			setFavorites(favoriteRestaurants);
		} catch (err) {
			console.error('Failed to fetch favorites', err);
		}
	};

	useEffect(() => {
		if (user && showFavorites) fetchFavorites();
	}, [user, showFavorites]);


	if (loading) {
		return (
			<div className="min-h-screen bg-stone-50 flex items-center justify-center pt-24">
				<div className="text-center">
					<div className="animate-spin rounded-full h-16 w-16 border-b-4 border-violet-600 border-t-transparent mx-auto mb-4"></div>
					<p className="text-stone-500 text-lg">Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<div 
			className="min-h-screen bg-cover bg-center bg-fixed pt-12"
			style={{ backgroundImage: `url(/purplebg2.jpg)` }}
		>
			<div className="max-w-7xl mx-auto px-4 py-8">
				{/* Header Section */}
				<div className="mb-8">
					<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
						{/* Welcome Card */}
						<div 
							className="flex-1 relative rounded-2xl p-6 text-white shadow-lg overflow-hidden bg-cover bg-center"
							style={{ backgroundImage: `url(/bg5.avif)` }}
						>
							{/* Overlay for better text readability */}
							<div className="absolute inset-0 bg-gradient-to-r from-violet-900/50 to-violet-800/50"></div>
							<div className="relative z-10 flex justify-between items-start">
								<div>
									<p className="text-violet-100 text-sm font-medium mb-1">Welcome back,</p>
									<h1 className="text-3xl font-bold mb-2">{user?.name}</h1>
									<p className="text-violet-100/80 text-sm">Manage your meals, subscriptions, and account</p>
								</div>
								<button
									onClick={handleLogout}
									className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium transition"
								>
									Sign Out
								</button>
							</div>
						</div>

						<div className="flex gap-4 lg:w-72">
							{/* Balance Card */}
							<div className="flex-1 bg-cover bg-center rounded-2xl p-5 shadow-sm border border-stone-200/60"
							style={{ backgroundImage: `url(/purplebg3.webp)` }}
							>
								<div className="flex items-center gap-3 mb-2">
									<div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
										<span className="text-lg">💳</span>
									</div>
									<span className="text-stone-100 text-sm font-medium">Wallet Balance</span>
								</div>
								<p className="text-3xl font-bold text-stone-100">{walletBalance.toFixed(0)} <span className="text-base font-normal text-stone-100">BDT</span></p>
								<button 
									onClick={() => navigate('/wallet')}
									className="mt-3 text-violet-100 text-sm font-medium hover:text-violet-600 transition"
								>
									Add funds →
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* Quick Actions Grid */}
				<div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
					
					<QuickActionCard
						icon="📦"
						title="My Orders"
						color="bg-violet-100 text-violet-500"
						onClick={() => navigate('/my-orders')}
					/>
					
					<QuickActionCard
						icon="❤️"
						title="Favorites"
						color="bg-rose-50 text-rose-500"
						onClick={() => setShowFavorites(!showFavorites)}
						active={showFavorites}
					/>
					<QuickActionCard
						icon="🎁"
						title="Referrals"
						color="bg-purple-50 text-purple-500"
						onClick={() => navigate('/referrals')}
					/>
				</div>

				{/* Favorites List */}
				{showFavorites && (
					<FavoritesList favorites={favorites} navigate={navigate} />
				)}

				{/* Main Content Tabs */}
				<div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 overflow-hidden mb-8">
					<div className="border-b border-stone-200 bg-stone-50/50">
						<nav className="flex">
							<button
								onClick={() => setActiveTab('calendar')}
								className={`flex-1 px-6 py-4 text-sm font-semibold transition border-b-2 ${
									activeTab === 'calendar'
										? 'border-violet-500 text-violet-600 bg-white'
										: 'border-transparent text-stone-500 hover:text-stone-600 hover:bg-stone-100/50'
								}`}
							>
								<span className="mr-2">📅</span>
								Meal Calendar
							</button>
							<button
								onClick={() => setActiveTab('subscriptions')}
								className={`flex-1 px-6 py-4 text-sm font-semibold transition border-b-2 ${
									activeTab === 'subscriptions'
										? 'border-violet-500 text-violet-600 bg-white'
										: 'border-transparent text-stone-500 hover:text-stone-600 hover:bg-stone-100/50'
								}`}
							>
								<span className="mr-2">📦</span>
								Manage Subscriptions
							</button>
						</nav>
					</div>

					<div className="p-6">
						{activeTab === 'calendar' ? (
							<MealCalendar />
						) : (
							<SubscriptionManager />
						)}
					</div>
				</div>

				

				{/* Account Info */}
				<AccountInfo user={user} onUserUpdate={handleUserUpdate} />
			</div>
		</div>
	);
}

// ------------------ Components ------------------

const QuickActionCard = ({ icon, title, color, onClick, active }) => (
  <button
    onClick={onClick}
    className={`relative flex items-center gap-3 p-4 rounded-xl border overflow-hidden transition hover:shadow-md ${
      active
        ? "border-violet-300 shadow-sm"
        : "border-stone-200/60 hover:border-stone-300"
    }`}
    style={{
      backgroundImage: `url(/bg4.jpg)` ,
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}
  >
    {/* Background overlay */}
    <div
      className={`absolute inset-0 ${
        active ? "bg-white/10" : "bg-white/70"
      }`}
    ></div>

    {/* Content */}
    <div className="relative flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}
      >
        <span className="text-xl">{icon}</span>
      </div>
      <span className="font-medium text-stone-700">{title}</span>
    </div>
  </button>
);


const FavoritesList = ({ favorites, navigate }) => (
	<div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 p-6 mb-8">
		<h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
			<span className="text-rose-500">❤️</span>
			Favorite Restaurants
		</h2>
		{favorites.length === 0 ? (
			<div className="text-center py-8">
				<p className="text-stone-500 mb-3">You haven't added any favorites yet.</p>
				<button 
					onClick={() => navigate('/restaurants')}
					className="text-violet-500 font-medium hover:text-violet-600"
				>
					Discover restaurants →
				</button>
			</div>
		) : (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{favorites.map((r) => (
					<div
						key={r._id}
						onClick={() => navigate(`/restaurants/${r._id}`)}
						className="group p-4 rounded-xl border border-stone-200 hover:border-violet-300 hover:shadow-md cursor-pointer transition"
					>
						<div className="flex items-center gap-4">
							<div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-100 to-violet-100 flex items-center justify-center text-2xl">
								🍽️
							</div>
							<div className="flex-1 min-w-0">
								<h3 className="font-semibold text-stone-800 truncate group-hover:text-violet-600 transition">
									{r.name}
								</h3>
								{r.location && (
									<p className="text-sm text-stone-500 truncate">
										📍 {r.location.area}, {r.location.city}
									</p>
								)}
							</div>
						</div>
					</div>
				))}
			</div>
		)}
	</div>
);

const AccountInfo = ({ user, onUserUpdate }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [editForm, setEditForm] = useState({
		address: {
			house: '',
			road: '',
			area: '',
			city: '',
		},
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	// Update form when user prop changes
	useEffect(() => {
		setEditForm({
			address: user?.address || {
				house: '',
				road: '',
				area: '',
				city: '',
			},
		});
	}, [user]);

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		if (name.startsWith('address.')) {
			const addressField = name.split('.')[1];
			setEditForm((prev) => ({
				...prev,
				address: {
					...prev.address,
					[addressField]: value,
				},
			}));
		}
	};

	const handleSave = async () => {
		setLoading(true);
		setError('');

		try {
			const response = await axiosInstance.put('/api/auth/profile', {
				address: editForm.address,
				// Only send address, not other fields
			});

			if (response.data.success) {
				// Update user data in localStorage
				const updatedUser = {
					...user,
					address: editForm.address,
				};
				localStorage.setItem('user', JSON.stringify(updatedUser));

				// Update parent component state
				if (onUserUpdate) {
					onUserUpdate(updatedUser);
				}

				// Exit edit mode
				setIsEditing(false);
				alert('Address updated successfully!');
			} else {
				setError(response.data.message || 'Failed to update address');
			}
		} catch (err) {
			setError(
				err.response?.data?.message ||
					'An error occurred while updating address'
			);
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		setEditForm({
			address: user?.address || {
				house: '',
				road: '',
				area: '',
				city: '',
			},
		});
		setIsEditing(false);
		setError('');
	};

	const formatAddress = (address) => {
		if (!address) return 'Not set';

		const parts = [
			address.house && `House ${address.house}`,
			address.road && address.road,
			address.area && address.area,
			address.city && address.city,
		].filter(Boolean);

		return parts.length > 0 ? parts.join(', ') : 'Not set';
	};

	if (isEditing) {
		return (
			<div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 p-6">
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-xl font-bold text-stone-800">
						Edit Delivery Address
					</h2>
					<button
						onClick={() => setIsEditing(false)}
						className="text-stone-400 hover:text-stone-500 text-xl transition"
					>
						✕
					</button>
				</div>

				{error && (
					<div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
						{error}
					</div>
				)}

				<p className="text-sm text-stone-500 mb-6">
					Update your delivery address. Other account information cannot be changed here.
				</p>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-stone-500 mb-1.5">
							House/Apartment Number
						</label>
						<input
							type="text"
							name="address.house"
							value={editForm.address.house}
							onChange={handleInputChange}
							className="w-full rounded-lg border border-stone-300 px-4 py-2.5 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
							placeholder="e.g., 123, Apt 4B"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-stone-500 mb-1.5">
							Road/Street
						</label>
						<input
							type="text"
							name="address.road"
							value={editForm.address.road}
							onChange={handleInputChange}
							className="w-full rounded-lg border border-stone-300 px-4 py-2.5 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
							placeholder="e.g., Main Street"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-stone-500 mb-1.5">
							Area/District
						</label>
						<input
							type="text"
							name="address.area"
							value={editForm.address.area}
							onChange={handleInputChange}
							className="w-full rounded-lg border border-stone-300 px-4 py-2.5 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
							placeholder="e.g., Banani"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-stone-500 mb-1.5">
							City
						</label>
						<input
							type="text"
							name="address.city"
							value={editForm.address.city}
							onChange={handleInputChange}
							className="w-full rounded-lg border border-stone-300 px-4 py-2.5 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
							placeholder="e.g., Dhaka"
						/>
					</div>
				</div>

				<div className="flex gap-3 mt-6">
					<button
						onClick={handleSave}
						disabled={loading}
						className="flex-1 bg-violet-500 text-white py-2.5 rounded-lg font-semibold hover:bg-violet-600 disabled:opacity-50 transition"
					>
						{loading ? 'Saving...' : 'Save Address'}
					</button>
					<button
						onClick={handleCancel}
						disabled={loading}
						className="flex-1 border border-stone-300 text-stone-600 py-2.5 rounded-lg font-semibold hover:bg-stone-50 disabled:opacity-50 transition"
					>
						Cancel
					</button>
				</div>
			</div>
		);
	}

	return (
		<div
			className="relative bg-white rounded-2xl shadow-sm border border-stone-200/60 p-6 overflow-hidden"
			style={{
				backgroundImage: "url('/purplebg.jpg')",
				backgroundSize: "cover",
				backgroundPosition: "center",
			}}
		>
			{/* Overlay for readability */}
			<div className="absolute inset-0 bg-white/70 rounded-2xl"></div>

			{/* Content */}
			<div className="relative">
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
						<span className="text-stone-400">👤</span>
						Account Information
					</h2>
					<button
						onClick={() => setIsEditing(true)}
						className="bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-violet-600 transition"
					>
						Edit Address
					</button>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
					<InfoRow label="Name" value={user?.name} />
					<InfoRow label="Email" value={user?.email} />
					<InfoRow label="Phone" value={user?.phone} />
					<InfoRow label="Role" value={user?.role} capitalize />
					<div className="md:col-span-2">
						<InfoRow label="Delivery Address" value={formatAddress(user?.address)} />
					</div>
				</div>
			</div>
		</div>
	);
};

const InfoRow = ({ label, value, capitalize }) => (
	<div className="flex flex-col">
		<span className="text-sm text-stone-500 mb-0.5">{label}</span>
		<span className={`font-medium text-stone-800 ${capitalize ? 'capitalize' : ''}`}>
			{value || <span className="text-stone-400">Not set</span>}
		</span>
	</div>
);
