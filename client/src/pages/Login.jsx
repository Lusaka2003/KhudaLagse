import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import Logo from '../components/Logo';

export default function Login() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		email: '',
		password: '',
	});
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
		setError('');
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			const response = await axiosInstance.post('/api/auth/login', {
				email: formData.email,
				password: formData.password,
			});

			if (response.data.success) {
				// Store token and user data
				localStorage.setItem('token', response.data.data.token);
				localStorage.setItem(
					'user',
					JSON.stringify(response.data.data.user)
				);

				// Notify Navbar of login
				window.dispatchEvent(new Event('userLogin'));

				// Redirect based on role
				const user = response.data.data.user;
				const role = user.role;
				if (role === 'customer') {
					navigate('/dashboard/customer');
				} else if (role === 'restaurant') {
					navigate('/dashboard/restaurant');
				} else if (role === 'deliveryStaff') {
					navigate('/dashboard/delivery-staff');
				} else if (role === 'admin' && user.isSuperAdmin === true) {
					navigate('/dashboard/admin');
				} else {
					navigate('/');
				}
			} else {
				setError(response.data.message || 'Login failed');
			}
		} catch (err) {
			setError(
				err.response?.data?.message ||
					err.message ||
					'An error occurred during login'
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div 
			className="min-h-screen bg-cover bg-center bg-fixed px-4 pb-16 pt-28"
			style={{ backgroundImage: `url(/background.png)` }}
		>
			<div className="mx-auto max-w-md">
				<div className="rounded-2xl bg-white p-10 shadow-lg border border-stone-200/60">
					{/* Header */}
					<div className="text-center mb-8">
						<div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mx-auto mb-4">
							<Logo/>
						</div>
						<h1 className="text-2xl font-bold text-stone-800">
							Welcome back
						</h1>
						<p className="text-stone-500 mt-1">
							Sign in to continue to Khudalagse
						</p>
					</div>

					{/* Error Message */}
					{error && (
						<div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
							{error}
						</div>
					)}

					{/* Login Form */}
					<form onSubmit={handleSubmit} className="space-y-5">
						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-stone-600 mb-1.5"
							>
								Email address
							</label>
							<input
								type="email"
								id="email"
								name="email"
								value={formData.email}
								onChange={handleChange}
								required
								className="w-full rounded-lg border border-stone-300 px-4 py-3 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500 focus:outline-none"
								placeholder="you@email.com"
							/>
						</div>

						<div>
							<div className="flex items-center justify-between mb-1.5">
								<label
									htmlFor="password"
									className="block text-sm font-medium text-stone-600"
								>
									Password
								</label>
								<Link
									to="/forgot-password"
									className="text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
								>
									Forgot password?
								</Link>
							</div>
							<input
								type="password"
								id="password"
								name="password"
								value={formData.password}
								onChange={handleChange}
								required
								className="w-full rounded-lg border border-stone-300 px-4 py-3 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
								placeholder="••••••••"
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 py-3 font-semibold text-white shadow-sm transition hover:from-violet-700 hover:to-violet-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
						>
							{loading ? 'Signing in...' : 'Sign in'}
						</button>
					</form>

					{/* Sign Up Link */}
					<div className="mt-6 text-center">
						<p className="text-stone-500">
							Don't have an account?{' '}
							<Link
								to="/register"
								className="font-semibold text-violet-600 hover:text-violet-700"
							>
								Create one
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
