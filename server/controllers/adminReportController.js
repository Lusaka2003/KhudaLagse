import Order from '../models/Order.js';
import Payment from '../models/Payment.js';

const startOfDay = (d) => {
	const date = new Date(d);
	date.setHours(0, 0, 0, 0);
	return date;
};

export const getTopMeals = async (req, res) => {
	try {
		const limit = Number(req.query.limit || 10);
		const results = await Order.aggregate([
			{ $unwind: '$items' },
			{
				$group: {
					_id: '$items.itemId',
					quantity: { $sum: '$items.quantity' },
					revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
				},
			},
			{
				$lookup: {
					from: 'menuitems',
					localField: '_id',
					foreignField: '_id',
					as: 'meal',
				},
			},
			{
				$unwind: {
					path: '$meal',
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$project: {
					_id: 1,
					quantity: 1,
					revenue: 1,
					name: { $ifNull: ['$meal.name', 'Unknown Meal'] },
				},
			},
			{ $sort: { quantity: -1 } },
			{ $limit: limit },
		]);

		return res.status(200).json({ success: true, data: results });
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const getOrdersPerDay = async (req, res) => {
	try {
		const days = Number(req.query.days || 30);
		const from = startOfDay(new Date(Date.now() - days * 24 * 60 * 60 * 1000));

		const results = await Order.aggregate([
			{ $match: { createdAt: { $gte: from } } },
			{
				$group: {
					_id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
					count: { $sum: 1 },
				},
			},
			{ $sort: { _id: 1 } },
		]);

		return res.status(200).json({ success: true, data: results });
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const getRevenuePerDay = async (req, res) => {
	try {
		const days = Number(req.query.days || 30);
		const from = startOfDay(new Date(Date.now() - days * 24 * 60 * 60 * 1000));

		const results = await Payment.aggregate([
			{ $match: { type: 'order_payment', status: 'success', createdAt: { $gte: from } } },
			{
				$group: {
					_id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
					revenue: { $sum: '$amount' },
				},
			},
			{ $sort: { _id: 1 } },
		]);

		return res.status(200).json({ success: true, data: results });
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

