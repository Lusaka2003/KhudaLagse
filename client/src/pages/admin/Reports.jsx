// pages/admin/Reports.jsx
import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';

export default function Reports() {
	const [reports, setReports] = useState({
		topMeals: [],
		ordersPerDay: [],
		revenue: [],
	});
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadReports();
	}, []);

	const loadReports = async () => {
		setError('');
		setLoading(true);
		try {
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
		} catch (err) {
			setError(
				err.response?.data?.message ||
					err.message ||
					'Failed to load reports'
			);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="rounded-xl border border-gray-100 bg-white p-6 text-center">
				<div className="text-gray-600">Loading reports...</div>
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
		<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
			{/* Top Meals Card */}
			<div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold text-gray-900">🏆 Top Meals</h3>
					<span className="text-xs text-gray-500">Most Ordered</span>
				</div>
				<div className="space-y-3">
					{reports.topMeals.map((m, index) => (
						<div
							key={m._id}
							className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
						>
							<div className="flex items-center gap-3">
								<span className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 text-violet-700 font-bold text-sm">
									{index + 1}
								</span>
								<span className="font-medium text-gray-900 truncate">
									{m.name}
								</span>
							</div>
							<span className="font-bold text-violet-600">
								{m.quantity}
							</span>
						</div>
					))}
					{reports.topMeals.length === 0 && (
						<div className="text-center text-gray-500 py-8">
							No data available
						</div>
					)}
				</div>
			</div>

			{/* Orders Per Day Card */}
			<div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold text-gray-900">📦 Daily Orders</h3>
					<span className="text-xs text-gray-500">Last 30 Days</span>
				</div>
				<div className="space-y-2 max-h-96 overflow-y-auto">
					{reports.ordersPerDay.slice(-10).map((d) => (
						<div
							key={d._id}
							className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors"
						>
							<span className="text-sm text-gray-600">{d._id}</span>
							<span className="font-semibold text-gray-900">{d.count}</span>
						</div>
					))}
					{reports.ordersPerDay.length === 0 && (
						<div className="text-center text-gray-500 py-8">
							No data available
						</div>
					)}
				</div>
			</div>

			{/* Revenue Per Day Card */}
			<div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold text-gray-900">💰 Daily Revenue</h3>
					<span className="text-xs text-gray-500">Last 30 Days</span>
				</div>
				<div className="space-y-2 max-h-96 overflow-y-auto">
					{reports.revenue.slice(-10).map((d) => (
						<div
							key={d._id}
							className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors"
						>
							<span className="text-sm text-gray-600">{d._id}</span>
							<span className="font-semibold text-green-600">
								${d.revenue}
							</span>
						</div>
					))}
					{reports.revenue.length === 0 && (
						<div className="text-center text-gray-500 py-8">
							No data available
						</div>
					)}
				</div>
			</div>

			{/* Summary Card */}
			<div className="lg:col-span-3 rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-6 shadow-sm">
				<h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Summary</h3>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="p-4 rounded-lg bg-white border border-gray-100">
						<div className="text-sm text-gray-600">Total Orders (30d)</div>
						<div className="text-2xl font-bold text-gray-900 mt-1">
							{reports.ordersPerDay.reduce((sum, d) => sum + d.count, 0)}
						</div>
					</div>
					<div className="p-4 rounded-lg bg-white border border-gray-100">
						<div className="text-sm text-gray-600">Total Revenue (30d)</div>
						<div className="text-2xl font-bold text-green-600 mt-1">
							${reports.revenue.reduce((sum, d) => sum + d.revenue, 0).toFixed(2)}
						</div>
					</div>
					<div className="p-4 rounded-lg bg-white border border-gray-100">
						<div className="text-sm text-gray-600">Avg. Order Value</div>
						<div className="text-2xl font-bold text-violet-600 mt-1">
							${(
								reports.revenue.reduce((sum, d) => sum + d.revenue, 0) /
								Math.max(reports.ordersPerDay.reduce((sum, d) => sum + d.count, 0), 1)
							).toFixed(2)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}