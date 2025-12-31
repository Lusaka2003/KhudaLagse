// pages/admin/Subscriptions.jsx
import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';

export default function Subscriptions() {
	const [subscriptions, setSubscriptions] = useState([]);
	const [error, setError] = useState('');
	const [busyId, setBusyId] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadSubscriptions();
	}, []);

	const loadSubscriptions = async () => {
		setError('');
		setLoading(true);
		try {
			const res = await axiosInstance.get('/api/admin/subscriptions?limit=50');
			setSubscriptions(res.data.data.items || []);
		} catch (err) {
			setError(
				err.response?.data?.message ||
					err.message ||
					'Failed to load subscriptions'
			);
		} finally {
			setLoading(false);
		}
	};

	const updateSubscriptionStatus = async (id, status) => {
		setBusyId(id);
		setError('');
		try {
			await axiosInstance.patch(`/api/admin/subscriptions/${id}`, { status });
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

	const getStatusColor = (status) => {
		const colors = {
			active: 'bg-green-100 text-green-700',
			paused: 'bg-yellow-100 text-yellow-700',
			cancelled: 'bg-red-100 text-red-700',
			expired: 'bg-gray-100 text-gray-700',
		};
		return colors[status] || 'bg-gray-100 text-gray-700';
	};

	if (loading) {
		return (
			<div className="rounded-xl border border-gray-100 bg-white p-6 text-center">
				<div className="text-gray-600">Loading subscriptions...</div>
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
								<th className="px-4 py-3 font-semibold">Subscription ID</th>
								<th className="px-4 py-3 font-semibold">User</th>
								<th className="px-4 py-3 font-semibold">Plan</th>
								<th className="px-4 py-3 font-semibold">Start Date</th>
								<th className="px-4 py-3 font-semibold">End Date</th>
								<th className="px-4 py-3 font-semibold">Status</th>
							</tr>
						</thead>
						<tbody>
							{subscriptions.map((s) => (
								<tr key={s._id} className="border-b border-gray-100 hover:bg-gray-50">
									<td className="px-4 py-3 font-mono text-xs text-gray-900">
										{s._id.substring(0, 8)}...
									</td>
									<td className="px-4 py-3 text-gray-700">
										{s.user?.name || '—'}
									</td>
									<td className="px-4 py-3">
										<span className="inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
											{s.planType}
										</span>
									</td>
									<td className="px-4 py-3 text-gray-700">
										{s.startDate
											? new Date(s.startDate).toLocaleDateString()
											: '—'}
									</td>
									<td className="px-4 py-3 text-gray-700">
										{s.endDate
											? new Date(s.endDate).toLocaleDateString()
											: '—'}
									</td>
									<td className="px-4 py-3">
										<select
											disabled={busyId === s._id}
											value={s.status}
											onChange={(e) =>
												updateSubscriptionStatus(s._id, e.target.value)
											}
											className={`rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${getStatusColor(s.status)}`}
										>
											{['active', 'paused', 'cancelled', 'expired'].map(
												(st) => (
													<option key={st} value={st}>
														{st.charAt(0).toUpperCase() + st.slice(1)}
													</option>
												)
											)}
										</select>
									</td>
								</tr>
							))}
							{subscriptions.length === 0 && (
								<tr>
									<td className="px-4 py-8 text-center text-gray-600" colSpan={6}>
										No subscriptions found.
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