import { User } from '../models/User.js';
import Referral from '../models/Referral.js';

export const getMyReferral = async (req, res) => {
	try {
		const userId = req.user.id;
		const user = await User.findById(userId).select('referralCode walletBalance');
		if (!user) return res.status(404).json({ success: false, message: 'User not found' });

		const totalReferrals = await Referral.countDocuments({ referrer: userId });
		const rewardedReferrals = await Referral.countDocuments({
			referrer: userId,
			status: 'rewarded',
		});

		return res.status(200).json({
			success: true,
			data: {
				referralCode: user.referralCode || null,
				totalReferrals,
				rewardedReferrals,
				walletBalance: user.walletBalance || 0,
			},
		});
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const applyReferralCode = async (req, res) => {
	try {
		const userId = req.user.id;
		const { code } = req.body;

		if (!code) return res.status(400).json({ success: false, message: 'Code is required' });

		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ success: false, message: 'User not found' });

		if (user.referredBy) {
			return res
				.status(409)
				.json({ success: false, message: 'Referral already applied.' });
		}

		const referrer = await User.findOne({
			referralCode: String(code).trim().toUpperCase(),
			isActive: true,
		});
		if (!referrer) {
			return res.status(404).json({ success: false, message: 'Invalid referral code.' });
		}

		if (referrer._id.toString() === userId) {
			return res.status(400).json({ success: false, message: 'Cannot refer yourself.' });
		}

		user.referredBy = referrer._id;
		await user.save();

		await Referral.create({
			referrer: referrer._id,
			referredUser: userId,
			codeUsed: referrer.referralCode,
			status: 'pending',
		});

		return res.status(201).json({ success: true });
	} catch (error) {
		if (error.code === 11000) {
			return res.status(409).json({ success: false, message: 'Referral already exists.' });
		}
		return res.status(500).json({ success: false, message: error.message });
	}
};

