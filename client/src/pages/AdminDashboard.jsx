import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';

const tabs = [
	'Overview',
	'Users',
	'Orders',
	'Deliveries',
	'Subscriptions',
	'Meals',
	'Reports',
	'Referrals',
	'Rewards',
	'Reviews',
];

export default function AdminDashboard() {
	const navigate = useNavigate();
	const [user, setUser] = useState(null);
	const [activeTab, setActiveTab] = useState('Overview');

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	const [overview, setOverview] = useState(null);
	const [users, setUsers] = useState([]);
	const [orders, setOrders] = useState([]);
	const [deliveries, setDeliveries] = useState([]);
	const [subscriptions, setSubscriptions] = useState([]);
	const [meals, setMeals] = useState([]);
	const [mealComments, setMealComments] = useState({});
	const [reports, setReports] = useState({
		topMeals: [],
		ordersPerDay: [],
		revenue: [],
	});
	const [referrals, setReferrals] = useState([]);
	const [rewards, setRewards] = useState([]);
	const [reviews, setReviews] = useState([]);

	const [busyId, setBusyId] = useState(null);

	useEffect(() => {
		const userData = localStorage.getItem('user');
		if (!userData) {
			navigate('/login');
			return;
		}

		try {
			const parsed = JSON.parse(userData);
			if (parsed.role !== 'admin' || parsed.isSuperAdmin !== true) {
				navigate('/');
				return;
			}
			setUser(parsed);
		} catch {
			navigate('/login');
			return;
		} finally {
			setLoading(false);
		}
	}, [navigate]);

	const handleLogout = () => {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		window.dispatchEvent(new Event('userLogout'));
		navigate('/');
	};

	const loadOverview = async () => {
		const res = await axiosInstance.get('/api/admin/dashboard');
		setOverview(res.data.data);
	};

	const loadUsers = async () => {
		const res = await axiosInstance.get('/api/admin/users?limit=50');
		setUsers(res.data.data.items || []);
	};

	const loadOrders = async () => {
		const res = await axiosInstance.get('/api/admin/orders?limit=50');
		setOrders(res.data.data.items || []);
	};

	const loadDeliveries = async () => {
		const res = await axiosInstance.get('/api/admin/deliveries?limit=50');
		setDeliveries(res.data.data.items || []);
	};

	const loadSubscriptions = async () => {
		const res = await axiosInstance.get(
			'/api/admin/subscriptions?limit=50'
		);
		setSubscriptions(res.data.data.items || []);
	};

	const loadMeals = async () => {
		const res = await axiosInstance.get('/api/admin/meals?limit=50');
		const items = res.data.data.items || [];
		setMeals(items);
	};

	const loadReports = async () => {
		const [topMealsRes, ordersPerDayRes, revenueRes] = await Promise.all([
			axiosInstance.get('/api/admin/reports/top-meals?limit=10'),
			axiosInstance.get('/api/admin/reports/orders-per-day?days=30'),
			axiosInstance.get('/api/admin/reports/revenue?days=30'),
		]);
		setReports({
			topMeals: topMealsRes.data.data || [],
			ordersPerDay: ordersPerDayRes.data.data || [],
			revenue: revenueRes.data.data || [],
		});
	};

	const loadReferrals = async () => {
		const res = await axiosInstance.get('/api/admin/referrals?limit=50');
		setReferrals(res.data.data.items || []);
	};

	const loadRewards = async () => {
		const res = await axiosInstance.get('/api/admin/rewards?limit=50');
		setRewards(res.data.data.items || []);
	};

	const loadReviews = async () => {
		const res = await axiosInstance.get('/api/admin/reviews?limit=50');
		setReviews(res.data.data.items || []);
	};

	const loadByTab = async (tabName) => {
		setError('');
		try {
			if (tabName === 'Overview') await loadOverview();
			if (tabName === 'Users') await loadUsers();
			if (tabName === 'Orders') await loadOrders();
			if (tabName === 'Deliveries') await loadDeliveries();
			if (tabName === 'Subscriptions') await loadSubscriptions();
			if (tabName === 'Meals') await loadMeals();
			if (tabName === 'Reports') await loadReports();
			if (tabName === 'Referrals') await loadReferrals();
			if (tabName === 'Rewards') await loadRewards();
			if (tabName === 'Reviews') await loadReviews();
		} catch (err) {
			setError(
				err.response?.data?.message ||
					err.message ||
					'Failed to load data'
			);
		}
	};

	useEffect(() => {
		if (!user) return;
		loadByTab(activeTab);
	}, [activeTab, user]);

	const roleOptions = useMemo(
		() => ['customer', 'restaurant', 'deliveryStaff'],
		[]
	);

	const updateUserField = async (id, payload) => {
		setBusyId(id);
		setError('');
		try {
			await axiosInstance.patch(`/api/admin/users/${id}`, payload);
			await loadUsers();
		} catch (err) {
			setError(
				err.response?.data?.message ||
					err.message ||
					'Failed to update user'
			);
		} finally {
			setBusyId(null);
		}
	};

	const updateOrderStatus = async (id, status) => {
		setBusyId(id);
		setError('');
		try {
			await axiosInstance.patch(`/api/admin/orders/${id}/status`, {
				status,
			});
			await loadOrders();
		} catch (err) {
			setError(
				err.response?.data?.message ||
					err.message ||
					'Failed to update order'
			);
		} finally {
			setBusyId(null);
		}
	};

	const updateDeliveryStatus = async (id, status) => {
		setBusyId(id);
		setError('');
		try {
			await axiosInstance.patch(`/api/admin/deliveries/${id}`, {
				status,
			});
			await loadDeliveries();
		} catch (err) {
			setError(
				err.response?.data?.message ||
					err.message ||
					'Failed to update delivery'
			);
		} finally {
			setBusyId(null);
		}
	};

	const updateSubscriptionStatus = async (id, status) => {
		setBusyId(id);
		setError('');
		try {
			await axiosInstance.patch(`/api/admin/subscriptions/${id}`, {
				status,
			});
			await loadSubscriptions();
		} catch (err) {
			setError(
				err.response?.data?.message ||
					err.message ||
					'Failed to update subscription'
			);
		} finally {
			setBusyId(null);
		}
	};

	const deleteMeal = async (id) => {
		setBusyId(id);
		setError('');
		try {
			await axiosInstance.delete(`/api/admin/meals/${id}`);
			await loadMeals();
		} catch (err) {
			setError(
				err.response?.data?.message ||
					err.message ||
					'Failed to delete meal'
			);
		} finally {
			setBusyId(null);
		}
	};

	const saveMealComment = async (id) => {
		setBusyId(id);
		setError('');
		try {
			await axiosInstance.patch(`/api/admin/meals/${id}`, {
				adminComment: mealComments[id] ?? '',
			});
			setMealComments((prev) => ({ ...prev, [id]: '' }));
			await loadMeals();
		} catch (err) {
			setError(
				err.response?.data?.message ||
					err.message ||
					'Failed to save comment'
			);
		} finally {
			setBusyId(null);
		}
	};

	const updateReviewStatus = async (id, status) => {
		setBusyId(id);
		setError('');
		try {
			await axiosInstance.patch(`/api/admin/reviews/${id}/status`, {
				status,
			});
			await loadReviews();
		} catch (err) {
			setError(
				err.response?.data?.message ||
					err.message ||
					'Failed to update review'
			);
		} finally {
			setBusyId(null);
		}
	};

	if (loading) {
		return (
			<div className="mx-auto max-w-7xl px-4 py-10">
				<div className="rounded-xl border border-gray-100 bg-white p-6">
					Loading...
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-7xl px-4 py-8 bg-gradient-to-br from-violet-25 to-white min-h-screen">
			<div className="mb-6 rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50/50 to-white p-6 shadow-sm shadow-violet-100/50">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-3xl font-semibold text-gray-900">
							Admin Dashboard
						</h1>
						<p className="text-gray-600">
							Manage users, orders, deliveries, and reports
						</p>
					</div>
					<div className="flex items-center gap-3">
						<div className="rounded-lg bg-gradient-to-r from-violet-100 to-violet-200 px-3 py-2 text-sm font-semibold text-violet-800 shadow-sm ring-1 ring-violet-200/50">
							{user?.name}
						</div>
						<button
							onClick={handleLogout}
							className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800 transition-all duration-200 hover:border-violet-300 hover:bg-violet-100 hover:shadow-sm hover:scale-105"
						>
							Logout
						</button>
					</div>
				</div>
				<div className="mt-5 flex flex-wrap gap-2">
					{tabs.map((t) => (
						<button
							key={t}
							onClick={() => setActiveTab(t)}
							className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
								activeTab === t
									? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25 hover:bg-violet-700 hover:shadow-violet-600/40 transform hover:scale-105'
									: 'border border-violet-200 bg-violet-50/50 text-violet-800 hover:bg-violet-100 hover:border-violet-300 hover:shadow-sm hover:scale-105'
							}`}
						>
							{t}
						</button>
					))}
				</div>
				{error ? (
					<div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
						{error}
					</div>
				) : null}
			</div>

			{activeTab === 'Overview' && (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					{[
						{ label: 'Users', value: overview?.userCount },
						{ label: 'Orders', value: overview?.orderCount },
						{ label: 'Deliveries', value: overview?.deliveryCount },
						{
							label: 'Subscriptions',
							value: overview?.subscriptionCount,
						},
						{ label: 'Meals', value: overview?.mealCount },
						{ label: 'Revenue', value: overview?.revenue },
					].map((card) => (
						<div
							key={card.label}
							className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
						>
							<div className="text-sm font-semibold text-gray-600">
								{card.label}
							</div>
							<div className="mt-2 text-3xl font-semibold text-gray-900">
								{card.value ?? '—'}
							</div>
						</div>
					))}
				</div>
			)}

			{activeTab === 'Users' && (
				<div className="rounded-xl border border-gray-100 bg-white shadow-sm">
					<div className="overflow-x-auto">
						<table className="min-w-full text-left text-sm">
							<thead className="border-b border-gray-100 bg-gray-50 text-gray-600">
								<tr>
									<th className="px-4 py-3">Name</th>
									<th className="px-4 py-3">Email</th>
									<th className="px-4 py-3">Role</th>
									<th className="px-4 py-3">Active</th>
								</tr>
							</thead>
							<tbody>
								{users.map((u) => (
									<tr
										key={u._id}
										className="border-b border-gray-100"
									>
										<td className="px-4 py-3 font-semibold text-gray-900">
											{u.name}
										</td>
										<td className="px-4 py-3 text-gray-700">
											{u.email}
										</td>
										<td className="px-4 py-3">
											<select
												disabled={busyId === u._id}
												value={u.role}
												onChange={(e) =>
													updateUserField(u._id, {
														role: e.target.value,
													})
												}
												className="rounded-lg border border-gray-200 bg-white px-3 py-2"
											>
												{roleOptions.map((r) => (
													<option key={r} value={r}>
														{r}
													</option>
												))}
											</select>
										</td>
										<td className="px-4 py-3">
											<button
												disabled={busyId === u._id}
												onClick={() =>
													updateUserField(u._id, {
														isActive: !u.isActive,
													})
												}
												className={`rounded-full px-3 py-1 text-xs font-semibold ${
													u.isActive
														? 'bg-violet-50 text-violet-700'
														: 'bg-red-50 text-red-700'
												}`}
											>
												{u.isActive
													? 'Active'
													: 'Disabled'}
											</button>
										</td>
									</tr>
								))}
								{users.length === 0 ? (
									<tr>
										<td
											className="px-4 py-6 text-gray-600"
											colSpan={4}
										>
											No users found.
										</td>
									</tr>
								) : null}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{activeTab === 'Orders' && (
				<div className="rounded-xl border border-gray-100 bg-white shadow-sm">
					<div className="overflow-x-auto">
						<table className="min-w-full text-left text-sm">
							<thead className="border-b border-gray-100 bg-gray-50 text-gray-600">
								<tr>
									<th className="px-4 py-3">Order</th>
									<th className="px-4 py-3">Customer</th>
									<th className="px-4 py-3">Restaurant</th>
									<th className="px-4 py-3">Menu Items</th>
									<th className="px-4 py-3">Total</th>
									<th className="px-4 py-3">Status</th>
								</tr>
							</thead>
							<tbody>
								{orders.map((o) => (
									<tr
										key={o._id}
										className="border-b border-gray-100"
									>
										<td className="px-4 py-3 font-semibold text-gray-900">
											{o._id}
										</td>
										<td className="px-4 py-3 text-gray-700">
											{o.userId?.name || '—'}
										</td>
										<td className="px-4 py-3 text-gray-700">
											{o.restaurantId?.name || '—'}
										</td>
										<td className="px-4 py-3 text-gray-700 text-xs">
											{o.items?.map((item, idx) => (
												<div key={idx}>
													{item.quantity}x{' '}
													{item.itemId?.name ||
														'Unknown Item'}
												</div>
											))}
										</td>
										<td className="px-4 py-3 text-gray-700">
											{o.total}
										</td>
										<td className="px-4 py-3">
											<select
												disabled={busyId === o._id}
												value={o.status}
												onChange={(e) =>
													updateOrderStatus(
														o._id,
														e.target.value
													)
												}
												className="rounded-lg border border-gray-200 bg-white px-3 py-2"
											>
												{[
													'pending',
													'accepted',
													'completed',
													'cancelled',
												].map((s) => (
													<option key={s} value={s}>
														{s}
													</option>
												))}
											</select>
										</td>
									</tr>
								))}
								{orders.length === 0 ? (
									<tr>
										<td
											className="px-4 py-6 text-gray-600"
											colSpan={5}
										>
											No orders found.
										</td>
									</tr>
								) : null}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{activeTab === 'Deliveries' && (
				<div className="rounded-xl border border-gray-100 bg-white shadow-sm">
					<div className="overflow-x-auto">
						<table className="min-w-full text-left text-sm">
							<thead className="border-b border-gray-100 bg-gray-50 text-gray-600">
								<tr>
									<th className="px-4 py-3">Delivery</th>
									<th className="px-4 py-3">Order</th>
									<th className="px-4 py-3">Customer</th>
									<th className="px-4 py-3">Staff</th>
									<th className="px-4 py-3">Status</th>
								</tr>
							</thead>
							<tbody>
								{deliveries.map((d) => (
									<tr
										key={d._id}
										className="border-b border-gray-100"
									>
										<td className="px-4 py-3 font-semibold text-gray-900">
											{d._id}
										</td>
										<td className="px-4 py-3 text-gray-700">
											{d.order?._id || '—'}
										</td>
										<td className="px-4 py-3 text-gray-700">
											{d.customer?.name || '—'}
										</td>
										<td className="px-4 py-3 text-gray-700">
											{d.deliveryStaff?.name || '—'}
										</td>
										<td className="px-4 py-3">
											<select
												disabled={busyId === d._id}
												value={d.status}
												onChange={(e) =>
													updateDeliveryStatus(
														d._id,
														e.target.value
													)
												}
												className="rounded-lg border border-gray-200 bg-white px-3 py-2"
											>
												{[
													'unassigned',
													'assigned',
													'picked_up',
													'on_the_way',
													'delivered',
													'cancelled',
												].map((s) => (
													<option key={s} value={s}>
														{s}
													</option>
												))}
											</select>
										</td>
									</tr>
								))}
								{deliveries.length === 0 ? (
									<tr>
										<td
											className="px-4 py-6 text-gray-600"
											colSpan={5}
										>
											No deliveries found.
										</td>
									</tr>
								) : null}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{activeTab === 'Subscriptions' && (
				<div className="rounded-xl border border-gray-100 bg-white shadow-sm">
					<div className="overflow-x-auto">
						<table className="min-w-full text-left text-sm">
							<thead className="border-b border-gray-100 bg-gray-50 text-gray-600">
								<tr>
									<th className="px-4 py-3">Subscription</th>
									<th className="px-4 py-3">User</th>
									<th className="px-4 py-3">Plan</th>
									<th className="px-4 py-3">Status</th>
									<th className="px-4 py-3">Start</th>
									<th className="px-4 py-3">End</th>
								</tr>
							</thead>
							<tbody>
								{subscriptions.map((s) => (
									<tr
										key={s._id}
										className="border-b border-gray-100"
									>
										<td className="px-4 py-3 font-semibold text-gray-900">
											{s._id}
										</td>
										<td className="px-4 py-3 text-gray-700">
											{s.user?.name || '—'}
										</td>
										<td className="px-4 py-3 text-gray-700">
											{s.planType}
										</td>
										<td className="px-4 py-3">
											<select
												disabled={busyId === s._id}
												value={s.status}
												onChange={(e) =>
													updateSubscriptionStatus(
														s._id,
														e.target.value
													)
												}
												className="rounded-lg border border-gray-200 bg-white px-3 py-2"
											>
												{[
													'active',
													'paused',
													'cancelled',
													'expired',
												].map((st) => (
													<option key={st} value={st}>
														{st}
													</option>
												))}
											</select>
										</td>
										<td className="px-4 py-3 text-gray-700">
											{s.startDate
												? new Date(
														s.startDate
												  ).toLocaleDateString()
												: '—'}
										</td>
										<td className="px-4 py-3 text-gray-700">
											{s.endDate
												? new Date(
														s.endDate
												  ).toLocaleDateString()
												: '—'}
										</td>
									</tr>
								))}
								{subscriptions.length === 0 ? (
									<tr>
										<td
											className="px-4 py-6 text-gray-600"
											colSpan={6}
										>
											No subscriptions found.
										</td>
									</tr>
								) : null}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{activeTab === 'Meals' && (
				<div className="rounded-xl border border-gray-100 bg-white shadow-sm">
					<div className="overflow-x-auto">
						<table className="min-w-full text-left text-sm">
							<thead className="border-b border-gray-100 bg-gray-50 text-gray-600">
								<tr>
									<th className="px-4 py-3">Meal</th>
									<th className="px-4 py-3">Restaurant</th>
									<th className="px-4 py-3">Name</th>
									<th className="px-4 py-3">Day</th>
									<th className="px-4 py-3">Type</th>
									<th className="px-4 py-3">Price</th>
									<th className="px-4 py-3">Admin Comment</th>
									<th className="px-4 py-3 text-right">
										Actions
									</th>
								</tr>
							</thead>
							<tbody>
								{meals.map((m) => (
									<tr
										key={m._id}
										className="border-b border-gray-100"
									>
										<td className="px-4 py-3 font-semibold text-gray-900">
											{m._id}
										</td>
										<td className="px-4 py-3 text-gray-700">
											{m.restaurant?.name || '—'}
										</td>
										<td className="px-4 py-3 text-gray-700">
											{m.name}
										</td>
										<td className="px-4 py-3 text-gray-700">
											{m.day}
										</td>
										<td className="px-4 py-3 text-gray-700">
											{m.mealType}
										</td>
										<td className="px-4 py-3 text-gray-700">
											{m.price}
										</td>
										<td className="px-4 py-3">
											<textarea
												disabled={busyId === m._id}
												value={
													mealComments[m._id] ?? ''
												}
												onChange={(e) =>
													setMealComments((prev) => ({
														...prev,
														[m._id]: e.target.value,
													}))
												}
												rows={2}
												className="w-72 resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 disabled:opacity-60"
												placeholder="Write a note for the restaurant"
											/>
											{m.adminComment ? (
												<div className="mt-2 w-72 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-[11px] text-gray-700">
													<div className="font-semibold text-gray-900">
														Current comment
													</div>
													<div className="mt-1 whitespace-pre-wrap">
														{m.adminComment}
													</div>
												</div>
											) : null}
										</td>
										<td className="px-4 py-3 text-right">
											<div className="flex justify-end gap-2">
												<button
													disabled={busyId === m._id}
													onClick={() =>
														saveMealComment(m._id)
													}
													className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-800 transition hover:bg-violet-100 disabled:opacity-60"
												>
													Comment
												</button>
												<button
													disabled={busyId === m._id}
													onClick={() =>
														deleteMeal(m._id)
													}
													className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
												>
													Delete
												</button>
											</div>
										</td>
									</tr>
								))}
								{meals.length === 0 ? (
									<tr>
										<td
											className="px-4 py-6 text-gray-600"
											colSpan={8}
										>
											No meals found.
										</td>
									</tr>
								) : null}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{activeTab === 'Reports' && (
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
					<div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
						<div className="text-sm font-semibold text-gray-900">
							Top meals
						</div>
						<div className="mt-3 space-y-2 text-sm text-gray-700">
							{reports.topMeals.map((m) => (
								<div
									key={m._id}
									className="flex items-center justify-between"
								>
									<span className="truncate">{m.name}</span>
									<span className="font-semibold">
										{m.quantity}
									</span>
								</div>
							))}
							{reports.topMeals.length === 0 ? (
								<div className="text-gray-600">No data.</div>
							) : null}
						</div>
					</div>
					<div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
						<div className="text-sm font-semibold text-gray-900">
							Orders per day (30d)
						</div>
						<div className="mt-3 space-y-2 text-sm text-gray-700">
							{reports.ordersPerDay.slice(-10).map((d) => (
								<div
									key={d._id}
									className="flex items-center justify-between"
								>
									<span>{d._id}</span>
									<span className="font-semibold">
										{d.count}
									</span>
								</div>
							))}
							{reports.ordersPerDay.length === 0 ? (
								<div className="text-gray-600">No data.</div>
							) : null}
						</div>
					</div>
					<div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
						<div className="text-sm font-semibold text-gray-900">
							Revenue per day (30d)
						</div>
						<div className="mt-3 space-y-2 text-sm text-gray-700">
							{reports.revenue.slice(-10).map((d) => (
								<div
									key={d._id}
									className="flex items-center justify-between"
								>
									<span>{d._id}</span>
									<span className="font-semibold">
										{d.revenue}
									</span>
								</div>
							))}
							{reports.revenue.length === 0 ? (
								<div className="text-gray-600">No data.</div>
							) : null}
						</div>
					</div>
				</div>
			)}

			{activeTab === 'Referrals' && (
				<div className="rounded-xl border border-gray-100 bg-white shadow-sm">
					<div className="overflow-x-auto">
						<table className="min-w-full text-left text-sm">
							<thead className="border-b border-gray-100 bg-gray-50 text-gray-600">
								<tr>
									<th className="px-4 py-3">Referrer</th>
									<th className="px-4 py-3">Referred</th>
									<th className="px-4 py-3">Code</th>
									<th className="px-4 py-3">Status</th>
								</tr>
							</thead>
							<tbody>
								{referrals.map((r) => (
									<tr
										key={r._id}
										className="border-b border-gray-100"
									>
										<td className="px-4 py-3 text-gray-700">
											{r.referrer?.name || '—'}
										</td>
										<td className="px-4 py-3 text-gray-700">
											{r.referredUser?.name || '—'}
										</td>
										<td className="px-4 py-3 text-gray-700">
											{r.codeUsed}
										</td>
										<td className="px-4 py-3 text-gray-700">
											{r.status}
										</td>
									</tr>
								))}
								{referrals.length === 0 ? (
									<tr>
										<td
											className="px-4 py-6 text-gray-600"
											colSpan={4}
										>
											No referrals found.
										</td>
									</tr>
								) : null}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{activeTab === 'Rewards' && (
				<div className="rounded-xl border border-gray-100 bg-white shadow-sm">
					<div className="overflow-x-auto">
						<table className="min-w-full text-left text-sm">
							<thead className="border-b border-gray-100 bg-gray-50 text-gray-600">
								<tr>
									<th className="px-4 py-3">User</th>
									<th className="px-4 py-3">Type</th>
									<th className="px-4 py-3">Amount</th>
									<th className="px-4 py-3">Date</th>
								</tr>
							</thead>
							<tbody>
								{rewards.map((p) => (
									<tr
										key={p._id}
										className="border-b border-gray-100"
									>
										<td className="px-4 py-3 text-gray-700">
											{p.user?.name || '—'}
										</td>
										<td className="px-4 py-3 text-gray-700">
											{p.type}
										</td>
										<td className="px-4 py-3 text-gray-700">
											{p.amount}
										</td>
										<td className="px-4 py-3 text-gray-700">
											{p.createdAt
												? new Date(
														p.createdAt
												  ).toLocaleString()
												: '—'}
										</td>
									</tr>
								))}
								{rewards.length === 0 ? (
									<tr>
										<td
											className="px-4 py-6 text-gray-600"
											colSpan={4}
										>
											No rewards found.
										</td>
									</tr>
								) : null}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{activeTab === 'Reviews' && (
				<div className="rounded-xl border border-gray-100 bg-white shadow-sm">
					<div className="overflow-x-auto">
						<table className="min-w-full text-left text-sm">
							<thead className="border-b border-gray-100 bg-gray-50 text-gray-600">
								<tr>
									<th className="px-4 py-3">Restaurant</th>
									<th className="px-4 py-3">User</th>
									<th className="px-4 py-3">Rating</th>
									<th className="px-4 py-3">Comment</th>
									<th className="px-4 py-3">Status</th>
									<th className="px-4 py-3 text-right">Actions</th>
								</tr>
							</thead>
							<tbody>
								{reviews.map((r) => (
									<tr
										key={r._id}
										className="border-b border-gray-100"
									>
										<td className="px-4 py-3 text-gray-700">
											{r.restaurant?.name || '—'}
										</td>
										<td className="px-4 py-3 text-gray-700">
											{r.user?.name || '—'}
										</td>
										<td className="px-4 py-3 text-gray-700">
											{r.rating} / 5
										</td>
										<td className="px-4 py-3 text-gray-700 truncate max-w-xs">
											{r.comment}
										</td>
										<td className="px-4 py-3">
											<span
												className={`rounded-full px-2 py-1 text-xs font-semibold ${
													r.status === 'approved'
														? 'bg-violet-50 text-violet-700'
														: r.status === 'rejected'
														? 'bg-red-50 text-red-700'
														: 'bg-yellow-50 text-yellow-700'
												}`}
											>
												{r.status}
											</span>
										</td>
										<td className="px-4 py-3 text-right">
											{r.status === 'pending' && (
												<div className="flex justify-end gap-2">
													<button
														disabled={busyId === r._id}
														onClick={() =>
															updateReviewStatus(
																r._id,
																'approved'
															)
														}
														className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800 transition hover:bg-violet-100 disabled:opacity-50"
													>
														Approve
													</button>
													<button
														disabled={busyId === r._id}
														onClick={() =>
															updateReviewStatus(
																r._id,
																'rejected'
															)
														}
														className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
													>
														Reject
													</button>
												</div>
											)}
										</td>
									</tr>
								))}
								{reviews.length === 0 ? (
									<tr>
										<td
											className="px-4 py-6 text-gray-600"
											colSpan={6}
										>
											No reviews found.
										</td>
									</tr>
								) : null}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}
