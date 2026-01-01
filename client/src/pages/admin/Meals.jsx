import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';

export default function Meals() {
	const [meals, setMeals] = useState([]);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedDay, setSelectedDay] = useState('all');
	const [selectedMealType, setSelectedMealType] = useState('all');
	const [viewingMeal, setViewingMeal] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingMeal, setEditingMeal] = useState(null);
	const [editForm, setEditForm] = useState({
		name: '',
		description: '',
		price: '',
		calories: '',
		ingredients: '',
		day: '',
		mealType: '',
		date: '',
		imageUrl: '',
		adminComment: ''
	});

	const days = [
		{ value: 'all', label: 'All Days' },
		{ value: 'sunday', label: 'Sunday' },
		{ value: 'monday', label: 'Monday' },
		{ value: 'tuesday', label: 'Tuesday' },
		{ value: 'wednesday', label: 'Wednesday' },
		{ value: 'thursday', label: 'Thursday' },
		{ value: 'friday', label: 'Friday' },
		{ value: 'saturday', label: 'Saturday' }
	];

	const mealTypes = [
		{ value: 'all', label: 'All Meals' },
		{ value: 'lunch', label: 'Lunch' },
		{ value: 'dinner', label: 'Dinner' }
	];

	useEffect(() => {
		loadMeals();
	}, []);

	const loadMeals = async () => {
		setError('');
		setLoading(true);
		try {
			const res = await axiosInstance.get('/api/admin/meals?limit=100');
			setMeals(res.data.data.items || []);
		} catch (err) {
			setError(
				err.response?.data?.message ||
					err.message ||
					'Failed to load meals'
			);
		} finally {
			setLoading(false);
		}
	};

	const openMealDetails = (meal) => {
		setViewingMeal(meal);
		setIsModalOpen(true);
	};

	const closeModal = () => {
		setIsModalOpen(false);
		setViewingMeal(null);
		setEditingMeal(null);
		setEditForm({
			name: '',
			description: '',
			price: '',
			calories: '',
			ingredients: '',
			day: '',
			mealType: '',
			date: '',
			imageUrl: '',
			adminComment: ''
		});
	};

	const startEditMeal = (meal) => {
		setEditingMeal(meal);
		setEditForm({
			name: meal.name || '',
			description: meal.description || '',
			price: meal.price || '',
			calories: meal.calories || '',
			ingredients: Array.isArray(meal.ingredients) ? meal.ingredients.join(', ') : '',
			day: meal.day || '',
			mealType: meal.mealType || '',
			date: meal.date ? new Date(meal.date).toISOString().split('T')[0] : '',
			imageUrl: meal.imageUrl || '',
			adminComment: meal.adminComment || ''
		});
		setIsModalOpen(true);
	};

	const handleEditFormChange = (e) => {
		const { name, value } = e.target;
		setEditForm(prev => ({
			...prev,
			[name]: value
		}));
	};

	const updateMeal = async (e) => {
		e.preventDefault();
		setError('');
		try {
			const mealId = editingMeal._id;
			const updateData = {
				...editForm,
				price: parseFloat(editForm.price),
				calories: editForm.calories ? parseInt(editForm.calories) : 0,
				ingredients: editForm.ingredients ? editForm.ingredients.split(',').map(i => i.trim()).filter(i => i) : [],
				date: editForm.date ? new Date(editForm.date).toISOString() : editingMeal.date
			};

			await axiosInstance.patch(`/api/admin/meals/${mealId}`, updateData);
			await loadMeals();
			closeModal();
		} catch (err) {
			setError(
				err.response?.data?.message ||
					err.message ||
					'Failed to update meal'
			);
		}
	};

	const deleteMeal = async (mealId) => {
		if (!window.confirm('Are you sure you want to delete this meal?')) return;
		
		setError('');
		try {
			await axiosInstance.delete(`/api/admin/meals/${mealId}`);
			await loadMeals();
		} catch (err) {
			setError(
				err.response?.data?.message ||
					err.message ||
					'Failed to delete meal'
			);
		}
	};

	const formatDate = (dateString) => {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	};

	const filteredMeals = meals.filter(meal => {
		const matchesSearch = searchQuery.trim() === '' || 
			meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			meal.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			meal.restaurant?.name?.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesDay = selectedDay === 'all' || meal.day === selectedDay;
		const matchesMealType = selectedMealType === 'all' || meal.mealType === selectedMealType;

		return matchesSearch && matchesDay && matchesMealType;
	});

	if (loading) {
		return (
			<div className="rounded-xl border border-gray-100 bg-white p-6 text-center">
				<div className="text-gray-600">Loading meals...</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{error && (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
					{error}
				</div>
			)}

			{/* Search and Filter Bar */}
			<div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div className="relative flex-1">
						<div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
							<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</div>
						<input
							type="text"
							placeholder="Search meals by name, description, or restaurant..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
						/>
					</div>
					
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
						<div className="flex items-center gap-3">
							<span className="text-sm font-medium text-gray-600">Day:</span>
							<select
								value={selectedDay}
								onChange={(e) => setSelectedDay(e.target.value)}
								className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
							>
								{days.map(day => (
									<option key={day.value} value={day.value}>
										{day.label}
									</option>
								))}
							</select>
						</div>
						
						<div className="flex items-center gap-3">
							<span className="text-sm font-medium text-gray-600">Meal Type:</span>
							<select
								value={selectedMealType}
								onChange={(e) => setSelectedMealType(e.target.value)}
								className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
							>
								{mealTypes.map(type => (
									<option key={type.value} value={type.value}>
										{type.label}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>
				
				{(searchQuery || selectedDay !== 'all' || selectedMealType !== 'all') && (
					<div className="mt-3 flex items-center justify-between">
						<div className="text-sm text-gray-600">
							Found {filteredMeals.length} meal{filteredMeals.length !== 1 ? 's' : ''}
							{selectedDay !== 'all' && ` (${selectedDay})`}
							{selectedMealType !== 'all' && ` (${selectedMealType})`}
						</div>
						<button
							onClick={() => {
								setSearchQuery('');
								setSelectedDay('all');
								setSelectedMealType('all');
							}}
							className="text-sm text-blue-600 hover:text-blue-800"
						>
							Clear filters
						</button>
					</div>
				)}
			</div>
			
			<div className="rounded-xl border border-gray-100 bg-white shadow-sm">
				<div className="overflow-x-auto">
					<table className="min-w-full text-left text-sm">
						<thead className="border-b border-gray-100 bg-gray-50 text-gray-600">
							<tr>
								<th className="px-4 py-3 font-semibold">Meal</th>
								<th className="px-4 py-3 font-semibold">Restaurant</th>
								<th className="px-4 py-3 font-semibold">Day</th>
								<th className="px-4 py-3 font-semibold">Type</th>
								<th className="px-4 py-3 font-semibold">Date</th>
								<th className="px-4 py-3 font-semibold">Price</th>
								<th className="px-4 py-3 font-semibold">Actions</th>
							</tr>
						</thead>
						<tbody>
							{filteredMeals.map((meal) => (
								<tr key={meal._id} className="border-b border-gray-100 hover:bg-gray-50">
									<td className="px-4 py-3">
										<div className="flex items-center gap-3">
											{meal.imageUrl && (
												<img 
													src={meal.imageUrl} 
													alt={meal.name}
													className="h-10 w-10 rounded-lg object-cover"
												/>
											)}
											<div>
												<div className="font-medium text-gray-900">{meal.name}</div>
												{meal.description && (
													<div className="text-xs text-gray-500 line-clamp-1">
														{meal.description}
													</div>
												)}
											</div>
										</div>
									</td>
									<td className="px-4 py-3 text-gray-700">
										<div className="font-medium">{meal.restaurant?.name || '—'}</div>
										{meal.restaurant?.email && (
											<div className="text-xs text-gray-500">{meal.restaurant.email}</div>
										)}
									</td>
									<td className="px-4 py-3">
										<span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
											{meal.day ? meal.day.charAt(0).toUpperCase() + meal.day.slice(1) : '—'}
										</span>
									</td>
									<td className="px-4 py-3">
										<span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
											meal.mealType === 'lunch' ? 'bg-yellow-100 text-yellow-700' :
											meal.mealType === 'dinner' ? 'bg-indigo-100 text-indigo-700' :
											'bg-gray-100 text-gray-700'
										}`}>
											{meal.mealType ? meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1) : '—'}
										</span>
									</td>
									<td className="px-4 py-3 text-gray-700">
										{formatDate(meal.date)}
									</td>
									<td className="px-4 py-3 font-semibold text-gray-900">
										৳{meal.price?.toFixed(2) || '0.00'}
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center gap-2">
											<button
												onClick={() => openMealDetails(meal)}
												className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
											>
												View
											</button>
											<button
												onClick={() => startEditMeal(meal)}
												className="rounded-lg border border-blue-500 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
											>
												Edit
											</button>
											<button
												onClick={() => deleteMeal(meal._id)}
												className="rounded-lg border border-red-500 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
											>
												Delete
											</button>
										</div>
									</td>
								</tr>
							))}
							{filteredMeals.length === 0 && (
								<tr>
									<td className="px-4 py-8 text-center text-gray-600" colSpan={7}>
										{searchQuery || selectedDay !== 'all' || selectedMealType !== 'all'
											? 'No meals found matching your filters.'
											: 'No meals found.'}
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Meal Details/Edit Modal */}
			{isModalOpen && (viewingMeal || editingMeal) && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
					<div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-2xl">
						{/* Modal Header */}
						<div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
							<div>
								<h2 className="text-xl font-semibold text-gray-900">
									{editingMeal ? 'Edit Meal' : 'Meal Details'}
								</h2>
								<p className="text-sm text-gray-600">
									{editingMeal ? `Editing: ${editingMeal.name}` : `Meal: ${viewingMeal.name}`}
								</p>
							</div>
							<button
								onClick={closeModal}
								className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
							>
								<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>

						{/* Modal Content */}
						<div className="p-6">
							{editingMeal ? (
								// Edit Form
								<form onSubmit={updateMeal} className="space-y-6">
									<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
										<div>
											<label className="block text-sm font-medium text-gray-600 mb-2">
												Name *
											</label>
											<input
												type="text"
												name="name"
												value={editForm.name}
												onChange={handleEditFormChange}
												required
												className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-600 mb-2">
												Price (৳) *
											</label>
											<input
												type="number"
												name="price"
												value={editForm.price}
												onChange={handleEditFormChange}
												step="0.01"
												min="0"
												required
												className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-600 mb-2">
												Day *
											</label>
											<select
												name="day"
												value={editForm.day}
												onChange={handleEditFormChange}
												required
												className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
											>
												<option value="">Select Day</option>
												{days.slice(1).map(day => (
													<option key={day.value} value={day.value}>
														{day.label}
													</option>
												))}
											</select>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-600 mb-2">
												Meal Type *
											</label>
											<select
												name="mealType"
												value={editForm.mealType}
												onChange={handleEditFormChange}
												required
												className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
											>
												<option value="">Select Type</option>
												<option value="lunch">Lunch</option>
												<option value="dinner">Dinner</option>
											</select>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-600 mb-2">
												Date *
											</label>
											<input
												type="date"
												name="date"
												value={editForm.date}
												onChange={handleEditFormChange}
												required
												className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-600 mb-2">
												Calories
											</label>
											<input
												type="number"
												name="calories"
												value={editForm.calories}
												onChange={handleEditFormChange}
												min="0"
												className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
											/>
										</div>
										<div className="md:col-span-2">
											<label className="block text-sm font-medium text-gray-600 mb-2">
												Description
											</label>
											<textarea
												name="description"
												value={editForm.description}
												onChange={handleEditFormChange}
												rows="3"
												className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
											/>
										</div>
										<div className="md:col-span-2">
											<label className="block text-sm font-medium text-gray-600 mb-2">
												Ingredients (comma separated)
											</label>
											<input
												type="text"
												name="ingredients"
												value={editForm.ingredients}
												onChange={handleEditFormChange}
												placeholder="e.g., Rice, Chicken, Spices"
												className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
											/>
										</div>
										<div className="md:col-span-2">
											<label className="block text-sm font-medium text-gray-600 mb-2">
												Image URL
											</label>
											<input
												type="url"
												name="imageUrl"
												value={editForm.imageUrl}
												onChange={handleEditFormChange}
												placeholder="https://example.com/image.jpg"
												className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
											/>
											<p className="mt-1 text-xs text-gray-500">
												Leave empty to use auto-generated image
											</p>
										</div>
										<div className="md:col-span-2">
											<label className="block text-sm font-medium text-gray-600 mb-2">
												Admin Comment
											</label>
											<textarea
												name="adminComment"
												value={editForm.adminComment}
												onChange={handleEditFormChange}
												rows="2"
												placeholder="Add any admin notes or comments here..."
												className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
											/>
										</div>
									</div>

									<div className="flex justify-end gap-3">
										<button
											type="button"
											onClick={closeModal}
											className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
										>
											Cancel
										</button>
										<button
											type="submit"
											className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
										>
											Update Meal
										</button>
									</div>
								</form>
							) : (
								// View Details
								<div className="space-y-6">
									<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
										<div>
											<label className="block text-sm font-medium text-gray-600">Meal ID</label>
											<div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
												<code className="text-sm text-gray-600 break-all">{viewingMeal._id}</code>
											</div>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-600">Name</label>
											<div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 font-medium">
												{viewingMeal.name}
											</div>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-600">Price</label>
											<div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 font-semibold text-lg">
												৳{viewingMeal.price?.toFixed(2) || '0.00'}
											</div>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-600">Calories</label>
											<div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
												{viewingMeal.calories || 'Not specified'}
											</div>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-600">Day</label>
											<div className="mt-1">
												<span className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
													{viewingMeal.day ? viewingMeal.day.charAt(0).toUpperCase() + viewingMeal.day.slice(1) : '—'}
												</span>
											</div>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-600">Meal Type</label>
											<div className="mt-1">
												<span className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${
													viewingMeal.mealType === 'lunch' ? 'bg-yellow-100 text-yellow-700' :
													viewingMeal.mealType === 'dinner' ? 'bg-indigo-100 text-indigo-700' :
													'bg-gray-100 text-gray-700'
												}`}>
													{viewingMeal.mealType ? viewingMeal.mealType.charAt(0).toUpperCase() + viewingMeal.mealType.slice(1) : '—'}
												</span>
											</div>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-600">Date</label>
											<div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
												{formatDate(viewingMeal.date)}
											</div>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-600">Created At</label>
											<div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
												{formatDate(viewingMeal.createdAt)}
											</div>
										</div>
										{viewingMeal.imageUrl && (
											<div className="md:col-span-2">
												<label className="block text-sm font-medium text-gray-600 mb-2">Image</label>
												<div className="rounded-lg border border-gray-200 p-4">
													<img 
														src={viewingMeal.imageUrl} 
														alt={viewingMeal.name}
														className="h-40 w-full rounded-lg object-cover"
													/>
												</div>
											</div>
										)}
										<div className="md:col-span-2">
											<label className="block text-sm font-medium text-gray-600">Description</label>
											<div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
												{viewingMeal.description || 'No description'}
											</div>
										</div>
										{viewingMeal.ingredients && viewingMeal.ingredients.length > 0 && (
											<div className="md:col-span-2">
												<label className="block text-sm font-medium text-gray-600">Ingredients</label>
												<div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
													<div className="flex flex-wrap gap-2">
														{viewingMeal.ingredients.map((ingredient, idx) => (
															<span key={idx} className="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-700">
																{ingredient}
															</span>
														))}
													</div>
												</div>
											</div>
										)}
										{viewingMeal.restaurant && (
											<div className="md:col-span-2">
												<label className="block text-sm font-medium text-gray-600">Restaurant Information</label>
												<div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 p-4">
													<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
														<div>
															<label className="block text-xs font-medium text-gray-500">Name</label>
															<div className="mt-1 font-medium">{viewingMeal.restaurant.name || 'N/A'}</div>
														</div>
														<div>
															<label className="block text-xs font-medium text-gray-500">Email</label>
															<div className="mt-1">{viewingMeal.restaurant.email || 'N/A'}</div>
														</div>
														<div>
															<label className="block text-xs font-medium text-gray-500">Phone</label>
															<div className="mt-1">{viewingMeal.restaurant.phone || 'N/A'}</div>
														</div>
														<div>
															<label className="block text-xs font-medium text-gray-500">Restaurant ID</label>
															<div className="mt-1">
																<code className="text-xs text-gray-600 break-all">{viewingMeal.restaurant._id}</code>
															</div>
														</div>
													</div>
												</div>
											</div>
										)}
										{viewingMeal.adminComment && (
											<div className="md:col-span-2">
												<label className="block text-sm font-medium text-gray-600">Admin Comment</label>
												<div className="mt-1 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
													{viewingMeal.adminComment}
													{viewingMeal.adminCommentedAt && (
														<div className="mt-2 text-xs text-gray-500">
															Commented on: {formatDate(viewingMeal.adminCommentedAt)}
														</div>
													)}
												</div>
											</div>
										)}
									</div>

									<div className="flex justify-end gap-3">
										<button
											onClick={() => startEditMeal(viewingMeal)}
											className="rounded-lg border border-blue-500 px-4 py-2 text-blue-600 transition-colors hover:bg-blue-50"
										>
											Edit Meal
										</button>
										<button
											onClick={closeModal}
											className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
										>
											Close
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}