// components/AdminLayout.jsx
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

const navItems = [
	{ path: '/admin', label: 'Overview' },
	{ path: '/admin/users', label: 'Users' },
	{ path: '/admin/orders', label: 'Orders' },
	{ path: '/admin/deliveries', label: 'Deliveries' },
	{ path: '/admin/subscriptions', label: 'Subscriptions' },
	{ path: '/admin/meals', label: 'Meals' },
	{ path: '/admin/reports', label: 'Reports' },
	{ path: '/admin/referrals', label: 'Referrals' },
	{ path: '/admin/rewards', label: 'Rewards' },
	{ path: '/admin/reviews', label: 'Reviews' },
];

export default function AdminLayout() {
	const navigate = useNavigate();
	const location = useLocation();
	const [user, setUser] = useState(null);

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
		}
	}, [navigate]);

	const handleLogout = () => {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		window.dispatchEvent(new Event('userLogout'));
		navigate('/');
	};

	if (!user) {
		return (
			<div className="mx-auto max-w-7xl px-4 py-10">
				<div className="rounded-xl border border-gray-100 bg-white p-6">
					Loading...
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-violet-25 to-white">
			<div className="mx-auto max-w-7xl px-4 py-8">
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

					<nav className="mt-5 flex flex-wrap gap-2">
						{navItems.map((item) => {
							const isActive = location.pathname === item.path;
							return (
								<Link
									key={item.path}
									to={item.path}
									className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
										isActive
											? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25 hover:bg-violet-700 hover:shadow-violet-600/40 transform hover:scale-105'
											: 'border border-violet-200 bg-violet-50/50 text-violet-800 hover:bg-violet-100 hover:border-violet-300 hover:shadow-sm hover:scale-105'
									}`}
								>
									{item.label}
								</Link>
							);
						})}
					</nav>
				</div>

				<Outlet />
			</div>
		</div>
	);
}