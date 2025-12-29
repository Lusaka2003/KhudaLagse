export default function About() {
	return (
		<section 
			className="min-h-screen bg-cover bg-center bg-fixed px-4 pb-24 pt-28"
			style={{ backgroundImage: `url(/background.png)` }}
		>
			<div className="mx-auto max-w-5xl">
				<div className="mb-16 space-y-4 text-center">
					<div className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-gray-200/50 inline-block">
						<p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
							Our ethos
						</p>
						<h1 className="text-4xl font-semibold tracking-tight md:text-5xl mt-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
							We make premium food subscriptions feel effortless.
						</h1>
						<p className="text-lg text-gray-600 md:text-xl mt-4">
							Khudalagse blends culinary rigor with a frictionless
							delivery system so you can eat beautifully—on repeat.
						</p>
					</div>
				</div>

				<div className="grid gap-8 md:grid-cols-2">
					<div className="rounded-2xl border border-gray-200/50 bg-white/95 backdrop-blur-lg p-8 shadow-2xl">
						<h2 className="text-2xl font-semibold text-gray-900">
							Our mission
						</h2>
						<p className="mt-4 text-gray-700 leading-relaxed">
							Great food should be predictable, never boring. We
							curate rotating menus, source responsibly, and
							deliver with precision so your weeknight dinners and
							weekend gatherings are handled with the same care a
							chef would give.
						</p>
					</div>

					<div className="rounded-2xl border border-gray-200/50 bg-white/95 backdrop-blur-lg p-8 shadow-2xl">
						<h2 className="text-2xl font-semibold text-gray-900">
							What we do
						</h2>
						<p className="mt-4 text-gray-700 leading-relaxed">
							We partner with vetted kitchens to craft
							nutritionally balanced menus, then pair them with
							flexible delivery slots, live tracking, and seamless
							pausing. Every touchpoint is intentional, from
							packaging to plating.
						</p>
						<ul className="mt-6 space-y-3 text-sm text-gray-700">
							<li className="flex items-start gap-2">
								<span className="mt-1 h-2 w-2 rounded-full bg-violet-600" />
								Curated, chef-driven recipes
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1 h-2 w-2 rounded-full bg-violet-600" />
								Precision delivery windows with proactive
								updates
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1 h-2 w-2 rounded-full bg-violet-600" />
								Balanced macros
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1 h-2 w-2 rounded-full bg-violet-600" />
								Support that responds in minutes, not hours
							</li>
						</ul>
					</div>
				</div>

				<div className="mt-10 rounded-2xl border border-violet-200/50 bg-violet-50/95 backdrop-blur-lg p-8 shadow-2xl">
					<h2 className="text-2xl font-semibold text-gray-900">
						Why Khudalagse
					</h2>
					<div className="mt-6 grid gap-4 md:grid-cols-2">
						{[
							{
								title: 'Ingredient integrity',
								copy: 'Sourced from trusted restaurants and carefully selected meals to provide nutrition and taste.',
							},
							{
								title: 'Timing that works',
								copy: 'You set delivery times, pause and cancel with two taps.',
							},
							{
								title: 'Minimalist experience',
								copy: 'No clutter, no gimmicks—every screen prioritizes clarity and action.',
							},
							{
								title: 'Sustainability-first',
								copy: 'Recyclable, insulated packaging engineered to cut waste.',
							},
						].map((item) => (
							<div
								key={item.title}
								className="rounded-xl bg-white/95 backdrop-blur-sm p-5 shadow-lg border border-gray-200/50"
							>
								<div className="text-xs font-semibold text-violet-600">
									{item.title}
								</div>
								<p className="mt-2 text-sm text-gray-700 leading-relaxed">
									{item.copy}
								</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}