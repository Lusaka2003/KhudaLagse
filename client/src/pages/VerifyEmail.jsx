import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../api/axios';
import Logo from '../components/Logo';


export default function VerifyEmail() {
	const navigate = useNavigate();
	const location = useLocation();
	const emailFromState = location.state?.email || '';
	
	const [email, setEmail] = useState(emailFromState);
	const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [loading, setLoading] = useState(false);
	const [resendLoading, setResendLoading] = useState(false);

	// Handle input change for each digit
	const handleCodeChange = (index, value) => {
		// Only allow numbers
		if (value && !/^\d+$/.test(value)) return;

		const newCode = [...verificationCode];
		newCode[index] = value.slice(-1); // Only take last character
		setVerificationCode(newCode);
		setError('');
		setSuccess('');

		// Auto-focus next input
		if (value && index < 5) {
			const nextInput = document.getElementById(`code-${index + 1}`);
			if (nextInput) nextInput.focus();
		}
	};

	// Handle backspace
	const handleKeyDown = (index, e) => {
		if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
			const prevInput = document.getElementById(`code-${index - 1}`);
			if (prevInput) prevInput.focus();
		}
	};

	// Handle paste
	const handlePaste = (e) => {
		e.preventDefault();
		const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
		const newCode = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
		setVerificationCode(newCode);
		
		// Focus on the next empty input or last input
		const nextEmptyIndex = newCode.findIndex(digit => !digit);
		const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
		const input = document.getElementById(`code-${focusIndex}`);
		if (input) input.focus();
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setSuccess('');
		setLoading(true);

		const code = verificationCode.join('');

		if (!email) {
			setError('Please enter your email address');
			setLoading(false);
			return;
		}

		if (code.length !== 6) {
			setError('Please enter all 6 digits');
			setLoading(false);
			return;
		}

		try {
			const response = await axiosInstance.post('/api/auth/verify-email', {
				email: email,
				code: code,
			});

			if (response.data.success) {
				setSuccess('Email verified successfully! Redirecting...');
				
				// Update user in localStorage if exists
				const user = JSON.parse(localStorage.getItem('user'));
				if (user) {
					user.isEmailVerified = true;
					localStorage.setItem('user', JSON.stringify(user));
					window.dispatchEvent(new Event('userLogin'));
				}

				// Redirect after 2 seconds
				setTimeout(() => {
					if (user) {
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
						navigate('/login');
					}
				}, 2000);
			} else {
				setError(response.data.message || 'Verification failed');
			}
		} catch (err) {
			setError(
				err.response?.data?.message ||
				err.message ||
				'An error occurred during verification'
			);
		} finally {
			setLoading(false);
		}
	};

	const handleResendCode = async () => {
		if (!email) {
			setError('Please enter your email address first');
			return;
		}

		setError('');
		setSuccess('');
		setResendLoading(true);

		try {
			const response = await axiosInstance.post('/api/auth/resend-verification', {
				email: email,
			});

			if (response.data.success) {
				setSuccess('Verification code sent! Please check your email.');
				setVerificationCode(['', '', '', '', '', '']);
				document.getElementById('code-0')?.focus();
			} else {
				setError(response.data.message || 'Failed to resend code');
			}
		} catch (err) {
			setError(
				err.response?.data?.message ||
				err.message ||
				'Failed to resend verification code'
			);
		} finally {
			setResendLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-violet-50 px-4 pb-16 pt-28">
			<div className="mx-auto max-w-md">
				<div className="rounded-2xl bg-white p-10 shadow-xl ring-1 ring-gray-100">
					{/* Header */}
					<div className="text-center mb-8">
						<div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mx-auto mb-4">
							<Logo/>
						</div>
						<h1 className="text-3xl font-bold text-gray-900 mb-2">
							Verify Your Email
						</h1>
						<p className="text-gray-600">
							Enter the 6-digit code we sent to your email
						</p>
					</div>

					{/* Email Input (if not provided) */}
					{!emailFromState && (
						<div className="mb-6">
							<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
								Email Address
							</label>
							<input
								type="email"
								id="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 transition-all focus:border-violet-500 focus:outline-none"
								placeholder="your@email.com"
								required
							/>
						</div>
					)}

					{emailFromState && (
						<div className="mb-6 rounded-lg bg-violet-50 border border-violet-200 p-4">
							<p className="text-sm text-gray-600 text-center">
								Code sent to
							</p>
							<p className="font-semibold text-violet-700 text-center mt-1">
								{email}
							</p>
						</div>
					)}

					{/* Success Message */}
					{success && (
						<div className="mb-6 p-4 bg-violet-50 border-2 border-violet-200 text-violet-700 rounded-lg text-sm flex items-center">
							<svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
							</svg>
							{success}
						</div>
					)}

					{/* Error Message */}
					{error && (
						<div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg text-sm flex items-center">
							<svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
							</svg>
							{error}
						</div>
					)}

					{/* Verification Code Form */}
					<form onSubmit={handleSubmit} className="space-y-8">
						{/* Code Input Boxes */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-3 text-center">
								Verification Code
							</label>
							<div className="flex gap-2 justify-center" onPaste={handlePaste}>
								{verificationCode.map((digit, index) => (
									<input
										key={index}
										id={`code-${index}`}
										type="text"
										inputMode="numeric"
										maxLength={1}
										value={digit}
										onChange={(e) => handleCodeChange(index, e.target.value)}
										onKeyDown={(e) => handleKeyDown(index, e)}
										className="w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none transition-all"
										required
									/>
								))}
							</div>
							<p className="mt-3 text-xs text-gray-500 text-center">
								Enter the 6-digit code from your email
							</p>
						</div>

						{/* Submit Button */}
						<button
							type="submit"
							disabled={loading || verificationCode.some(d => !d)}
							className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-violet-700 py-3.5 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
						>
							{loading ? (
								<span className="flex items-center justify-center">
									<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									Verifying...
								</span>
							) : (
								'Verify Email'
							)}
						</button>
					</form>

					{/* Resend Code */}
					<div className="mt-8 pt-6 border-t border-gray-200">
						<div className="text-center">
							<p className="text-sm text-gray-600 mb-3">
								Didn't receive the code?
							</p>
							<button
								onClick={handleResendCode}
								disabled={resendLoading}
								className="text-violet-600 hover:text-violet-700 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{resendLoading ? (
									<span className="flex items-center justify-center">
										<svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Sending...
									</span>
								) : (
									'Resend Code'
								)}
							</button>
						</div>
						<p className="text-xs text-gray-500 text-center mt-4">
							Code expires in 24 hours
						</p>
					</div>
				</div>

				{/* Help Text */}
				<div className="mt-6 text-center">
					<p className="text-sm text-gray-600">
						Need help?{' '}
						<a href="/support" className="text-violet-600 hover:text-violet-700 font-medium">
							Contact Support
						</a>
					</p>
				</div>
			</div>
		</div>
	);
}