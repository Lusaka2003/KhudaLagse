import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';

export default function DeliveryStaffDeliveries() {
	const navigate = useNavigate();
	const [user, setUser] = useState(null);
	const [loadingUser, setLoadingUser] = useState(true);
	const [deliveries, setDeliveries] = useState([]);
	const [loadingDeliveries, setLoadingDeliveries] = useState(true);
	const [error, setError] = useState('');
	const [totals, setTotals] = useState({ totalDeliveries: 0, completedDeliveries: 0 });

	useEffect(() => {
		const userData = localStorage.getItem('user');
		if (!userData) {
			navigate('/login');
			return;
		}

		try {
			const parsedUser = JSON.parse(userData);
			if (parsedUser.role !== 'deliveryStaff') {
				navigate('/');
				return;
			}
			setUser(parsedUser);
		} catch {
			navigate('/login');
		} finally {
			setLoadingUser(false);
		}
	}, [navigate]);

	useEffect(() => {
		const load = async () => {
			setLoadingDeliveries(true);
			setError('');
			try {
				const res = await axiosInstance.get('/api/deliveries/staff/my');
				setDeliveries(res.data?.deliveries || []);
				setTotals(
					res.data?.totals || {
						totalDeliveries: (res.data?.deliveries || []).length,
						completedDeliveries: (res.data?.deliveries || []).filter((d) => d.status === 'delivered').length,
					}
				);
			} catch (err) {
				setError(err.response?.data?.message || err.message || 'Failed to load deliveries');
				setDeliveries([]);
				setTotals({ totalDeliveries: 0, completedDeliveries: 0 });
			} finally {
				setLoadingDeliveries(false);
			}
		};

		if (user) {
			load();
		}
	}, [user]);

	const activeCount = useMemo(
		() =>
			deliveries.filter(
				(d) => d.status === 'assigned' || d.status === 'picked_up' || d.status === 'on_the_way'
			).length,
		[deliveries]
	);

	if (loadingUser) {
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
		<div className="min-h-screen bg-white pt-24">
			<div className="max-w-7xl mx-auto px-4 py-8">
				<div className="bg-gray-50 rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div>
							<h1 className="text-3xl font-semibold text-gray-900 mb-1">
								My Delivery Details
							</h1>
							<p className="text-gray-600">{user?.name}</p>
						</div>
						<button
							type="button"
							onClick={() => navigate('/dashboard/delivery-staff')}
							className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:border-violet-200 hover:bg-violet-50"
						>
							Back to Dashboard
						</button>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
					<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
						<div className="text-4xl mb-3">📦</div>
						<div className="text-3xl font-semibold text-gray-900 mb-1">
							{totals.totalDeliveries || 0}
						</div>
						<div className="text-sm text-gray-600">Total Deliveries</div>
					</div>
					<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
						<div className="text-4xl mb-3">✅</div>
						<div className="text-3xl font-semibold text-gray-900 mb-1">
							{totals.completedDeliveries || 0}
						</div>
						<div className="text-sm text-gray-600">Completed</div>
					</div>
					<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
						<div className="text-4xl mb-3">🚚</div>
						<div className="text-3xl font-semibold text-gray-900 mb-1">{activeCount}</div>
						<div className="text-sm text-gray-600">Active</div>
					</div>
				</div>

				{error ? (
					<div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
						{error}
					</div>
				) : null}

				<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
					<h2 className="text-2xl font-semibold text-gray-900 mb-4">Deliveries</h2>

					{loadingDeliveries ? (
						<p className="text-gray-600">Loading deliveries...</p>
					) : deliveries.length === 0 ? (
						<p className="text-gray-600">No deliveries found.</p>
					) : (
						<div className="space-y-3">
							{deliveries.map((d) => {
								const orderId = d.order?._id || d.order?.toString() || 'N/A';
								const restaurantName =
									d.order?.restaurantId?.name ||
									d.order?.restaurantId?.restaurantName ||
									'N/A';
								const customerName = d.customer?.name || d.order?.userId?.name || 'N/A';
								const total = d.order?.total;
								const when = d.order?.deliveryDateTime || d.createdAt;
								const address = d.address
									? `${d.address.house} ${d.address.road}, ${d.address.area}, ${d.address.city}`
									: '';

								return (
									<div key={d._id} className="border rounded-lg px-4 py-3">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<p className="font-semibold text-gray-900">
												Order #{String(orderId).slice(-6)}
											</p>
											<p className="text-sm text-gray-700 capitalize">
												Status: {String(d.status || '').replaceAll('_', ' ')}
											</p>
										</div>
										<div className="mt-1 text-sm text-gray-600">
											Restaurant: {restaurantName}
											{typeof total === 'number' ? ` • Total: ${total} BDT` : ''}
										</div>
										<div className="text-sm text-gray-600">Customer: {customerName}</div>
										{address ? <div className="text-sm text-gray-500">📍 {address}</div> : null}
										{when ? (
											<div className="text-xs text-gray-500 mt-1">
												{new Date(when).toLocaleString()}
											</div>
										) : null}
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

