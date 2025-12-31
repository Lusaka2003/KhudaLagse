// pages/admin/Referrals.jsx
import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';

export default function Referrals() {
	const [referrals, setReferrals] = useState([]);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadReferrals();
	}, []);

	const loadReferrals = async () => {
		setError('');
		setLoading(true);
		try {
			const res = await axiosInstance.get('/api/admin/referrals?limit=50');
			setReferrals(res.data.data.items || []);
		} catch (err) {
			setError(
				err.response?.data?.message ||
					err.message ||
					'Failed to load referrals'
			);
		} finally {
			setLoading(false);
		}
	};

	const getStatusColor = (status) => {
		const colors = {
			pending: 'bg-yellow-100 text-yellow-700',
			completed: 'bg-green-100 text-green-700',
			expired: 'bg-gray-100 text-gray-700',
			cancelled: 'bg-red-100 text-red-700',
		};
		return colors[status] || 'bg-gray-100 text-gray-700';
	};

	if (loading) {
		return (
			<div className="rounded-xl border border-gray-100 bg-white p-6 text-center">
				<div className="text-gray-600">Loading referrals...</div>
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
			
			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
				<div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
					<div className="text-sm text-gray-600">Total Referrals</div>
					<div className="text-2xl font-bold text-gray-900 mt-1">
						{referrals.length}
					</div>
				</div>
				<div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
					<div className="text-sm text-gray-600">Completed</div>
					<div className="text-2xl font-bold text-green-600 mt-1">
						{referrals.filter(r => r.status === 'completed').length}
					</div>
				</div>
				<div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
					<div className="text-sm text-gray-600">Pending</div>
					<div className="text-2xl font-bold text-yellow-600 mt-1">
						{referrals.filter(r => r.status === 'pending').length}
					</div>
				</div>
				<div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
					<div className="text-sm text-gray-600">Success Rate</div>
					<div className="text-2xl font-bold text-violet-600 mt-1">
						{referrals.length > 0
							? Math.round((referrals.filter(r => r.status === 'completed').length / referrals.length) * 100)
							: 0}%
					</div>
				</div>
			</div>

			{/* Referrals Table */}
			<div className="rounded-xl border border-gray-100 bg-white shadow-sm">
				<div className="overflow-x-auto">
					<table className="min-w-full text-left text-sm">
						<thead className="border-b border-gray-100 bg-gray-50 text-gray-600">
							<tr>
								<th className="px-4 py-3 font-semibold">Referrer</th>
								<th className="px-4 py-3 font-semibold">Referred User</th>
								<th className="px-4 py-3 font-semibold">Referral Code</th>
								<th className="px-4 py-3 font-semibold">Status</th>
								<th className="px-4 py-3 font-semibold">Date</th>
							</tr>
						</thead>
						<tbody>
							{referrals.map((r) => (
								<tr key={r._id} className="border-b border-gray-100 hover:bg-gray-50">
									<td className="px-4 py-3">
										<div className="flex items-center gap-2">
											<div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-xs">
												{r.referrer?.name?.charAt(0).toUpperCase() || '?'}
											</div>
											<span className="font-medium text-gray-900">
												{r.referrer?.name || '—'}
											</span>
										</div>
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center gap-2">
											<div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs">
												{r.referredUser?.name?.charAt(0).toUpperCase() || '?'}
											</div>
											<span className="font-medium text-gray-900">
												{r.referredUser?.name || '—'}
											</span>
										</div>
									</td>
									<td className="px-4 py-3">
										<span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-mono font-semibold text-gray-700">
											{r.codeUsed}
										</span>
									</td>
									<td className="px-4 py-3">
										<span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(r.status)}`}>
											{r.status?.charAt(0).toUpperCase() + r.status?.slice(1) || '—'}
										</span>
									</td>
									<td className="px-4 py-3 text-gray-700">
										{r.createdAt
											? new Date(r.createdAt).toLocaleDateString()
											: '—'}
									</td>
								</tr>
							))}
							{referrals.length === 0 && (
								<tr>
									<td className="px-4 py-8 text-center text-gray-600" colSpan={5}>
										No referrals found.
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