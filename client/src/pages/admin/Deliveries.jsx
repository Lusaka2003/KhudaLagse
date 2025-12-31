// pages/admin/Orders.jsx
import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';

export default function Orders() {
	const [orders, setOrders] = useState([]);
	const [error, setError] = useState('');
	const [busyId, setBusyId] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadOrders();
	}, []);

	const loadOrders = async () => {
		setError('');
		setLoading(true);
		try {
			const res = await axiosInstance.get('/api/admin/orders?limit=50');
			setOrders(res.data.data.items || []);
		} catch (err) {
			setError(
				err.response?.data?.message ||
					err.message ||
					'Failed to load orders'
			);
		} finally {
			setLoading(false);
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

	if (loading) {
		return (
			<div className="rounded-xl border border-gray-100 bg-white p-6 text-center">
				<div className="text-gray-600">Loading orders...</div>
			</div>
		);
	}

	return (
		<div>
			{error && (
				<div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
					{error}
				</div>
			)}
			
			<div className="rounded-xl border border-gray-100 bg-white shadow-sm">
				<div className="overflow-x-auto">
					<table className="min-w-full text-left text-sm">
						<thead className="border-b border-gray-100 bg-gray-50 text-gray-600">
							<tr>
								<th className="px-4 py-3 font-semibold">Order ID</th>
								<th className="px-4 py-3 font-semibold">Customer</th>
								<th className="px-4 py-3 font-semibold">Restaurant</th>
								<th className="px-4 py-3 font-semibold">Items</th>
								<th className="px-4 py-3 font-semibold">Total</th>
								<th className="px-4 py-3 font-semibold">Status</th>
							</tr>
						</thead>
						<tbody>
							{orders.map((o) => (
								<tr key={o._id} className="border-b border-gray-100 hover:bg-gray-50">
									<td className="px-4 py-3 font-mono text-xs text-gray-900">
										{o._id.substring(0, 8)}...
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
												{item.itemId?.name || 'Unknown Item'}
											</div>
										))}
									</td>
									<td className="px-4 py-3 font-semibold text-gray-900">
										${o.total}
									</td>
									<td className="px-4 py-3">
										<select
											disabled={busyId === o._id}
											value={o.status}
											onChange={(e) =>
												updateOrderStatus(o._id, e.target.value)
											}
											className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
										>
											{['pending', 'accepted', 'completed', 'cancelled'].map(
												(s) => (
													<option key={s} value={s}>
														{s.charAt(0).toUpperCase() + s.slice(1)}
													</option>
												)
											)}
										</select>
									</td>
								</tr>
							))}
							{orders.length === 0 && (
								<tr>
									<td className="px-4 py-8 text-center text-gray-600" colSpan={6}>
										No orders found.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}