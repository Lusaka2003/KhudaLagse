import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';

export default function Reviews() {
	const [reviews, setReviews] = useState([]);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedRestaurant, setSelectedRestaurant] = useState('all');
	const [selectedRating, setSelectedRating] = useState('all');
	const [viewingReview, setViewingReview] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);

	const ratings = [
		{ value: 'all', label: 'All Ratings' },
		{ value: '5', label: '⭐⭐⭐⭐⭐' },
		{ value: '4', label: '⭐⭐⭐⭐' },
		{ value: '3', label: '⭐⭐⭐' },
		{ value: '2', label: '⭐⭐' },
		{ value: '1', label: '⭐' }
	];

	useEffect(() => {
		loadReviews();
	}, []);

	const loadReviews = async () => {
		setError('');
		setLoading(true);
		try {
			const res = await axiosInstance.get('/api/admin/reviews?limit=100');
			setReviews(res.data.data.items || []);
		} catch (err) {
			setError(
				err.response?.data?.message ||
					err.message ||
					'Failed to load reviews'
			);
		} finally {
			setLoading(false);
		}
	};

	const openReviewDetails = (review) => {
		setViewingReview(review);
		setIsModalOpen(true);
	};

	const closeModal = () => {
		setIsModalOpen(false);
		setViewingReview(null);
	};

	const formatDate = (dateString) => {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const getRatingColor = (rating) => {
		switch (rating) {
			case 5:
				return 'bg-green-100 text-green-800';
			case 4:
				return 'bg-blue-100 text-blue-800';
			case 3:
				return 'bg-yellow-100 text-yellow-800';
			case 2:
				return 'bg-orange-100 text-orange-800';
			case 1:
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	const getStarRating = (rating) => {
		return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
	};

	// Extract unique restaurants for filter
	const restaurants = [
		{ value: 'all', label: 'All Restaurants' },
		...Array.from(new Set(reviews.map(r => r.restaurant?._id)))
			.filter(Boolean)
			.map(id => {
				const review = reviews.find(r => r.restaurant?._id === id);
				return {
					value: id,
					label: review?.restaurant?.name || `Restaurant ID: ${id.substring(0, 8)}...`
				};
			})
	];

	const filteredReviews = reviews.filter(review => {
		const matchesSearch = searchQuery.trim() === '' || 
			review.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			review.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			review.restaurant?.name?.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesRestaurant = selectedRestaurant === 'all' || review.restaurant?._id === selectedRestaurant;
		const matchesRating = selectedRating === 'all' || review.rating?.toString() === selectedRating;

		return matchesSearch && matchesRestaurant && matchesRating;
	});

	if (loading) {
		return (
			<div className="rounded-xl border border-gray-100 bg-white p-6 text-center">
				<div className="text-gray-600">Loading reviews...</div>
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
							placeholder="Search reviews by comment, user, or restaurant..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
						/>
					</div>
					
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
						<div className="flex items-center gap-3">
							<span className="text-sm font-medium text-gray-600">Restaurant:</span>
							<select
								value={selectedRestaurant}
								onChange={(e) => setSelectedRestaurant(e.target.value)}
								className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
							>
								{restaurants.map(restaurant => (
									<option key={restaurant.value} value={restaurant.value}>
										{restaurant.label}
									</option>
								))}
							</select>
						</div>
						
						<div className="flex items-center gap-3">
							<span className="text-sm font-medium text-gray-600">Rating:</span>
							<select
								value={selectedRating}
								onChange={(e) => setSelectedRating(e.target.value)}
								className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
							>
								{ratings.map(rating => (
									<option key={rating.value} value={rating.value}>
										{rating.label}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>
				
				{(searchQuery || selectedRestaurant !== 'all' || selectedRating !== 'all') && (
					<div className="mt-3 flex items-center justify-between">
						<div className="text-sm text-gray-600">
							Found {filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''}
							{selectedRestaurant !== 'all' && ' for selected restaurant'}
							{selectedRating !== 'all' && ` (${selectedRating} stars)`}
						</div>
						<button
							onClick={() => {
								setSearchQuery('');
								setSelectedRestaurant('all');
								setSelectedRating('all');
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
								<th className="px-4 py-3 font-semibold">User</th>
								<th className="px-4 py-3 font-semibold">Restaurant</th>
								<th className="px-4 py-3 font-semibold">Rating</th>
								<th className="px-4 py-3 font-semibold">Comment</th>
								<th className="px-4 py-3 font-semibold">Date</th>
								<th className="px-4 py-3 font-semibold">Actions</th>
							</tr>
						</thead>
						<tbody>
							{filteredReviews.map((review) => (
								<tr key={review._id} className="border-b border-gray-100 hover:bg-gray-50">
									<td className="px-4 py-3">
										<div>
											<div className="font-medium text-gray-900">{review.user?.name || '—'}</div>
											{review.user?.email && (
												<div className="text-xs text-gray-500">{review.user.email}</div>
											)}
										</div>
									</td>
									<td className="px-4 py-3">
										<div>
											<div className="font-medium text-gray-900">{review.restaurant?.name || '—'}</div>
											{review.restaurant?.email && (
												<div className="text-xs text-gray-500">{review.restaurant.email}</div>
											)}
										</div>
									</td>
									<td className="px-4 py-3">
										<div className="flex flex-col gap-1">
											<span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getRatingColor(review.rating)}`}>
												{review.rating}
											</span>
											<span className="text-xs text-gray-600">
												{getStarRating(review.rating)}
											</span>
										</div>
									</td>
									<td className="px-4 py-3 max-w-xs">
										<div className="text-gray-700 line-clamp-2">
											{review.comment || 'No comment'}
										</div>
									</td>
									<td className="px-4 py-3 text-gray-700">
										{formatDate(review.createdAt)}
									</td>
									<td className="px-4 py-3">
										<button
											onClick={() => openReviewDetails(review)}
											className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
										>
											View Details
										</button>
									</td>
								</tr>
							))}
							{filteredReviews.length === 0 && (
								<tr>
									<td className="px-4 py-8 text-center text-gray-600" colSpan={6}>
										{searchQuery || selectedRestaurant !== 'all' || selectedRating !== 'all'
											? 'No reviews found matching your filters.'
											: 'No reviews found.'}
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Review Details Modal */}
			{isModalOpen && viewingReview && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
					<div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-2xl">
						{/* Modal Header */}
						<div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
							<div>
								<h2 className="text-xl font-semibold text-gray-900">Review Details</h2>
								<p className="text-sm text-gray-600">
									Review ID: {viewingReview._id.substring(0, 8)}...
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
							<div className="space-y-6">
								{/* Review Summary */}
								<div>
									<h3 className="mb-4 text-lg font-semibold text-gray-900">Review Summary</h3>
									<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
										<div>
											<label className="block text-sm font-medium text-gray-600">Review ID</label>
											<div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
												<code className="text-sm text-gray-600 break-all">{viewingReview._id}</code>
											</div>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-600">Rating</label>
											<div className="mt-1">
												<div className="flex items-center gap-4">
													<span className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold ${getRatingColor(viewingReview.rating)}`}>
														{viewingReview.rating}
													</span>
													<span className="text-lg text-yellow-500">
														{getStarRating(viewingReview.rating)}
													</span>
												</div>
											</div>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-600">Created At</label>
											<div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
												{formatDate(viewingReview.createdAt)}
											</div>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-600">Updated At</label>
											<div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
												{formatDate(viewingReview.updatedAt)}
											</div>
										</div>
									</div>
								</div>

								{/* Comment Section */}
								<div>
									<h3 className="mb-4 text-lg font-semibold text-gray-900">Review Comment</h3>
									<div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
										<p className="text-gray-700 leading-relaxed text-lg">
											{viewingReview.comment || 'No comment provided.'}
										</p>
									</div>
								</div>

								{/* User Information */}
								<div>
									<h3 className="mb-4 text-lg font-semibold text-gray-900">User Information</h3>
									<div className="rounded-lg border border-gray-200">
										<div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
											<div>
												<label className="block text-sm font-medium text-gray-600">Name</label>
												<div className="mt-1 font-medium">
													{viewingReview.user?.name || 'N/A'}
												</div>
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-600">Email</label>
												<div className="mt-1">
													{viewingReview.user?.email || 'N/A'}
												</div>
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-600">Phone</label>
												<div className="mt-1">
													{viewingReview.user?.phone || 'N/A'}
												</div>
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-600">User ID</label>
												<div className="mt-1">
													<code className="text-xs text-gray-600 break-all">
														{viewingReview.user?._id || 'N/A'}
													</code>
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* Restaurant Information */}
								<div>
									<h3 className="mb-4 text-lg font-semibold text-gray-900">Restaurant Information</h3>
									<div className="rounded-lg border border-gray-200">
										<div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
											<div>
												<label className="block text-sm font-medium text-gray-600">Name</label>
												<div className="mt-1 font-medium">
													{viewingReview.restaurant?.name || 'N/A'}
												</div>
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-600">Email</label>
												<div className="mt-1">
													{viewingReview.restaurant?.email || 'N/A'}
												</div>
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-600">Phone</label>
												<div className="mt-1">
													{viewingReview.restaurant?.phone || 'N/A'}
												</div>
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-600">Restaurant ID</label>
												<div className="mt-1">
													<code className="text-xs text-gray-600 break-all">
														{viewingReview.restaurant?._id || 'N/A'}
													</code>
												</div>
											</div>
											<div className="md:col-span-2">
												<label className="block text-sm font-medium text-gray-600">Address</label>
												<div className="mt-1 text-gray-700">
													{viewingReview.restaurant?.address || 'N/A'}
												</div>
											</div>
										</div>
									</div>
								</div>

								
							</div>
						</div>

						{/* Modal Footer */}
						<div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4">
							<div className="flex justify-end gap-3">
								<button
									onClick={closeModal}
									className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
								>
									Close
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}