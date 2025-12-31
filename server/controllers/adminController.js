import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import Order from '../models/Order.js';
import Delivery from '../models/Delivery.js';
import Subscription from '../models/Subscription.js';
import { MenuItem } from '../models/MenuItem.js';
import Payment from '../models/Payment.js';
import Referral from '../models/Referral.js';
import Review from '../models/Reviews.js';

const generateToken = (id) => {
	if (!process.env.JWT_SECRET) {
		throw new Error('JWT_SECRET is not configured.');
	}
	return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

export const bootstrapAdmin = async (req, res) => {
	try {
		if (process.env.SUPER_ADMIN_EMAIL && process.env.SUPER_ADMIN_PASSWORD) {
			return res.status(403).json({
				success: false,
				message: 'Super admin is configured. Bootstrap is disabled.',
			});
		}

		if (!process.env.ADMIN_BOOTSTRAP_SECRET) {
			return res.status(403).json({
				success: false,
				message: 'Admin bootstrap is disabled.',
			});
		}

		const providedSecret = req.headers['x-admin-bootstrap-secret'];
		if (!providedSecret || providedSecret !== process.env.ADMIN_BOOTSTRAP_SECRET) {
			return res.status(403).json({ success: false, message: 'Access denied.' });
		}

		const existingAdmin = await User.exists({ role: 'admin' });
		if (existingAdmin) {
			return res.status(409).json({
				success: false,
				message: 'Admin already exists.',
			});
		}

		const { name, email, phone, password } = req.body;
		if (!name || !email || !phone || !password) {
			return res.status(400).json({
				success: false,
				message: 'Missing required fields.',
			});
		}

		const userExists = await User.exists({ email });
		if (userExists) {
			return res.status(409).json({ success: false, message: 'Email already in use.' });
		}

		const admin = await User.create({
			name,
			email,
			phone,
			password,
			role: 'admin',
			isSuperAdmin: true,
		});

		const token = generateToken(admin._id);

		return res.status(201).json({
			success: true,
			data: {
				user: {
					id: admin._id,
					name: admin.name,
					email: admin.email,
					phone: admin.phone,
					role: admin.role,
					isSuperAdmin: admin.isSuperAdmin,
				},
				token,
			},
		});
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const getDashboard = async (req, res) => {
	try {
		const [userCount, orderCount, deliveryCount, subscriptionCount, mealCount] =
			await Promise.all([
				User.countDocuments(),
				Order.countDocuments(),
				Delivery.countDocuments(),
				Subscription.countDocuments(),
				MenuItem.countDocuments(),
			]);

		const revenueAgg = await Payment.aggregate([
			{ $match: { type: 'order_payment', status: 'success' } },
			{ $group: { _id: null, total: { $sum: '$amount' } } },
		]);

		const revenue = revenueAgg[0]?.total || 0;

		const pendingReferrals = await Referral.countDocuments({ status: 'pending' });

		return res.status(200).json({
			success: true,
			data: {
				userCount,
				orderCount,
				deliveryCount,
				subscriptionCount,
				mealCount,
				revenue,
				pendingReferrals,
			},
		});
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const listUsers = async (req, res) => {
	try {
		const { role, q, isActive, page = 1, limit = 20 } = req.query;
		const query = {};

		if (role) query.role = role;
		if (isActive != null) query.isActive = isActive === 'true';
		if (q) {
			query.$or = [
				{ name: { $regex: q, $options: 'i' } },
				{ email: { $regex: q, $options: 'i' } },
				{ phone: { $regex: q, $options: 'i' } },
			];
		}

		const skip = (Number(page) - 1) * Number(limit);
		const [items, total] = await Promise.all([
			User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
			User.countDocuments(query),
		]);

		return res.status(200).json({ success: true, data: { items, total } });
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const updateUser = async (req, res) => {
	try {
		const { id } = req.params;
		const { role, isActive } = req.body;

		const target = await User.findById(id).select('role isSuperAdmin');
		if (!target) {
			return res.status(404).json({ success: false, message: 'User not found.' });
		}

		if (target.isSuperAdmin === true && isActive != null) {
			return res.status(403).json({ success: false, message: 'Cannot disable super admin.' });
		}

		if (role === 'admin') {
			return res.status(403).json({ success: false, message: 'Admin role is reserved.' });
		}

		const update = {};
		if (role) update.role = role;
		if (isActive != null) update.isActive = Boolean(isActive);

		const user = await User.findByIdAndUpdate(id, update, {
			new: true,
			runValidators: true,
		}).select('-password');

		if (!user) {
			return res.status(404).json({ success: false, message: 'User not found.' });
		}

		return res.status(200).json({ success: true, data: user });
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const deleteUser = async (req, res) => {
	try {
		const { id } = req.params;

		const target = await User.findById(id).select('role isSuperAdmin');
		if (!target) {
			return res.status(404).json({ success: false, message: 'User not found.' });
		}

		// Prevent deletion of super admin
		if (target.isSuperAdmin === true) {
			return res.status(403).json({ 
				success: false, 
				message: 'Cannot delete super admin account.' 
			});
		}

		// Prevent deletion of admin accounts
		if (target.role === 'admin') {
			return res.status(403).json({ 
				success: false, 
				message: 'Cannot delete admin accounts.' 
			});
		}

		await User.findByIdAndDelete(id);

		return res.status(200).json({ 
			success: true, 
			message: 'User deleted successfully.' 
		});
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const listOrders = async (req, res) => {
	try {
		const { status, page = 1, limit = 20 } = req.query;
		const query = {};
		if (status) query.status = status;

		const skip = (Number(page) - 1) * Number(limit);
		const [items, total] = await Promise.all([
			Order.find(query)
				.sort({ createdAt: -1 })
				.populate('userId', 'name email phone')
				.populate('restaurantId', 'name email phone')
				.populate('items.itemId', 'name price')
				.skip(skip)
				.limit(Number(limit)),
			Order.countDocuments(query),
		]);

		return res.status(200).json({ success: true, data: { items, total } });
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const updateOrderStatus = async (req, res) => {
	try {
		const { id } = req.params;
		const { status, completionTime } = req.body;

		if (!['pending', 'accepted', 'completed', 'cancelled'].includes(status)) {
			return res.status(400).json({ success: false, message: 'Invalid status value.' });
		}

		const order = await Order.findById(id);
		if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

		if (status === 'accepted' && order.status === 'pending') {
			const existing = await Delivery.findOne({ order: id });
			if (!existing) {
				const customer = await User.findById(order.userId);
				const address = customer?.address || { house: '', road: '', area: '', city: '' };
				await Delivery.create({
					order: id,
					customer: order.userId,
					address,
					status: 'unassigned',
					completionTime: completionTime ? new Date(completionTime) : undefined,
				});
			}
		}

		order.status = status;
		const updated = await order.save();

		return res.status(200).json({ success: true, data: updated });
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const listDeliveries = async (req, res) => {
	try {
		const { status, page = 1, limit = 20 } = req.query;
		const query = {};
		if (status) query.status = status;

		const skip = (Number(page) - 1) * Number(limit);
		const [items, total] = await Promise.all([
			Delivery.find(query)
				.sort({ createdAt: -1 })
				.populate('order')
				.populate('customer', 'name email phone')
				.populate('deliveryStaff', 'name email phone')
				.skip(skip)
				.limit(Number(limit)),
			Delivery.countDocuments(query),
		]);

		return res.status(200).json({ success: true, data: { items, total } });
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const updateDelivery = async (req, res) => {
	try {
		const { id } = req.params;
		const { status, deliveryStaff } = req.body;

		const delivery = await Delivery.findById(id);
		if (!delivery) {
			return res.status(404).json({ success: false, message: 'Delivery not found.' });
		}

		const update = {};
		if (status) {
			update.status = status;
		} else if (deliveryStaff && delivery.status === 'unassigned') {
			// Auto-set status to assigned if staff is provided but status isn't explicitly changed from unassigned
			update.status = 'assigned';
		}

		if (deliveryStaff != null) update.deliveryStaff = deliveryStaff;

		const updatedDelivery = await Delivery.findByIdAndUpdate(id, update, {
			new: true,
			runValidators: true,
		});

		return res.status(200).json({ success: true, data: updatedDelivery });
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const listSubscriptions = async (req, res) => {
	try {
		const { status, page = 1, limit = 20 } = req.query;
		const query = {};
		if (status) query.status = status;

		const skip = (Number(page) - 1) * Number(limit);
		const [items, total] = await Promise.all([
			Subscription.find(query)
				.sort({ createdAt: -1 })
				.populate('user', 'name email phone')
				.skip(skip)
				.limit(Number(limit)),
			Subscription.countDocuments(query),
		]);

		return res.status(200).json({ success: true, data: { items, total } });
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const updateSubscription = async (req, res) => {
	try {
		const { id } = req.params;
		const { status, endDate, mealsPerWeek } = req.body;

		const update = {};
		if (status) update.status = status;
		if (endDate != null) update.endDate = endDate ? new Date(endDate) : null;
		if (mealsPerWeek != null) update.mealsPerWeek = mealsPerWeek;

		const subscription = await Subscription.findByIdAndUpdate(id, update, {
			new: true,
			runValidators: true,
		});

		if (!subscription) {
			return res.status(404).json({ success: false, message: 'Subscription not found.' });
		}

		return res.status(200).json({ success: true, data: subscription });
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const listMeals = async (req, res) => {
	try {
		const { page = 1, limit = 20 } = req.query;
		const skip = (Number(page) - 1) * Number(limit);

		const [items, total] = await Promise.all([
			MenuItem.find()
				.sort({ createdAt: -1 })
				.populate('restaurant', 'name email phone')
				.skip(skip)
				.limit(Number(limit)),
			MenuItem.countDocuments(),
		]);

		return res.status(200).json({ success: true, data: { items, total } });
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const updateMeal = async (req, res) => {
	try {
		const { id } = req.params;
		const {
			name,
			description,
			price,
			calories,
			ingredients,
			day,
			mealType,
			date,
			imageUrl,
			adminComment,
		} = req.body;

		const update = {};
		if (name != null) update.name = name;
		if (description != null) update.description = description;
		if (price != null) update.price = price;
		if (calories != null) update.calories = calories;
		if (ingredients != null) update.ingredients = ingredients;
		if (day != null) update.day = day;
		if (mealType != null) update.mealType = mealType;
		if (date != null) update.date = date ? new Date(date) : null;
		if (imageUrl != null) update.imageUrl = imageUrl;
		if (adminComment !== undefined) {
			const normalized = adminComment == null ? '' : String(adminComment);
			const trimmed = normalized.trim();
			update.adminComment = trimmed;
			if (trimmed.length === 0) {
				update.adminCommentedAt = null;
				update.adminCommentedBy = null;
			} else {
				update.adminCommentedAt = new Date();
				update.adminCommentedBy = req.user?._id || null;
			}
		}

		const item = await MenuItem.findByIdAndUpdate(id, update, {
			new: true,
			runValidators: true,
		});

		if (!item) return res.status(404).json({ success: false, message: 'Meal not found.' });

		return res.status(200).json({ success: true, data: item });
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const deleteMeal = async (req, res) => {
	try {
		const { id } = req.params;
		const deleted = await MenuItem.findByIdAndDelete(id);
		if (!deleted) return res.status(404).json({ success: false, message: 'Meal not found.' });
		return res.status(200).json({ success: true });
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const listReferrals = async (req, res) => {
	try {
		const { status, page = 1, limit = 20 } = req.query;
		const query = {};
		if (status) query.status = status;

		const skip = (Number(page) - 1) * Number(limit);
		const [items, total] = await Promise.all([
			Referral.find(query)
				.sort({ createdAt: -1 })
				.populate('referrer', 'name email phone')
				.populate('referredUser', 'name email phone')
				.skip(skip)
				.limit(Number(limit)),
			Referral.countDocuments(query),
		]);

		return res.status(200).json({ success: true, data: { items, total } });
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const listRewardPayments = async (req, res) => {
	try {
		const { page = 1, limit = 20 } = req.query;
		const skip = (Number(page) - 1) * Number(limit);

		const query = { type: { $in: ['reward', 'referral_reward'] } };

		const [items, total] = await Promise.all([
			Payment.find(query)
				.sort({ createdAt: -1 })
				.populate('user', 'name email phone')
				.skip(skip)
				.limit(Number(limit)),
			Payment.countDocuments(query),
		]);

		return res.status(200).json({ success: true, data: { items, total } });
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const listReviews = async (req, res) => {
	try {
		const { status, page = 1, limit = 20 } = req.query;
		const query = {};
		if (status) query.status = status;

		const skip = (Number(page) - 1) * Number(limit);
		const [items, total] = await Promise.all([
			Review.find(query)
				.sort({ createdAt: -1 })
				.populate('user', 'name email')
				.populate('restaurant', 'name email')
				.skip(skip)
				.limit(Number(limit)),
			Review.countDocuments(query),
		]);

		return res.status(200).json({ success: true, data: { items, total } });
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const updateReviewStatus = async (req, res) => {
	try {
		const { id } = req.params;
		const { status } = req.body;

		if (!['pending', 'approved', 'rejected'].includes(status)) {
			return res.status(400).json({ success: false, message: 'Invalid status value.' });
		}

		const review = await Review.findByIdAndUpdate(
			id,
			{ status },
			{ new: true, runValidators: true }
		);

		if (!review) {
			return res.status(404).json({ success: false, message: 'Review not found.' });
		}

		// Recalculate rating
		await Review.getAverageRating(review.restaurant);

		return res.status(200).json({ success: true, data: review });
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message });
	}
};