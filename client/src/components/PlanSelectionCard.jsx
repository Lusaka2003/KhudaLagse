export default function PlanSelectionCard({ plan, onSelect }) {
	return (
		<div
			className={`flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
				plan.featured ? 'ring-2 ring-violet-200' : ''
			}`}
		>
			<div className="mb-6 flex items-center justify-between">
				<h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
				{plan.featured && (
					<span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
						Most popular
					</span>
				)}
			</div>
			<div className="mb-2 text-3xl font-semibold text-slate-900">
				{plan.price}
			</div>
			<p className="mb-6 text-sm text-slate-600">{plan.desc}</p>
			<ul className="mb-8 space-y-3 text-sm text-slate-700">
				{plan.features.map((feature) => (
					<li key={feature} className="flex items-start gap-2">
						<span className="mt-1 h-2 w-2 rounded-full bg-violet-600" />
						<span>{feature}</span>
					</li>
				))}
			</ul>
			<button
				onClick={onSelect}
				className="mt-auto rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-violet-700"
			>
				Start plan
			</button>
		</div>
	);
}

