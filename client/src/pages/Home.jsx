import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';


export default function Home() {
	const navigate = useNavigate();
	const [reviews, setReviews] = useState([]);

	useEffect(() => {
		const fetchTopReviews = async () => {
			try {
				const res = await axiosInstance.get('/api/reviews/top');
				setReviews(res.data);
			} catch (err) {
				console.error("Failed to fetch top reviews", err);
			}
		};
		fetchTopReviews();
	}, []);

	return (
		<main 
			className="min-h-screen bg-cover bg-center bg-fixed text-gray-900"
			style={{ backgroundImage: `url(/background.png)` }}
		>
			{/* Hero */}
			<section className="relative overflow-hidden">
				<div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 pb-24 pt-28 md:grid-cols-2 md:items-center lg:px-8">
					{/* Left side - Text content with transparent box */}
					<div className="space-y-8">
						<div className="bg-gray-100/80 rounded-2xl p-8 shadow-lg">
							<div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-700 mb-6">
								Fresh meals, on repeat
							</div>
							<h1 className="text-4xl leading-tight md:text-5xl font-semibold tracking-tight text-gray-700 drop-shadow-lg mb-6">
								Leave your Meal Planning to Us.
							</h1>
							<p className="max-w-2xl text-base text-gray-700 drop-shadow-md mb-6">
								Khudalagse is the modern food subscription that pairs
								seasonal menus with flexible deliveries. Skip the
								decision fatigue—just great food, fast.
							</p>
							<div className="flex flex-wrap gap-4 mb-6">
								<button
									onClick={() => navigate('/restaurants')}
									className="rounded-lg bg-violet-500 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:bg-violet-700"
								>
									Order now
								</button>
								<button
									onClick={() => navigate('/about')}
									className="rounded-lg border border-white bg-gray-500 backdrop-blur-sm px-8 py-3 text-sm font-semibold text-white transition hover:bg-gray-600"
								>
									View plans
								</button>
							</div>
							<div className="flex flex-wrap gap-6 text-sm text-gray-700">
								<div className="flex items-center gap-2">
									<span className="h-2 w-2 rounded-full bg-violet-400" />
									No delivery fees on subscriptions
								</div>
								
							</div>
						</div>
					</div>

					{/* Right side - Image */}
					<div className="relative flex items-center justify-center rounded-2xl bg-gray-200/90 shadow-xl ring-1 ring-white/20 overflow-hidden min-h-[450px]">
					<img
						src="/Mascot4.jpg"
						alt="Khudalagse Mascot"
						className="w-full h-full object-cover transform scale-110 border-4 border-white shadow-[0_0_20px_rgba(255,255,255,0.5)]"
						/>

					</div>
					
				</div>
			</section>

		</main>
	);
}