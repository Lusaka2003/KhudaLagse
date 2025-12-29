import { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { useNavigate } from 'react-router-dom';

const FALLBACK_IMAGE =
	'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800';

const CartPage = () => {
	const navigate = useNavigate();
	const [user, setUser] = useState(null);
	const [cart, setCart] = useState(() => {
		const saved = localStorage.getItem('cart');
		return saved ? JSON.parse(saved) : [];
	});
	const [loading, setLoading] = useState(false);
	const [walletBalance, setWalletBalance] = useState(null);
	const [walletLoading, setWalletLoading] = useState(true);

	// Check user role and redirect if not customer
	useEffect(() => {
		const userData = localStorage.getItem('user');
		if (userData) {
			try {
				const parsedUser = JSON.parse(userData);
				setUser(parsedUser);
				if (parsedUser.role !== 'customer') {
					navigate('/dashboard');
				}
			} catch (err) {
				console.error('Error parsing user data:', err);
				navigate('/login');
			}
		} else {
			navigate('/login');
		}
	}, [navigate]);

	useEffect(() => {
		localStorage.setItem('cart', JSON.stringify(cart));
	}, [cart]);

	// Fetch wallet balance
	useEffect(() => {
		const fetchWallet = async () => {
			try {
				const { data } = await axiosInstance.get('/api/wallet');
				setWalletBalance(data.walletBalance || 0);
			} catch (err) {
				console.error('Failed to fetch wallet:', err);
			} finally {
				setWalletLoading(false);
			}
		};
		fetchWallet();
	}, []);

	const removeItem = (index) =>
		setCart((prev) => prev.filter((_, i) => i !== index));
	const clearCart = () => setCart([]);

	const updateQuantity = (index, quantity) => {
		if (quantity < 1) return;
		setCart((prev) =>
			prev.map((item, i) => (i === index ? { ...item, quantity } : item))
		);
	};

	// Update delivery hour
	const toggleDeliveryHour = (index) => {
		setCart((prev) =>
			prev.map((item, i) => {
				if (i !== index) return item;

				// Default hour if undefined
				const currentHour =
					item.deliveryHour ?? (item.mealType === 'lunch' ? 13 : 20);

				// Toggle lunch: 13 <-> 14, dinner: 20 <-> 21
				const newHour =
					item.mealType === 'lunch'
						? currentHour === 13
							? 14
							: 13
						: currentHour === 20
						? 21
						: 20;

				return { ...item, deliveryHour: newHour };
			})
		);
	};

	const totalPrice = cart.reduce(
		(sum, item) => sum + (item.price || 0) * (item.quantity || 1),
		0
	);

	const handleCheckout = async () => {
		if (cart.length === 0) return;

		const user = JSON.parse(localStorage.getItem('user'));
		if (!user || user.role !== 'customer') {
			alert('You must be logged in as a customer to place an order.');
			return;
		}

		// Validate wallet balance
		if (walletBalance !== null && walletBalance < totalPrice) {
			const insufficient = totalPrice - walletBalance;
			alert(
				`Insufficient wallet balance. You need ${insufficient.toFixed(
					2
				)} BDT more.\n` +
					`Current balance: ${walletBalance.toFixed(2)} BDT\n` +
					`Total: ${totalPrice.toFixed(2)} BDT\n\n` +
					`Please recharge your wallet from the dashboard.`
			);
			return;
		}

		if (!window.confirm(`Place order for ${totalPrice} BDT?`)) return;

		try {
			setLoading(true);

			const orderPromises = [];
			const errors = [];

			for (const item of cart) {
				// Validate required fields
				if (!item._id) {
					errors.push(
						`Item "${item.name || 'Unknown'}" is missing ID`
					);
					continue;
				}

				const restaurantId = item.restaurant || item.restaurantId;
				if (!restaurantId) {
					errors.push(
						`Item "${
							item.name || 'Unknown'
						}" is missing restaurant ID`
					);
					continue;
				}

				if (!item.price && item.price !== 0) {
					errors.push(
						`Item "${item.name || 'Unknown'}" is missing price`
					);
					continue;
				}

				// Get date - support both 'date' and 'deliveryDate' for backward compatibility
				const itemDate = item.date || item.deliveryDate;
				if (!itemDate) {
					errors.push(
						`Item "${
							item.name || 'Unknown'
						}" is missing delivery date`
					);
					continue;
				}

				// Fixed date + selected delivery hour
				const deliveryDateTime = new Date(itemDate);
				if (isNaN(deliveryDateTime.getTime())) {
					errors.push(
						`Item "${item.name || 'Unknown'}" has invalid date`
					);
					continue;
				}

				deliveryDateTime.setHours(
					item.deliveryHour ?? (item.mealType === 'lunch' ? 13 : 20),
					0,
					0,
					0
				);

				const orderData = {
					restaurantId,
					items: [
						{
							itemId: item._id,
							quantity: item.quantity || 1,
							price: item.price,
							mealType: item.mealType || 'lunch',
							day: item.day || null,
						},
					],
					total: (item.price || 0) * (item.quantity || 1),
					deliveryDateTime: deliveryDateTime.toISOString(),
					paymentMethod: 'wallet',
				};

				orderPromises.push(
					axiosInstance
						.post('/api/orders', orderData)
						.catch((err) => {
							errors.push(
								`Failed to order "${item.name || 'Unknown'}": ${
									err.response?.data?.message || err.message
								}`
							);
							throw err;
						})
				);
			}

			if (errors.length > 0 && orderPromises.length === 0) {
				alert(`Cannot place orders:\n${errors.join('\n')}`);
				return;
			}

			// Execute all orders
			const results = await Promise.allSettled(orderPromises);

			const successful = results.filter(
				(r) => r.status === 'fulfilled'
			).length;
			const failed = results.filter(
				(r) => r.status === 'rejected'
			).length;

			// Refresh wallet balance after checkout
			const { data } = await axiosInstance.get('/api/wallet');
			setWalletBalance(data.walletBalance || 0);

			if (successful > 0) {
				if (failed > 0) {
					const errorMessages =
						errors.length > 0
							? errors.join('\n')
							: 'Some orders failed';
					alert(
						`${successful} order(s) placed successfully. ${failed} order(s) failed.\n\n${errorMessages}`
					);
				} else {
					alert(`${successful} order(s) placed successfully!`);
					clearCart();
					// Notify other components
					window.dispatchEvent(new Event('cartUpdated'));
				}
			} else {
				const errorMessages =
					errors.length > 0 ? errors.join('\n') : 'All orders failed';
				alert(`Failed to place orders:\n\n${errorMessages}`);
			}
		} catch (err) {
			console.error('Checkout failed:', err.response?.data || err);
			const errorMsg =
				err.response?.data?.message ||
				'Failed to place one or more orders. Please try again.';
			alert(errorMsg);
		} finally {
			setLoading(false);
		}
	};

	if (cart.length === 0) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 pt-24">
				<h2 className="text-3xl font-bold text-gray-900 mb-4">
					Your Cart is Empty
				</h2>
				<p className="text-gray-600">
					Add some delicious meals to your cart!
				</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 pt-24 px-4">
			<div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
				<h2 className="text-3xl font-bold text-gray-900 mb-6">
					Your Cart
				</h2>

				<div className="space-y-4">
					{cart.map((item, index) => {
						const hour =
							item.deliveryHour ??
							(item.mealType === 'lunch' ? 13 : 20);
						const formattedTime = `${hour}:00`;

						return (
							<div
								key={index}
								className="flex flex-col md:flex-row items-center justify-between border-b pb-4 gap-4"
							>
								<div className="flex items-center gap-4">
									<img
										src={item.imageUrl || FALLBACK_IMAGE}
										alt={item.name}
										className="w-24 h-20 object-cover rounded-lg"
									/>
									<div className="flex flex-col">
										<h3 className="font-semibold text-gray-900">
											{item.name}
										</h3>
										<p className="text-gray-600 text-sm">
											{item.description}
										</p>

										<p className="text-gray-500 text-sm mt-1">
											<span className="font-medium">
												Day:
											</span>{' '}
											{item.day || 'N/A'} &nbsp;|&nbsp;
											<span className="font-medium">
												Date:
											</span>{' '}
											{item.date
												? new Date(
														item.date
												  ).toLocaleDateString()
												: 'N/A'}{' '}
											&nbsp;|&nbsp;
											<span className="font-medium">
												Meal Type:
											</span>{' '}
											{item.mealType || 'N/A'}
										</p>

										<div className="text-gray-500 text-sm mt-1 flex items-center gap-2">
											<span className="font-medium">
												Delivery Time:
											</span>
											<button
												onClick={() =>
													toggleDeliveryHour(index)
												}
												className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
											>
												{formattedTime}
											</button>
											<span className="text-xs text-gray-400">
												(click to toggle)
											</span>
										</div>

										<div className="mt-2 flex items-center gap-2">
											<button
												onClick={() =>
													updateQuantity(
														index,
														(item.quantity || 1) - 1
													)
												}
												className="bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
											>
												-
											</button>
											<span className="px-2">
												{item.quantity || 1}
											</span>
											<button
												onClick={() =>
													updateQuantity(
														index,
														(item.quantity || 1) + 1
													)
												}
												className="bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
											>
												+
											</button>
										</div>
									</div>
								</div>
								<div className="flex flex-col items-end">
									<p className="text-lg font-bold text-violet-700">
										{(item.price || 0) *
											(item.quantity || 1)}{' '}
										BDT
									</p>
									<button
										onClick={() => removeItem(index)}
										className="text-red-500 text-sm mt-1 hover:underline"
									>
										Remove
									</button>
								</div>
							</div>
						);
					})}
				</div>

				<div className="mt-6 space-y-4">
					{/* Wallet Balance Display */}
					{!walletLoading && (
						<div className="bg-gray-50 rounded-lg p-4 border">
							<div className="flex justify-between items-center">
								<span className="text-gray-700 font-medium">
									Wallet Balance:
								</span>
								<span
									className={`text-lg font-bold ${
										walletBalance >= totalPrice
											? 'text-green-600'
											: 'text-red-600'
									}`}
								>
									{walletBalance.toFixed(2)} BDT
								</span>
							</div>
							{walletBalance < totalPrice && (
								<p className="text-sm text-red-600 mt-2">
									⚠️ Insufficient balance. You need{' '}
									{(totalPrice - walletBalance).toFixed(2)}{' '}
									BDT more.
								</p>
							)}
						</div>
					)}

					<div className="flex flex-col md:flex-row justify-between items-center gap-4">
						<button
							onClick={clearCart}
							className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-semibold"
						>
							Clear Cart
						</button>
						<div className="text-center">
							<p className="text-xl font-bold text-gray-900">
								Total: {totalPrice.toFixed(2)} BDT
							</p>
							{walletBalance !== null && (
								<p className="text-sm text-gray-600">
									After payment:{' '}
									{(walletBalance - totalPrice).toFixed(2)}{' '}
									BDT
								</p>
							)}
						</div>
						<button
							onClick={handleCheckout}
							disabled={
								loading ||
								(walletBalance !== null &&
									walletBalance < totalPrice)
							}
							className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? 'Placing Order...' : 'Checkout'}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CartPage;
