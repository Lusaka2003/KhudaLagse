import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const protect = async (req, res, next) => {
	let token;

	try {
		if (
			req.headers.authorization &&
			req.headers.authorization.startsWith('Bearer')
		) {
			token = req.headers.authorization.split(' ')[1];
		}

		if (!token) {
			return res.status(401).json({
				success: false,
				message: 'Unauthorized. Please log in.',
			});
		}

		if (!process.env.JWT_SECRET) {
			return res.status(500).json({
				success: false,
				message: 'Server configuration error. JWT_SECRET is not set.',
			});
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		const user = await User.findById(decoded.id).select('-password');

		if (!user) {
			return res.status(401).json({
				success: false,
				message: 'User not found.',
			});
		}
		if (user.isActive === false) {
			return res.status(403).json({
				success: false,
				message: 'Account is disabled.',
			});
		}

		req.user = user;
		next();
	} catch (error) {
		return res.status(401).json({
			success: false,
			message: 'Not authorized, token failed.',
		});
	}
};
