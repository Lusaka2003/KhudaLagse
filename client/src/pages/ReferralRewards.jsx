import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';

export default function ReferralRewards() {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [data, setData] = useState(null);
	const [code, setCode] = useState('');
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		const userData = localStorage.getItem('user');
		if (!userData) {
			navigate('/login');
			return;
		}
		try {
			const parsed = JSON.parse(userData);
			if (parsed.role !== 'customer') {
				navigate('/');
				return;
			}
		} catch {
			navigate('/login');
			return;
		}

		const load = async () => {
			try {
				const res = await axiosInstance.get('/api/referrals/me');
				setData(res.data.data);
			} catch (err) {
				setError(err.response?.data?.message || err.message || 'Failed to load referral data');
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [navigate]);

	const applyCode = async () => {
		setSubmitting(true);
		setError('');
		try {
			await axiosInstance.post('/api/referrals/apply', { code });
			const res = await axiosInstance.get('/api/referrals/me');
			setData(res.data.data);
			setCode('');
		} catch (err) {
			setError(err.response?.data?.message || err.message || 'Failed to apply code');
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="mx-auto max-w-4xl px-4 py-10">
				<div className="rounded-xl border border-gray-100 bg-white p-6">Loading...</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-4xl px-4 py-8">
			<div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
				<h1 className="text-3xl font-semibold text-gray-900">Referrals & Rewards</h1>
				<p className="mt-1 text-gray-600">Share your code to earn wallet discounts.</p>
				{error ? (
					<div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
						{error}
					</div>
				) : null}
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
					<div className="text-sm font-semibold text-gray-600">Your referral code</div>
					<div className="mt-2 flex items-center justify-between gap-3">
						<div className="rounded-lg bg-gray-50 px-4 py-3 font-mono text-lg font-semibold text-gray-900">
							{data?.referralCode || '—'}
						</div>
						<button
							onClick={() => {
								if (data?.referralCode) navigator.clipboard?.writeText(data.referralCode);
							}}
							className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:border-violet-200 hover:bg-violet-50"
						>
							Copy
						</button>
					</div>
					<div className="mt-4 grid grid-cols-3 gap-3">
						<div className="rounded-lg bg-gray-50 p-4">
							<div className="text-xs font-semibold text-gray-600">Total</div>
							<div className="mt-1 text-xl font-semibold text-gray-900">{data?.totalReferrals ?? 0}</div>
						</div>
						<div className="rounded-lg bg-gray-50 p-4">
							<div className="text-xs font-semibold text-gray-600">Rewarded</div>
							<div className="mt-1 text-xl font-semibold text-gray-900">
								{data?.rewardedReferrals ?? 0}
							</div>
						</div>
						<div className="rounded-lg bg-gray-50 p-4">
							<div className="text-xs font-semibold text-gray-600">Wallet</div>
							<div className="mt-1 text-xl font-semibold text-gray-900">
								{data?.walletBalance ?? 0}
							</div>
						</div>
					</div>
				</div>

				<div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
					<div className="text-sm font-semibold text-gray-600">Apply a referral code</div>
					<div className="mt-3 flex gap-2">
						<input
							value={code}
							onChange={(e) => setCode(e.target.value)}
							placeholder="Enter code"
							className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-300"
						/>
						<button
							disabled={submitting || !code.trim()}
							onClick={applyCode}
							className="rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
						>
							Apply
						</button>
					</div>
					<div className="mt-4 text-sm text-gray-600">
						You can apply a code once. Earn 5% rewards on every order, and help your referrer earn 10% too!
					</div>
				</div>
			</div>
		</div>
	);
}

