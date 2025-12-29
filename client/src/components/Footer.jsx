import { Link } from 'react-router-dom';

const footerLinks = [
	{ label: 'About', to: '/about' },
	{ label: 'Restaurants', to: '/restaurants' },
	{ label: 'Pricing', to: '/about' },
];

export default function Footer() {
	return (
		<footer className="border-t border-slate-200 bg-white">
			<div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 lg:flex-row lg:items-center lg:justify-between lg:px-8">
				<div>
					<h3 className="text-xl font-semibold text-slate-900">
						Ready for dinner to just arrive?
					</h3>
					<p className="mt-2 text-sm text-slate-600">
						Start your subscription and get your first delivery this week.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-700">
					{footerLinks.map((link) => (
						<Link
							key={link.to}
							to={link.to}
							className="transition-colors duration-200 hover:text-violet-700"
						>
							{link.label}
						</Link>
					))}
				</div>
				<div className="flex flex-wrap gap-3">
					<Link
						to="/register"
						className="rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-violet-700"
					>
						Start subscription
					</Link>
					<Link
						to="/restaurants"
						className="rounded-lg border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-900 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50"
					>
						Browse kitchens
					</Link>
				</div>
			</div>
		</footer>
	);
}

