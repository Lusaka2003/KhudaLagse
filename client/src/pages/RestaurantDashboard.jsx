import { useEffect, useState } from 'react';
import { useNavigate, Route } from 'react-router-dom';
import axiosInstance from '../api/axios';
import ManageMenu from '../pages/ManageMenu';

export default function RestaurantDashboard() {
	const navigate = useNavigate();
	const [user, setUser] = useState(null);
	const [restaurant, setRestaurant] = useState(null);
	const [loading, setLoading] = useState(true);
	const [adminMealComments, setAdminMealComments] = useState([]);
	const [showSettingsModal, setShowSettingsModal] = useState(false);
	const [settingsForm, setSettingsForm] = useState({
		name: '',
		phone: '',
		locationHouse: '',
		locationRoad: '',
		locationArea: '',
		locationCity: '',
		cuisineTypes: '',
	});
	const [savingSettings, setSavingSettings] = useState(false);
	const [settingsError, setSettingsError] = useState('');
	const [settingsSuccess, setSettingsSuccess] = useState('');
	const [togglingStatus, setTogglingStatus] = useState(false);

	useEffect(() => {
		const userData = localStorage.getItem('user');
		if (!userData) {
			navigate('/login');
			return;
		}

		const fetchRestaurantData = async () => {
			try {
				const parsedUser = JSON.parse(userData);
				if (parsedUser.role !== 'restaurant') {
					navigate('/');
					return;
				}
				setUser(parsedUser);

				try {
					const menuRes = await axiosInstance.get('/api/menu');
					const items = menuRes.data.data || [];
					setAdminMealComments(
						items
							.filter((m) => String(m.adminComment || '').trim().length > 0)
							.sort((a, b) => {
								const aTime = a.adminCommentedAt ? new Date(a.adminCommentedAt).getTime() : 0;
								const bTime = b.adminCommentedAt ? new Date(b.adminCommentedAt).getTime() : 0;
								return bTime - aTime;
							})
					);
				} catch {
					setAdminMealComments([]);
				}

				// Fetch full restaurant data
				const response = await axiosInstance.get('/api/restaurants');
				const foundRestaurant = response.data.find(
					(r) =>
						r._id === parsedUser.id || r.email === parsedUser.email
				);
				if (foundRestaurant) {
					setRestaurant(foundRestaurant);
					initializeSettingsForm(foundRestaurant);
				} else {
					const fallbackRestaurant = {
						_id: parsedUser.id, // <-- add this
						name: parsedUser.name, // make sure the field is 'name', not 'restaurantName'
						email: parsedUser.email,
						phone: parsedUser.phone,
						location: {},
						cuisineTypes: [],
						menu: [],
						isOpen: false,
					};

					setRestaurant(fallbackRestaurant);
					initializeSettingsForm(fallbackRestaurant);
				}
			} catch (err) {
				console.error('Error fetching restaurant data:', err);
				const parsedUser = JSON.parse(userData);
				setUser(parsedUser);
				const fallbackRestaurant = {
					restaurantName: parsedUser.name,
					email: parsedUser.email,
					phone: parsedUser.phone,
				};
				setRestaurant(fallbackRestaurant);
				initializeSettingsForm(fallbackRestaurant);
			} finally {
				setLoading(false);
			}
		};

		fetchRestaurantData();
	}, [navigate]);

	const initializeSettingsForm = (restaurantData) => {
		setSettingsForm({
			name: restaurantData?.name || '',
			phone: restaurantData?.phone || '',
			locationHouse: restaurantData?.location?.house || '',
			locationRoad: restaurantData?.location?.road || '',
			locationArea: restaurantData?.location?.area || '',
			locationCity: restaurantData?.location?.city || '',
			cuisineTypes: Array.isArray(restaurantData?.cuisineTypes)
				? restaurantData.cuisineTypes.join(', ')
				: '',
		});
	};

	const handleLogout = () => {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		window.dispatchEvent(new Event('userLogout'));
		navigate('/');
	};

	const handleSettingsChange = (e) => {
		const { name, value } = e.target;
		setSettingsForm({
			...settingsForm,
			[name]: value,
		});
	};

	const handleSaveSettings = async () => {
		setSettingsError('');
		setSettingsSuccess('');
		setSavingSettings(true);

		try {
			const cuisineTypesArray = settingsForm.cuisineTypes
				.split(',')
				.map((c) => c.trim())
				.filter((c) => c);

			const payload = {
				_id: restaurant._id,
				name: settingsForm.name,
				phone: settingsForm.phone,
				location: {
					house: settingsForm.locationHouse,
					road: settingsForm.locationRoad,
					area: settingsForm.locationArea,
					city: settingsForm.locationCity,
				},
				cuisineTypes: cuisineTypesArray,
			};

			const response = await axiosInstance.put(
				`/api/auth/update-restaurant`,
				payload
			);

			if (response.data.success || response.status === 200) {
				const updatedUser = {
					...user,
					name: settingsForm.name,
					phone: settingsForm.phone,
				};
				localStorage.setItem('user', JSON.stringify(updatedUser));
				setUser(updatedUser);

				setRestaurant({
					...restaurant,
					name: settingsForm.name,
					phone: settingsForm.phone,
					location: {
						house: settingsForm.locationHouse,
						road: settingsForm.locationRoad,
						area: settingsForm.locationArea,
						city: settingsForm.locationCity,
					},
					cuisineTypes: cuisineTypesArray,
				});

				setSettingsSuccess('Settings updated successfully!');
				setTimeout(() => {
					setShowSettingsModal(false);
					setSettingsSuccess('');
				}, 1500);
			}
		} catch (err) {
			setSettingsError(
				err.response?.data?.message ||
					err.message ||
					'Failed to update settings'
			);
		} finally {
			setSavingSettings(false);
		}
	};

	const handleToggleStatus = async () => {
		setTogglingStatus(true);
		try {
			const newStatus = !restaurant?.isOpen;
			const response = await axiosInstance.put(
				`/api/auth/update-restaurant-status`,
				{ isOpen: newStatus }
			);

			if (response.data.success) {
				setRestaurant({
					...restaurant,
					isOpen: newStatus,
				});
			}
		} catch (err) {
			console.error('Error toggling status:', err);
			setSettingsError(
				err.response?.data?.message ||
					'Failed to update restaurant status'
			);
		} finally {
			setTogglingStatus(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24">
				<div className="text-center">
					<div className="animate-spin rounded-full h-16 w-16 border-b-4 border-violet-600 border-t-transparent mx-auto mb-4"></div>
					<p className="text-gray-600 text-lg">Loading...</p>
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
				{/* Header */}
				<div
					className="relative rounded-lg shadow-md p-6 mb-8 border border-gray-200 bg-cover bg-center overflow-hidden"
					style={{ backgroundImage: "url('/bg5.avif')" }}
					>
					{/* Overlay */}
					<div className="absolute inset-0 bg-white/5" />

					{/* Content */}
					<div className="relative flex flex-wrap justify-between items-center gap-4">
						<div>
						<h1 className="text-3xl font-bold text-white mb-1 tracking-tight">
							{restaurant?.name || user?.name}
						</h1>
						<p className="text-gray-200">
							Restaurant Dashboard
						</p>
						</div>

						<button
							onClick={handleLogout}
							className="bg-white/50 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium transition"
							>
							Sign Out
						</button>
					</div>
					</div>


				{/* Quick Stats */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
					<div className="bg-gray-100 rounded-lg shadow-sm p-6 border border-gray-200">
						<div className="text-3xl mb-2 text-violet-600">⭐</div>
						<div className="text-2xl font-bold text-gray-900 tracking-tight">
							{restaurant?.rating?.toFixed(1) || '0.0'}
						</div>
						<div className="text-sm text-gray-600">Rating</div>
					</div>

					<div
					onClick={() => navigate(`/restaurants/${restaurant._id}/reviews`)}
					className="bg-gray-100 rounded-lg shadow-sm p-6 border border-gray-200 cursor-pointer hover:shadow-md transition"
					>
					<div className="text-3xl mb-2 text-violet-600">📊</div>
					<div className="text-2xl font-bold text-gray-900 tracking-tight">
						{restaurant?.totalRatings || 0}
					</div>
					<div className="text-sm text-gray-600">
						Total Reviews
					</div>
					</div>

					<div className="bg-gray-100 rounded-lg shadow-sm p-6 border border-gray-200">
						<div className="flex items-center justify-between">
							<div>
								<div className="text-3xl mb-2 text-violet-600">
									{restaurant?.isOpen ? '🟢' : '🔴'}
								</div>
								<div className="text-2xl font-bold text-gray-900 tracking-tight">
									{restaurant?.isOpen ? 'Open' : 'Closed'}
								</div>
								<div className="text-sm text-gray-600">
									Status
								</div>
							</div>
							<button
								onClick={handleToggleStatus}
								disabled={togglingStatus}
								className={`px-4 py-2 rounded font-semibold text-white transition-all whitespace-nowrap ml-2 shadow-md ${
									restaurant?.isOpen
										? 'bg-violet-600 hover:bg-violet-700'
										: 'bg-violet-600 hover:bg-violet-700'
								} disabled:opacity-50 disabled:cursor-not-allowed`}
							>
								{togglingStatus
									? 'Updating...'
									: restaurant?.isOpen
									? 'Close'
									: 'Open'}
							</button>
						</div>
					</div>

					<div className="bg-gray-100 rounded-lg shadow-sm p-6 border border-gray-200">
						<div className="text-3xl mb-2 text-violet-600">🍴</div>
						<div className="text-2xl font-bold text-gray-900 tracking-tight">
							{restaurant?.menu?.length || 0}
						</div>
						<div className="text-sm text-gray-600">Menu Items</div>
					</div>
				</div>

				{/* Quick Actions */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
					<button
						onClick={() => navigate('/restaurant/manage-menu')}
						className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-lg transition cursor-pointer text-left"
					>
						<div className="text-4xl mb-3 text-violet-600">📝</div>
						<h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">
							Manage Menu
						</h3>
						<p className="text-gray-600">Add or edit menu items</p>
					</button>

					<button
						onClick={() => navigate('/orders')}
						className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-lg transition cursor-pointer text-left"
					>
						<div className="text-4xl mb-3 text-violet-600">📦</div>
						<h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">
							Orders
						</h3>
						<p className="text-gray-600">View and manage orders</p>
					</button>

					<button
						onClick={() => setShowSettingsModal(true)}
						className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-lg transition cursor-pointer text-left"
					>
						<div className="text-4xl mb-3 text-violet-600">⚙️</div>
						<h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">
							Settings
						</h3>
						<p className="text-gray-600">Update restaurant info</p>
					</button>
				</div>

				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-10">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<h2 className="text-2xl font-bold text-gray-900 tracking-tight">
							Admin Comments
						</h2>
						<button
							onClick={() => navigate('/restaurant/manage-menu')}
							className="px-4 py-2 bg-violet-600 text-white rounded transition duration-200 hover:bg-violet-700 shadow-md"
						>
							Open Menu
						</button>
					</div>

					{adminMealComments.length === 0 ? (
						<div className="mt-4 text-gray-600">No admin comments.</div>
					) : (
						<div className="mt-4 space-y-3">
							{adminMealComments.map((m) => (
								<div key={m._id} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
									<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
										<div className="font-semibold text-amber-900">
											{m.name || 'Meal'}{m.day ? ` • ${m.day}` : ''}{m.mealType ? ` • ${m.mealType}` : ''}
										</div>
										<div className="text-xs text-amber-800">
											{m.adminCommentedAt ? new Date(m.adminCommentedAt).toLocaleString() : ''}
										</div>
									</div>
									<div className="mt-2 whitespace-pre-wrap text-sm text-amber-900">
										{m.adminComment}
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Restaurant Info */}
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
					<h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">
						Restaurant Information
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<span className="text-gray-600">
								Restaurant Name:
							</span>
							<span className="ml-2 font-semibold">
								{restaurant?.name || 'Not set'}
							</span>
						</div>
						<div>
							<span className="text-gray-600">Email:</span>
							<span className="ml-2 font-semibold">
								{user?.email}
							</span>
						</div>
						<div>
							<span className="text-gray-600">Phone:</span>
							<span className="ml-2 font-semibold">
								{user?.phone}
							</span>
						</div>
						<div>
							<span className="text-gray-600">
								Cuisine Types:
							</span>
							<span className="ml-2 font-semibold">
								{restaurant?.cuisineTypes?.join(', ') ||
									'Not set'}
							</span>
						</div>
						<div className="md:col-span-2">
							<span className="text-gray-600">Address:</span>
							<div className="ml-2 font-semibold text-gray-800">
								{restaurant?.location?.house && (
									<div>
										House: {restaurant.location.house}
										{restaurant?.location?.road && (
											<span>
												, {restaurant.location.road}
											</span>
										)}
									</div>
								)}
								{restaurant?.location?.area && (
									<div>Area: {restaurant.location.area}</div>
								)}
								{restaurant?.location?.city && (
									<div>City: {restaurant.location.city}</div>
								)}
								{!restaurant?.location?.city &&
									!restaurant?.location?.area && (
										<div>Not set</div>
									)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Settings Modal */}
			{showSettingsModal && (
				<div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 pt-24">
					<div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200">
						<h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">
							Restaurant Settings
						</h2>

						{settingsError && (
							<div className="mb-4 p-3 bg-gray-100 border border-gray-200 text-gray-900 rounded text-sm">
								{settingsError}
							</div>
						)}

						{settingsSuccess && (
							<div className="mb-4 p-3 bg-violet-50 border border-violet-200 text-violet-700 rounded text-sm">
								{settingsSuccess}
							</div>
						)}

						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Restaurant Name
								</label>
								<input
									type="text"
									name="name"
									value={settingsForm.name}
									onChange={handleSettingsChange}
									className="w-full px-4 py-2 rounded border-2 border-gray-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
									placeholder="Restaurant Name"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Phone
								</label>
								<input
									type="tel"
									name="phone"
									value={settingsForm.phone}
									onChange={handleSettingsChange}
									className="w-full px-4 py-2 rounded border-2 border-gray-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
									placeholder="Phone Number"
								/>
							</div>

							<div className="border-t-2 border-gray-200 pt-4 mt-4">
								<h3 className="text-sm font-semibold text-gray-900 mb-3">
									📍 Location Details
								</h3>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										House Number{' '}
										<span className="text-violet-600">
											*
										</span>
									</label>
									<input
										type="text"
										name="locationHouse"
										value={settingsForm.locationHouse}
										onChange={handleSettingsChange}
										className="w-full px-4 py-2 rounded border-2 border-gray-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
										placeholder="House #123"
										required
									/>
								</div>

								<div className="mt-3">
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Road / Street{' '}
										<span className="text-gray-400">
											(Optional)
										</span>
									</label>
									<input
										type="text"
										name="locationRoad"
										value={settingsForm.locationRoad}
										onChange={handleSettingsChange}
										className="w-full px-4 py-2 rounded border-2 border-gray-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
										placeholder="Main Street"
									/>
								</div>

								<div className="mt-3">
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Area / District{' '}
										<span className="text-violet-600">
											*
										</span>
									</label>
									<input
										type="text"
										name="locationArea"
										value={settingsForm.locationArea}
										onChange={handleSettingsChange}
										className="w-full px-4 py-2 rounded border-2 border-gray-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
										placeholder="Downtown"
										required
									/>
								</div>

								<div className="mt-3">
									<label className="block text-sm font-medium text-gray-700 mb-1">
										City{' '}
										<span className="text-violet-600">
											*
										</span>
									</label>
									<input
										type="text"
										name="locationCity"
										value={settingsForm.locationCity}
										onChange={handleSettingsChange}
										className="w-full px-4 py-2 rounded border-2 border-gray-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
										placeholder="City"
										required
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Cuisine Types (comma separated)
								</label>
								<input
									type="text"
									name="cuisineTypes"
									value={settingsForm.cuisineTypes}
									onChange={handleSettingsChange}
									className="w-full px-4 py-2 rounded border-2 border-gray-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
									placeholder="e.g., Italian, Pizza, Pasta"
								/>
							</div>
						</div>

						<div className="flex gap-3 mt-6">
							<button
								onClick={() => setShowSettingsModal(false)}
								className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition font-semibold"
								disabled={savingSettings}
							>
								Cancel
							</button>
							<button
								onClick={handleSaveSettings}
								disabled={savingSettings}
								className="flex-1 px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 transition font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{savingSettings ? 'Saving...' : 'Save Changes'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
