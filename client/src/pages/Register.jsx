import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import Logo from '../components/Logo';

export default function Register() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		role: 'customer',
		name: '',
		email: '',
		phone: '',
		password: '',
		confirmPassword: '',
		customerHouse: '',
		customerRoad: '',
		customerArea: '',
		customerCity: '',
		referralCode: '',
	});
	const [errors, setErrors] = useState({});
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const validateField = (name, value) => {
		switch (name) {
			case 'name':
				if (value.trim().length < 2) return 'Name must be at least 2 characters';
				if (!/^[a-zA-Z\s]+$/.test(value)) return 'Name should only contain letters';
				return '';
			case 'email':
				if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email address';
				return '';
			case 'phone':
				if (!/^01[3-9]\d{8}$/.test(value)) return 'Invalid phone number (e.g., 01712345678)';
				return '';
			case 'password':
				if (value.length < 6) return 'Password must be at least 6 characters';
				if (!/(?=.*[a-z])/.test(value)) return 'Password must contain a lowercase letter';
				if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain an uppercase letter';
				if (!/(?=.*\d)/.test(value)) return 'Password must contain a number';
				return '';
			case 'confirmPassword':
				if (value !== formData.password) return 'Passwords do not match';
				return '';
			case 'customerArea':
			case 'customerCity':
				if (value.trim().length < 2) return 'This field is required';
				return '';
			default:
				return '';
		}
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
		
		if (errors[name]) {
			setErrors(prev => ({ ...prev, [name]: '' }));
		}
	};

	const handleBlur = (e) => {
		const { name, value } = e.target;
		const error = validateField(name, value);
		if (error) {
			setErrors(prev => ({ ...prev, [name]: error }));
		}
	};

	const validateForm = () => {
		const newErrors = {};
		
		Object.keys(formData).forEach(key => {
			if (key !== 'role' && key !== 'customerRoad' && key !== 'referralCode') {
				const error = validateField(key, formData[key]);
				if (error) newErrors[key] = error;
			}
		});

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		if (!validateForm()) {
			return;
		}

		setLoading(true);

		try {
			const payload = {
				name: formData.name.trim(),
				email: formData.email.toLowerCase().trim(),
				phone: formData.phone.trim(),
				password: formData.password,
				role: 'customer',
				address: {
					house: formData.customerHouse.trim(),
					road: formData.customerRoad.trim(),
					area: formData.customerArea.trim(),
					city: formData.customerCity.trim(),
				},
				...(formData.referralCode && { referralCode: formData.referralCode.trim() }),
			};

			const response = await axiosInstance.post('/api/auth/register', payload);

			if (response.data.success) {
				// Store token and user data
				localStorage.setItem('token', response.data.data.token);
				localStorage.setItem('user', JSON.stringify(response.data.data.user));

				// Notify Navbar of login
				window.dispatchEvent(new Event('userLogin'));

				// Redirect to verify email page with email in state
				navigate('/verify-email', { state: { email: formData.email.toLowerCase().trim() } });
			} else {
				setErrors({ submit: response.data.message || 'Registration failed' });
			}
		} catch (err) {
			setErrors({
				submit: err.response?.data?.message || err.message || 'An error occurred. Please try again.'
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div 
			className="min-h-screen bg-cover bg-center bg-fixed px-4 pb-16 pt-28"
			style={{ backgroundImage: `url(/background.png)` }}
		>
			<div className="mx-auto max-w-2xl">
				<div className="rounded-2xl bg-white/95 backdrop-blur-lg p-8 md:p-10 shadow-2xl border border-gray-200/50">
					{/* Header */}
					<div className="text-center mb-8">
						{/* Logo */}
						<div className="flex justify-center mb-4">
							<Logo />
						</div>
						
						<div className="inline-block px-4 py-1.5 bg-violet-100 rounded-full mb-3">
							<p className="text-xs font-semibold uppercase tracking-wider text-violet-700">
								Join Khudalagse 
							</p>
						</div>
						<h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
							Create Your Account
						</h1>
						<p className="text-gray-600 mt-2">
							Start your journey with delicious meals delivered to your door
						</p>
					</div>

					{/* General Error Message */}
					{errors.submit && (
						<div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg flex items-start gap-3">
							<svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
							</svg>
							<span>{errors.submit}</span>
						</div>
					)}

					{/* Registration Form */}
					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Personal Information Section */}
						<div className="space-y-5">
							<h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
								Personal Information
							</h2>

							{/* Full Name */}
							<div>
								<label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
									Full Name <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									id="name"
									name="name"
									value={formData.name}
									onChange={handleChange}
									onBlur={handleBlur}
									required
									className={`w-full rounded-lg border-2 px-4 py-3 transition-all focus:outline-none ${
										errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-violet-500'
									}`}
									placeholder="Your Name"
									aria-invalid={!!errors.name}
									aria-describedby={errors.name ? 'name-error' : undefined}
								/>
								{errors.name && (
									<p id="name-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
										<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
										</svg>
										{errors.name}
									</p>
								)}
							</div>

							{/* Email and Phone in Grid */}
							<div className="grid md:grid-cols-2 gap-5">
								{/* Email */}
								<div>
									<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
										Email Address <span className="text-red-500">*</span>
									</label>
									<input
										type="email"
										id="email"
										name="email"
										value={formData.email}
										onChange={handleChange}
										onBlur={handleBlur}
										required
										className={`w-full rounded-lg border-2 px-4 py-3 transition-all focus:outline-none ${
											errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-violet-500'
										}`}
										placeholder="your@email.com"
										aria-invalid={!!errors.email}
										aria-describedby={errors.email ? 'email-error' : undefined}
									/>
									{errors.email && (
										<p id="email-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
											<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
												<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
											</svg>
											{errors.email}
										</p>
									)}
								</div>

								{/* Phone */}
								<div>
									<label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
										Phone Number <span className="text-red-500">*</span>
									</label>
									<input
										type="tel"
										id="phone"
										name="phone"
										value={formData.phone}
										onChange={handleChange}
										onBlur={handleBlur}
										required
										className={`w-full rounded-lg border-2 px-4 py-3 transition-all focus:outline-none ${
											errors.phone ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-violet-500'
										}`}
										placeholder="01712345678"
										aria-invalid={!!errors.phone}
										aria-describedby={errors.phone ? 'phone-error' : undefined}
									/>
									{errors.phone && (
										<p id="phone-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
											<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
												<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
											</svg>
											{errors.phone}
										</p>
									)}
								</div>
							</div>

							{/* Password Fields in Grid */}
							<div className="grid md:grid-cols-2 gap-5">
								{/* Password */}
								<div>
									<label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
										Password <span className="text-red-500">*</span>
									</label>
									<div className="relative">
										<input
											type={showPassword ? 'text' : 'password'}
											id="password"
											name="password"
											value={formData.password}
											onChange={handleChange}
											onBlur={handleBlur}
											required
											minLength={6}
											className={`w-full rounded-lg border-2 px-4 py-3 pr-11 transition-all focus:outline-none ${
												errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-violet-500'
											}`}
											placeholder="••••••••"
											aria-invalid={!!errors.password}
											aria-describedby={errors.password ? 'password-error' : 'password-help'}
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
											aria-label={showPassword ? 'Hide password' : 'Show password'}
										>
											{showPassword ? (
												<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
												</svg>
											) : (
												<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
												</svg>
											)}
										</button>
									</div>
									{errors.password ? (
										<p id="password-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
											<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
												<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
											</svg>
											{errors.password}
										</p>
									) : (
										<p id="password-help" className="mt-1.5 text-xs text-gray-500">
											Min. 6 characters with uppercase, lowercase & number
										</p>
									)}
								</div>

								{/* Confirm Password */}
								<div>
									<label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
										Confirm Password <span className="text-red-500">*</span>
									</label>
									<div className="relative">
										<input
											type={showConfirmPassword ? 'text' : 'password'}
											id="confirmPassword"
											name="confirmPassword"
											value={formData.confirmPassword}
											onChange={handleChange}
											onBlur={handleBlur}
											required
											className={`w-full rounded-lg border-2 px-4 py-3 pr-11 transition-all focus:outline-none ${
												errors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-violet-500'
											}`}
											placeholder="••••••••"
											aria-invalid={!!errors.confirmPassword}
											aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
										/>
										<button
											type="button"
											onClick={() => setShowConfirmPassword(!showConfirmPassword)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
											aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
										>
											{showConfirmPassword ? (
												<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
												</svg>
											) : (
												<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
												</svg>
											)}
										</button>
									</div>
									{errors.confirmPassword && (
										<p id="confirm-password-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
											<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
												<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
											</svg>
											{errors.confirmPassword}
										</p>
									)}
								</div>
							</div>
						</div>

						{/* Delivery Address Section */}
						<div className="space-y-5 rounded-xl border-2 border-violet-100 bg-gradient-to-br from-violet-50/50 to-purple-50/30 p-6">
							<h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 border-b border-violet-200 pb-2">
								<svg className="w-5 h-5 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
								</svg>
								Delivery Address
							</h2>

							<div className="grid md:grid-cols-2 gap-5">
								{/* House Number */}
								<div>
									<label htmlFor="customerHouse" className="block text-sm font-medium text-gray-700 mb-2">
										House / Flat Number
									</label>
									<input
										type="text"
										id="customerHouse"
										name="customerHouse"
										value={formData.customerHouse}
										onChange={handleChange}
										className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 transition-all focus:border-violet-500 focus:outline-none bg-white"
										placeholder="House #123, Flat 4B"
									/>
								</div>

								{/* Road / Street */}
								<div>
									<label htmlFor="customerRoad" className="block text-sm font-medium text-gray-700 mb-2">
										Road / Street
									</label>
									<input
										type="text"
										id="customerRoad"
										name="customerRoad"
										value={formData.customerRoad}
										onChange={handleChange}
										className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 transition-all focus:border-violet-500 focus:outline-none bg-white"
										placeholder="Road 12, Block C"
									/>
								</div>
							</div>

							<div className="grid md:grid-cols-2 gap-5">
								{/* Area */}
								<div>
									<label htmlFor="customerArea" className="block text-sm font-medium text-gray-700 mb-2">
										Area / District <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										id="customerArea"
										name="customerArea"
										value={formData.customerArea}
										onChange={handleChange}
										onBlur={handleBlur}
										required
										className={`w-full rounded-lg border-2 px-4 py-3 transition-all focus:outline-none bg-white ${
											errors.customerArea ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-violet-500'
										}`}
										placeholder="Gulshan, Dhanmondi"
										aria-invalid={!!errors.customerArea}
									/>
									{errors.customerArea && (
										<p className="mt-1.5 text-sm text-red-600">{errors.customerArea}</p>
									)}
								</div>

								{/* City */}
								<div>
								<label
									htmlFor="customerCity"
									className="block text-sm font-medium text-gray-700 mb-2"
								>
									City <span className="text-red-500">*</span>
								</label>

								<select
									id="customerCity"
									name="customerCity"
									value={formData.customerCity}
									onChange={handleChange}
									onBlur={handleBlur}
									required
									className={`w-full rounded-lg border-2 px-4 py-3 transition-all focus:outline-none bg-white ${
									errors.customerCity
										? "border-red-300 focus:border-red-500"
										: "border-gray-200 focus:border-violet-500"
									}`}
									aria-invalid={!!errors.customerCity}
								>
									<option value="">Select a city</option>
									<option value="Dhaka">Dhaka</option>
									<option value="Chattogram">Chattogram</option>
									<option value="Sylhet">Sylhet</option>
								</select>

								{errors.customerCity && (
									<p className="mt-1.5 text-sm text-red-600">
									{errors.customerCity}
									</p>
								)}
								</div>
							</div>

							{/* Referral Code */}
							<div>
								<label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 mb-2">
									Referral Code (Optional)
								</label>
								<div className="relative">
									<input
										type="text"
										id="referralCode"
										name="referralCode"
										value={formData.referralCode}
										onChange={handleChange}
										className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 pr-11 transition-all focus:border-violet-500 focus:outline-none bg-white"
										placeholder="FRIEND2024"
									/>
									<svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
									</svg>
								</div>
								<p className="mt-1.5 text-xs text-gray-600 flex items-center gap-1">
									<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
									</svg>
									Get special rewards on your first order
								</p>
							</div>
						</div>

						{/* Submit Button */}
						<button
							type="submit"
							disabled={loading}
							className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:from-violet-700 hover:to-purple-700 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-violet-300"
						>
							{loading ? (
								<span className="flex items-center justify-center gap-2">
									<svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
									</svg>
									Creating Your Account...
								</span>
							) : (
								'Create Account'
							)}
						</button>

						{/* Terms Notice */}
						<p className="text-xs text-center text-gray-500">
							By creating an account, you agree to our{' '}
							<a href="/terms" className="text-violet-600 hover:text-violet-700 underline">
								Terms of Service
							</a>{' '}
							and{' '}
							<a href="/privacy" className="text-violet-600 hover:text-violet-700 underline">
								Privacy Policy
							</a>
						</p>
					</form>

					{/* Login Link */}
					<div className="mt-8 pt-6 border-t border-gray-200 text-center">
						<p className="text-gray-600">
							Already have an account?{' '}
							<a
								href="/login"
								className="font-semibold text-violet-700 hover:text-violet-800 transition-colors"
							>
								Log in here
							</a>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}