import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Logo from './Logo';

export default function Navbar() {
	const [isOpen, setIsOpen] = useState(false);
	const [user, setUser] = useState(null);
	const location = useLocation();
	const navigate = useNavigate();
	const activePath = location.pathname;

	// Check if user is logged in and update state
	useEffect(() => {
		const checkUser = () => {
			const userData = localStorage.getItem('user');
			if (userData) {
				try {
					setUser(JSON.parse(userData));
				} catch (err) {
					console.error('Error parsing user data:', err);
					localStorage.removeItem('user');
					localStorage.removeItem('token');
					setUser(null);
				}
			} else {
				setUser(null);
			}
		};

		checkUser();

		// Listen for storage changes (when user logs in/out in another tab)
		window.addEventListener('storage', checkUser);

		// Listen for custom event when user logs in/out
		window.addEventListener('userLogin', checkUser);

		return () => {
			window.removeEventListener('storage', checkUser);
			window.removeEventListener('userLogin', checkUser);
		};
	}, [location.pathname]); // Re-check when route changes

	const navLinks = [
		{ name: 'Home', path: '/' },
		{ name: 'About', path: '/about' },
		{ name: 'Restaurants', path: '/restaurants' },
	];

	const handleNavClick = () => {
		setIsOpen(false);
	};

	const handleDashboardClick = () => {
		if (!user) return;

		const role = user.role;
		if (role === 'customer') {
			navigate('/dashboard/customer');
		} else if (role === 'restaurant') {
			navigate('/dashboard/restaurant');
		} else if (role === 'deliveryStaff') {
			navigate('/dashboard/delivery-staff');
		} else if (role === 'admin' && user.isSuperAdmin === true) {
			navigate('/dashboard/admin');
		}
		setIsOpen(false);
	};

	return (
		<header className="w-full">
			{/* Top Bar - Only show when user is not logged in */}
			{!user && (
				<div className="w-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-500 text-white text-sm flex justify-end gap-4 px-4 py-2">
					<button
						onClick={() => navigate('/restaurant-signup')}
						className="px-4 py-1 rounded-lg bg-white text-pink-400 hover:bg-blue-600 hover:text-white transition-colors shadow-md font-medium"
					>
						Sign up as Restaurant Partner
					</button>
					
				</div>
			)}

			{/* Main Navbar */}
			<nav className="w-full flex justify-between items-center px-4 sm:px-8 py-3 bg-white shadow-md">
				{/* Logo */}
				<Link
					to="/"
					onClick={handleNavClick}
					className="flex items-center gap-2 ml-4 sm:ml-8"
				>
					<Logo />
				</Link>

				{/* Desktop Navigation */}
				<div className="hidden lg:flex items-center gap-6">
					{navLinks.map((link) => (
						<Link
							key={link.path}
							to={link.path}
							onClick={handleNavClick}
							className={`text-sm font-medium transition-colors ${
								activePath === link.path
									? 'text-violet-700'
									: 'text-gray-700 hover:text-violet-700'
							}`}
						>
							{link.name}
						</Link>
					))}
				</div>

				{/* Actions */}
				<div className="flex items-center gap-3">
					{user ? (
						<button
							onClick={handleDashboardClick}
							className="flex items-center gap-2 rounded-full border border-gray-400 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition"
						>
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500 text-white text-xs font-bold">
								{user.name?.charAt(0).toUpperCase() || 'U'}
							</div>
							<span className="hidden sm:inline">{user.name}</span>
						</button>
					) : (
						<>
							<button
								onClick={() => navigate('/login')}
								className="hidden sm:inline-flex px-4 py-2 rounded-full border border-gray-400 hover:bg-gray-100 transition text-sm font-medium"
							>
								Login
							</button>
							<button
								onClick={() => navigate('/register')}
								className="px-4 py-2 rounded-full bg-violet-500 text-white hover:bg-violet-600 transition text-sm font-medium"
							>
								Sign Up
							</button>
						</>
					)}

					{/* Mobile toggle */}
					<button
						onClick={() => setIsOpen(!isOpen)}
						className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 lg:hidden"
					>
						{isOpen ? (
							<XMarkIcon className="h-6 w-6" />
						) : (
							<Bars3Icon className="h-6 w-6" />
						)}
					</button>
				</div>
			</nav>

			{/* Mobile menu */}
			{isOpen && (
				<div className="border-t border-gray-200 bg-white lg:hidden shadow-md">
					<div className="flex flex-col gap-2 px-4 py-4">
						{navLinks.map((link) => (
							<Link
								key={link.path}
								to={link.path}
								onClick={handleNavClick}
								className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
									activePath === link.path
										? 'bg-violet-50 text-violet-700'
										: 'text-gray-800 hover:bg-gray-50'
								}`}
							>
								{link.name}
							</Link>
						))}

						{user ? (
							<button
								onClick={handleDashboardClick}
								className="mt-2 flex items-center gap-3 rounded-full border border-gray-400 px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition"
							>
								<div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500 text-white text-sm font-bold">
									{user.name?.charAt(0).toUpperCase() || 'U'}
								</div>
								<span>{user.name}</span>
							</button>
						) : (
							<>
								{/* Mobile - Partner signup buttons */}
								<button
									onClick={() => {
										navigate('/restaurant-signup');
										handleNavClick();
									}}
									className="mt-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:from-blue-600 hover:to-blue-800"
								>
									Sign up as Restaurant Partner
								</button>
								
								
								{/* Regular auth buttons */}
								<button
									onClick={() => {
										navigate('/login');
										handleNavClick();
									}}
									className="mt-2 rounded-full border border-gray-400 px-4 py-3 text-sm font-medium hover:bg-gray-100 transition"
								>
									Login
								</button>
								<button
									onClick={() => {
										navigate('/sign-up');
										handleNavClick();
									}}
									className="rounded-full bg-blue-700 px-4 py-3 text-sm font-medium text-white hover:bg-blue-800 transition"
								>
									Sign Up
								</button>
							</>
						)}
					</div>
				</div>
			)}
		</header>
	);
}