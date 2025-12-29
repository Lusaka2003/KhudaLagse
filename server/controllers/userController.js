import { User } from '../models/User.js';

export const getProfile = async (req, res) => {
	try {
		const user = await User.findById(req.user.id);

		res.status(200).json({
			success: true,
			data: {
				user: {
					id: user._id,
					name: user.name,
					email: user.email,
					phone: user.phone,
					role: user.role,
					address: user.address,
					vehicleType: user.vehicleType,
				},
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

export const updateProfile = async (req, res) => {
	try {
		const { name, email, phone, address } = req.body;
		const fieldsToUpdate = {};

		if (name) fieldsToUpdate.name = name;
		if (email) fieldsToUpdate.email = email;
		if (phone) fieldsToUpdate.phone = phone;
		if (address) fieldsToUpdate.address = address;
		if (req.body.vehicleType) fieldsToUpdate.vehicleType = req.body.vehicleType;

		// Check if email is already taken by another user
		if (email) {
			const existingUser = await User.findOne({
				email,
				_id: { $ne: req.user.id },
			});
			if (existingUser) {
				return res.status(400).json({
					success: false,
					message: 'Email is already taken by another user',
				});
			}
		}

		const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
			new: true,
			runValidators: true,
		});

		res.status(200).json({
			success: true,
			data: {
				user: {
					id: user._id,
					name: user.name,
					email: user.email,
					phone: user.phone,
					role: user.role,
					address: user.address,
					vehicleType: user.vehicleType,
				},
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

export const addFavorite = async (req, res) => {
	try {
		const user = await User.findById(req.user.id);
		if (!user)
			return res
				.status(404)
				.json({ success: false, message: 'User not found' });

		const restaurantId = req.params.restaurantId;
		if (!user.favorites.includes(restaurantId)) {
			user.favorites.push(restaurantId);
			await user.save();
		}

		res.status(200).json({ success: true, favorites: user.favorites });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

export const removeFavorite = async (req, res) => {
	try {
		const user = await User.findById(req.user.id);
		if (!user)
			return res
				.status(404)
				.json({ success: false, message: 'User not found' });

		const restaurantId = req.params.restaurantId;
		user.favorites = user.favorites.filter(
			(id) => id.toString() !== restaurantId
		);
		await user.save();

		res.status(200).json({ success: true, favorites: user.favorites });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

export const getFavorites = async (req, res) => {
	try {
		const user = await User.findById(req.user.id);
		if (!user)
			return res
				.status(404)
				.json({ success: false, message: 'User not found' });

		// Return just the array of IDs, not populated objects
		res.status(200).json({ success: true, favorites: user.favorites });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};
