// pages/admin/Overview.jsx
import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';

export default function Overview() {
	const [overview, setOverview] = useState(null);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadOverview();
	}, []);

	const loadOverview = async () => {
		setError('');
		setLoading(true);
		try {
			const res = await axiosInstance.get('/api/admin/dashboard');
			setOverview(res.data.data);
		} catch (err) {
			setError(
				err.response?.data?.message ||
					err.message ||
					'Failed to load data'
			);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="rounded-xl border border-gray-100 bg-white p-6 text-center">
				<div className="text-gray-600">Loading overview...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
				{error}
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{[
				{ label: 'Total Users', value: overview?.userCount, icon: '👥' },
				{ label: 'Total Orders', value: overview?.orderCount, icon: '📦' },
				{ label: 'Active Deliveries', value: overview?.deliveryCount, icon: '🚚' },
				{ label: 'Active Subscriptions', value: overview?.subscriptionCount, icon: '⭐' },
				{ label: 'Total Meals', value: overview?.mealCount, icon: '🍽️' },
				{ label: 'Total Revenue', value: `$${overview?.revenue || 0}`, icon: '💰' },
			].map((card) => (
				<div
					key={card.label}
					className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
				>
					<div className="flex items-center justify-between">
						<div>
							<div className="text-sm font-semibold text-gray-600">
								{card.label}
							</div>
							<div className="mt-2 text-3xl font-bold text-gray-900">
								{card.value ?? '—'}
							</div>
						</div>
						<div className="text-4xl opacity-50">{card.icon}</div>
					</div>
				</div>
			))}
		</div>
	);
}