import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Referral from '../models/Referral.js';
import { 
	sendVerificationEmail, 
	sendWelcomeEmail,
	sendPasswordResetEmail 
} from '../utils/emailService.js';

const generateToken = (id) => {
	if (!process.env.JWT_SECRET) {
		throw new Error(
			'JWT_SECRET is not configured. Please set it in your .env file.'
		);
	}
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: '30d',
	});
};

const generateReferralCode = async () => {
	for (let i = 0; i < 10; i += 1) {
		const code = Math.floor(1000 + Math.random() * 9000).toString();
		const exists = await User.exists({ referralCode: code });
		if (!exists) return code;
	}
	throw new Error('Failed to generate referral code');
};

export const register = async (req, res) => {
	try {
		console.log('Registration payload:', req.body);
		
		const {
			name,
			email,
			phone,
			password,
			role: incomingRole,
			location,
			address,
			cuisineTypes,
			openingHours,
			menu,
			vehicleType,
			licenseNumber,
			currentLocation,
			referredByCode,
			referralCode: referralCodeInput,
		} = req.body;

		console.log('Location received:', location);

		if (!name || !email || !phone || !password) {
			return res.status(400).json({
				success: false,
				message: 'Please provide all required fields',
			});
		}

		const userExists = await User.findOne({ email });
		if (userExists) {
			return res.status(400).json({
				success: false,
				message: 'User already exists',
			});
		}

		const role = incomingRole || 'customer';
		if (role === 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Invalid role.',
			});
		}
		
		const userData = { name, email, phone, password, role };
		userData.referralCode = await generateReferralCode();

		// Role-specific assignments
		if (role === 'restaurant') {
			userData.restaurantName = name.trim();
			if (location) userData.location = location;
			if (Array.isArray(cuisineTypes))
				userData.cuisineTypes = cuisineTypes;
			if (openingHours) userData.openingHours = openingHours;
			if (Array.isArray(menu)) userData.menu = menu;

			userData.rating = 0;
			userData.totalRatings = 0;
			userData.isOpen = true;
		} else if (role === 'deliveryStaff') {
			if (vehicleType) userData.vehicleType = vehicleType;
			if (licenseNumber) userData.licenseNumber = licenseNumber;
			if (currentLocation) userData.currentLocation = currentLocation;

			userData.isAvailable = true;
			userData.totalDeliveries = 0;
		} else if (role === 'customer') {
			if (address) userData.address = address;
		}

		const user = await User.create(userData);

		const incomingReferral = referredByCode || referralCodeInput;
		if (incomingReferral && role === 'customer') {
			const referrer = await User.findOne({
				referralCode: String(incomingReferral).trim().toUpperCase(),
				isActive: true,
			});
			if (!referrer) {
				await User.findByIdAndDelete(user._id);
				return res.status(400).json({
					success: false,
					message: 'Invalid referral code.',
				});
			}
			if (referrer._id.toString() === user._id.toString()) {
				await User.findByIdAndDelete(user._id);
				return res.status(400).json({
					success: false,
					message: 'Invalid referral code.',
				});
			}
			user.referredBy = referrer._id;
			await user.save();
			try {
				await Referral.create({
					referrer: referrer._id,
					referredUser: user._id,
					codeUsed: referrer.referralCode,
					status: 'pending',
				});
			} catch (err) {
				if (err.code !== 11000) throw err;
			}
		}

		// Generate 6-digit verification code
		const verificationCode = user.generateEmailVerificationCode();
		await user.save();

		// Send verification email
		try {
			await sendVerificationEmail(user.email, user.name, verificationCode);
		} catch (emailError) {
			console.error('Failed to send verification email:', emailError);
			// Don't fail registration if email fails
		}

		const token = generateToken(user._id);

		res.status(201).json({
			success: true,
			message: 'Registration successful. Please check your email for the verification code.',
			data: {
				user: {
					id: user._id,
					name: user.name,
					email: user.email,
					phone: user.phone,
					role: user.role,
					isSuperAdmin: user.isSuperAdmin === true,
					isEmailVerified: user.isEmailVerified,
					address: user.address,
					vehicleType: user.vehicleType,
					isAvailable: user.isAvailable,
				},
				token,
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

export const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({
				success: false,
				message: 'Please provide email and password',
			});
		}

		const user = await User.findOne({ email }).select('+password');

		if (!user) {
			return res.status(401).json({
				success: false,
				message: 'Invalid credentials',
			});
		}

		const isMatch = await user.comparePassword(password);

		if (!isMatch) {
			return res.status(401).json({
				success: false,
				message: 'Invalid credentials',
			});
		}

		// Optional: Require email verification before login
		// Uncomment if you want to enforce this
		// if (!user.isEmailVerified) {
		// 	return res.status(401).json({
		// 		success: false,
		// 		message: 'Please verify your email before logging in',
		// 		requiresVerification: true,
		// 	});
		// }

		const token = generateToken(user._id);

		res.status(200).json({
			success: true,
			data: {
				user: {
					id: user._id,
					name: user.name,
					email: user.email,
					phone: user.phone,
					role: user.role,
					isSuperAdmin: user.isSuperAdmin === true,
					isEmailVerified: user.isEmailVerified,
					address: user.address,
					vehicleType: user.vehicleType,
					isAvailable: user.isAvailable,
				},
				token,
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Verify email with 6-digit code
export const verifyEmail = async (req, res) => {
	try {
		const { email, code } = req.body;

		if (!email || !code) {
			return res.status(400).json({
				success: false,
				message: 'Email and verification code are required',
			});
		}

		// Find user by email
		const user = await User.findOne({ email });

		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			});
		}

		if (user.isEmailVerified) {
			return res.status(400).json({
				success: false,
				message: 'Email is already verified',
			});
		}

		// Verify the code
		const isValid = user.verifyEmailWithCode(code);

		if (!isValid) {
			return res.status(400).json({
				success: false,
				message: 'Invalid or expired verification code',
			});
		}

		await user.save();

		// Send welcome email
		try {
			await sendWelcomeEmail(user.email, user.name);
		} catch (emailError) {
			console.error('Failed to send welcome email:', emailError);
		}

		res.status(200).json({
			success: true,
			message: 'Email verified successfully',
			data: {
				user: {
					id: user._id,
					name: user.name,
					email: user.email,
					isEmailVerified: user.isEmailVerified,
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

// Resend verification code
export const resendVerificationCode = async (req, res) => {
	try {
		const { email } = req.body;

		if (!email) {
			return res.status(400).json({
				success: false,
				message: 'Email is required',
			});
		}

		const user = await User.findOne({ email });

		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			});
		}

		if (user.isEmailVerified) {
			return res.status(400).json({
				success: false,
				message: 'Email is already verified',
			});
		}

		// Generate new verification code
		const verificationCode = user.generateEmailVerificationCode();
		await user.save();

		// Send verification email
		await sendVerificationEmail(user.email, user.name, verificationCode);

		res.status(200).json({
			success: true,
			message: 'Verification code sent successfully',
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Request password reset
export const forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;

		if (!email) {
			return res.status(400).json({
				success: false,
				message: 'Email is required',
			});
		}

		const user = await User.findOne({ email });

		if (!user) {
			// Don't reveal if user exists or not for security
			return res.status(200).json({
				success: true,
				message: 'If an account exists with this email, a password reset code has been sent.',
			});
		}

		// Generate password reset code
		const resetCode = user.generatePasswordResetCode();
		await user.save();

		// Send password reset email
		try {
			await sendPasswordResetEmail(user.email, user.name, resetCode);
		} catch (emailError) {
			console.error('Failed to send password reset email:', emailError);
			return res.status(500).json({
				success: false,
				message: 'Failed to send password reset email',
			});
		}

		res.status(200).json({
			success: true,
			message: 'Password reset code sent to your email',
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Reset password with code
export const resetPassword = async (req, res) => {
	try {
		const { email, code, newPassword } = req.body;

		if (!email || !code || !newPassword) {
			return res.status(400).json({
				success: false,
				message: 'Email, code, and new password are required',
			});
		}

		if (newPassword.length < 6) {
			return res.status(400).json({
				success: false,
				message: 'Password must be at least 6 characters long',
			});
		}

		const user = await User.findOne({ email });

		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			});
		}

		// Verify reset code
		const isValid = user.verifyPasswordResetCode(code);

		if (!isValid) {
			return res.status(400).json({
				success: false,
				message: 'Invalid or expired reset code',
			});
		}

		// Reset password
		user.resetPassword(newPassword);
		await user.save();

		res.status(200).json({
			success: true,
			message: 'Password reset successfully',
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};