// pages/admin/Rewards.jsx
import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';

export default function Rewards() {
	const [rewards, setRewards] = useState([]);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadRewards();
	}, []);

	const loadRewards = async () => {
		setError('');
		setLoading(true);
		try {
			const res = await axiosInstance.get('/api/admin/rewards?limit=50');
			setRewards(res.data.data.items || []);
		} catch (err) {
			setError(
				err.response?.data?.message ||
					err.message ||
					'Failed to load rewards'
			);
		} finally {
			setLoading(false);
		}
	};

	const getTypeColor = (type) => {
		const colors = {
			signup: 'bg-blue-100 text-blue-700',
			referral: 'bg-purple-100 text-purple-700',
			purchase: 'bg-green-100 text-green-700',
			bonus: 'bg-yellow-100 text-yellow-700',
			refund: 'bg-red-100 text-red-700',
		};
		return colors[type] || 'bg-gray-100 text-gray-700';
	};

	const getTypeIcon = (type) => {
		const icons = {
			signup: '🎉',
			referral: '👥',
			purchase: '🛒',
			bonus: '🎁',
			refund: '💸',
		};
		return icons[type] || '💰';
	};

	if (loading) {
		return (
			<div className="rounded-xl border border-gray-100 bg-white p-6 text-center">
				<div className="text-gray-600">Loading rewards...</div>
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
					<div className="text-sm text-gray-600">Total Rewards</div>
					<div className="text-2xl font-bold text-gray-900 mt-1">
						{rewards.length}
					</div>
				</div>
				<div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
					<div className="text-sm text-gray-600">Total Amount</div>
					<div className="text-2xl font-bold text-green-600 mt-1">
						${rewards.reduce((sum, r) => sum + (r.amount || 0), 0).toFixed(2)}
					</div>
				</div>
				<div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
					<div className="text-sm text-gray-600">Avg. Reward</div>
					<div className="text-2xl font-bold text-violet-600 mt-1">
						${rewards.length > 0
							? (rewards.reduce((sum, r) => sum + (r.amount || 0), 0) / rewards.length).toFixed(2)
							: '0.00'}
					</div>
				</div>
				<div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
					<div className="text-sm text-gray-600">Unique Users</div>
					<div className="text-2xl font-bold text-blue-600 mt-1">
						{new Set(rewards.map(r => r.user?._id).filter(Boolean)).size}
					</div>
				</div>
			</div>

			{/* Rewards Table */}
			<div className="rounded-xl border border-gray-100 bg-white shadow-sm">
				<div className="overflow-x-auto">
					<table className="min-w-full text-left text-sm">
						<thead className="border-b border-gray-100 bg-gray-50 text-gray-600">
							<tr>
								<th className="px-4 py-3 font-semibold">User</th>
								<th className="px-4 py-3 font-semibold">Type</th>
								<th className="px-4 py-3 font-semibold">Amount</th>
								<th className="px-4 py-3 font-semibold">Description</th>
								<th className="px-4 py-3 font-semibold">Date</th>
							</tr>
						</thead>
						<tbody>
							{rewards.map((p) => (
								<tr key={p._id} className="border-b border-gray-100 hover:bg-gray-50">
									<td className="px-4 py-3">
										<div className="flex items-center gap-2">
											<div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-xs">
												{p.user?.name?.charAt(0).toUpperCase() || '?'}
											</div>
											<span className="font-medium text-gray-900">
												{p.user?.name || '—'}
											</span>
										</div>
									</td>
									<td className="px-4 py-3">
										<span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getTypeColor(p.type)}`}>
											<span>{getTypeIcon(p.type)}</span>
											<span>{p.type?.charAt(0).toUpperCase() + p.type?.slice(1) || '—'}</span>
										</span>
									</td>
									<td className="px-4 py-3">
										<span className="font-bold text-green-600">
											${p.amount?.toFixed(2) || '0.00'}
										</span>
									</td>
									<td className="px-4 py-3 text-gray-700 max-w-xs truncate">
										{p.description || '—'}
									</td>
									<td className="px-4 py-3 text-gray-700">
										{p.createdAt
											? new Date(p.createdAt).toLocaleString()
											: '—'}
									</td>
								</tr>
							))}
							{rewards.length === 0 && (
								<tr>
									<td className="px-4 py-8 text-center text-gray-600" colSpan={5}>
										No rewards found.
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