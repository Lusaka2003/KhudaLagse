// pages/admin/Subscriptions.jsx
import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';

export default function Subscriptions() {
	const [subscriptions, setSubscriptions] = useState([]);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');

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

	const getStatusColor = (status) => {
		const colors = {
			active: 'bg-green-100 text-green-700',
			paused: 'bg-yellow-100 text-yellow-700',
			cancelled: 'bg-red-100 text-red-700',
			expired: 'bg-gray-100 text-gray-700',
		};
		return colors[status] || 'bg-gray-100 text-gray-700';
	};

	const statusFilters = [
		{ value: 'all', label: 'All Status' },
		{ value: 'active', label: 'Active' },
		
		{ value: 'cancelled', label: 'Cancelled' },
		{ value: 'expired', label: 'Expired' },
	];

	const filteredSubscriptions = searchQuery || statusFilter !== 'all' 
		? subscriptions.filter(s => {
				const matchesSearch = searchQuery.trim() === '' || 
					s._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
					s.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					s.planType?.toLowerCase().includes(searchQuery.toLowerCase());
				
				const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
				
				return matchesSearch && matchesStatus;
			})
		: subscriptions;

	if (loading) {
		return (
			<div className="rounded-xl border border-gray-100 bg-white p-6 text-center">
				<div className="text-gray-600">Loading subscriptions...</div>
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
							placeholder="Search by subscription ID, user name, or plan type..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
						/>
					</div>
					
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
							</svg>
							<span className="text-sm font-medium text-gray-600">Filter by:</span>
						</div>
						<div className="flex flex-wrap gap-2">
							{statusFilters.map((filter) => (
								<button
									key={filter.value}
									onClick={() => setStatusFilter(filter.value)}
									className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
										statusFilter === filter.value
											? filter.value === 'active' ? 'bg-green-600 text-white' :
												filter.value === 'paused' ? 'bg-yellow-600 text-white' :
												filter.value === 'cancelled' ? 'bg-red-600 text-white' :
												filter.value === 'expired' ? 'bg-gray-600 text-white' :
												'bg-gray-900 text-white'
											: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
									}`}
								>
									{filter.label}
								</button>
							))}
						</div>
					</div>
				</div>
				
				{(searchQuery || statusFilter !== 'all') && (
					<div className="mt-3 flex items-center justify-between">
						<div className="text-sm text-gray-600">
							Found {filteredSubscriptions.length} subscription{filteredSubscriptions.length !== 1 ? 's' : ''}
							{statusFilter !== 'all' && ` (${statusFilter})`}
						</div>
						<button
							onClick={() => {
								setSearchQuery('');
								setStatusFilter('all');
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
								<th className="px-4 py-3 font-semibold">Subscription ID</th>
								<th className="px-4 py-3 font-semibold">User</th>
								<th className="px-4 py-3 font-semibold">Plan</th>
								<th className="px-4 py-3 font-semibold">Start Date</th>
								<th className="px-4 py-3 font-semibold">End Date</th>
								<th className="px-4 py-3 font-semibold">Status</th>
							</tr>
						</thead>
						<tbody>
							{filteredSubscriptions.map((s) => (
								<tr key={s._id} className="border-b border-gray-100 hover:bg-gray-50">
									<td className="px-4 py-3 font-mono text-xs text-gray-900">
										{s._id.substring(0, 8)}...
									</td>
									<td className="px-4 py-3 text-gray-700">
										<div className="font-medium">{s.user?.name || '—'}</div>
										{s.user?.email && (
											<div className="text-xs text-gray-500">{s.user.email}</div>
										)}
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
										<span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(s.status)}`}>
											{s.status?.charAt(0).toUpperCase() + s.status?.slice(1)}
										</span>
									</td>
								</tr>
							))}
							{filteredSubscriptions.length === 0 && (
								<tr>
									<td className="px-4 py-8 text-center text-gray-600" colSpan={6}>
										{searchQuery || statusFilter !== 'all'
											? 'No subscriptions found matching your filters.'
											: 'No subscriptions found.'}
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