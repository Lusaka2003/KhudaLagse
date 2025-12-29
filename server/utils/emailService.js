import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
	// Check if required environment variables are set
	if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
		console.error('Email configuration missing. Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD in .env file');
		return null;
	}

	return nodemailer.createTransport({
		host: process.env.EMAIL_HOST, // e.g., smtp.gmail.com
		port: process.env.EMAIL_PORT || 587,
		secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASSWORD,
		},
	});
};

// Send verification code email
export const sendVerificationEmail = async (email, name, verificationCode) => {
	try {
		const transporter = createTransporter();
		
		if (!transporter) {
			throw new Error('Email transporter not configured');
		}

		const mailOptions = {
			from: `"${process.env.EMAIL_FROM_NAME || 'Your App Name'}" <${process.env.EMAIL_USER}>`,
			to: email,
			subject: 'Verify Your Email Address',
			html: `
				<!DOCTYPE html>
				<html>
				<head>
					<style>
						body {
							font-family: Arial, sans-serif;
							line-height: 1.6;
							color: #333;
							max-width: 600px;
							margin: 0 auto;
							padding: 20px;
						}
						.container {
							background-color: #f9f9f9;
							border-radius: 10px;
							padding: 30px;
							box-shadow: 0 2px 5px rgba(0,0,0,0.1);
						}
						.header {
							text-align: center;
							margin-bottom: 30px;
						}
						.verification-code {
							background-color: #4CAF50;
							color: white;
							font-size: 32px;
							font-weight: bold;
							text-align: center;
							padding: 20px;
							border-radius: 8px;
							letter-spacing: 8px;
							margin: 30px 0;
						}
						.info {
							background-color: #fff3cd;
							border-left: 4px solid #ffc107;
							padding: 15px;
							margin: 20px 0;
						}
						.footer {
							text-align: center;
							margin-top: 30px;
							font-size: 12px;
							color: #666;
						}
					</style>
				</head>
				<body>
					<div class="container">
						<div class="header">
							<h1>Email Verification</h1>
						</div>
						<p>Hi ${name},</p>
						<p>Thank you for registering! Please use the verification code below to verify your email address:</p>
						
						<div class="verification-code">
							${verificationCode}
						</div>
						
						<div class="info">
							<strong>Important:</strong> This code will expire in 24 hours.
						</div>
						
						<p>If you didn't create an account, please ignore this email.</p>
						
						<div class="footer">
							<p>This is an automated email. Please do not reply.</p>
							<p>&copy; ${new Date().getFullYear()} Your App Name. All rights reserved.</p>
						</div>
					</div>
				</body>
				</html>
			`,
			text: `Hi ${name},\n\nThank you for registering! Your verification code is: ${verificationCode}\n\nThis code will expire in 24 hours.\n\nIf you didn't create an account, please ignore this email.`,
		};

		const info = await transporter.sendMail(mailOptions);
		console.log('Verification email sent:', info.messageId);
		return { success: true, messageId: info.messageId };
	} catch (error) {
		console.error('Error sending verification email:', error);
		throw error;
	}
};

// Send welcome email after verification
export const sendWelcomeEmail = async (email, name) => {
	try {
		const transporter = createTransporter();
		
		if (!transporter) {
			throw new Error('Email transporter not configured');
		}

		const mailOptions = {
			from: `"${process.env.EMAIL_FROM_NAME || 'Your App Name'}" <${process.env.EMAIL_USER}>`,
			to: email,
			subject: 'Welcome! Your Email is Verified',
			html: `
				<!DOCTYPE html>
				<html>
				<head>
					<style>
						body {
							font-family: Arial, sans-serif;
							line-height: 1.6;
							color: #333;
							max-width: 600px;
							margin: 0 auto;
							padding: 20px;
						}
						.container {
							background-color: #f9f9f9;
							border-radius: 10px;
							padding: 30px;
							box-shadow: 0 2px 5px rgba(0,0,0,0.1);
						}
						.success-icon {
							text-align: center;
							font-size: 60px;
							color: #4CAF50;
							margin-bottom: 20px;
						}
						.footer {
							text-align: center;
							margin-top: 30px;
							font-size: 12px;
							color: #666;
						}
					</style>
				</head>
				<body>
					<div class="container">
						<div class="success-icon">✓</div>
						<h1 style="text-align: center; color: #4CAF50;">Welcome to Our Platform!</h1>
						<p>Hi ${name},</p>
						<p>Congratulations! Your email has been successfully verified.</p>
						<p>You can now access all features of your account and start using our services.</p>
						<p>If you have any questions, feel free to reach out to our support team.</p>
						<div class="footer">
							<p>&copy; ${new Date().getFullYear()} Your App Name. All rights reserved.</p>
						</div>
					</div>
				</body>
				</html>
			`,
			text: `Hi ${name},\n\nCongratulations! Your email has been successfully verified.\n\nYou can now access all features of your account.`,
		};

		const info = await transporter.sendMail(mailOptions);
		console.log('Welcome email sent:', info.messageId);
		return { success: true, messageId: info.messageId };
	} catch (error) {
		console.error('Error sending welcome email:', error);
		throw error;
	}
};

// Send password reset email
export const sendPasswordResetEmail = async (email, name, resetCode) => {
	try {
		const transporter = createTransporter();
		
		if (!transporter) {
			throw new Error('Email transporter not configured');
		}

		const mailOptions = {
			from: `"${process.env.EMAIL_FROM_NAME || 'Your App Name'}" <${process.env.EMAIL_USER}>`,
			to: email,
			subject: 'Password Reset Code',
			html: `
				<!DOCTYPE html>
				<html>
				<head>
					<style>
						body {
							font-family: Arial, sans-serif;
							line-height: 1.6;
							color: #333;
							max-width: 600px;
							margin: 0 auto;
							padding: 20px;
						}
						.container {
							background-color: #f9f9f9;
							border-radius: 10px;
							padding: 30px;
							box-shadow: 0 2px 5px rgba(0,0,0,0.1);
						}
						.header {
							text-align: center;
							margin-bottom: 30px;
						}
						.reset-code {
							background-color: #ff5722;
							color: white;
							font-size: 32px;
							font-weight: bold;
							text-align: center;
							padding: 20px;
							border-radius: 8px;
							letter-spacing: 8px;
							margin: 30px 0;
						}
						.warning {
							background-color: #fff3cd;
							border-left: 4px solid #ffc107;
							padding: 15px;
							margin: 20px 0;
						}
						.security-notice {
							background-color: #f8d7da;
							border-left: 4px solid #dc3545;
							padding: 15px;
							margin: 20px 0;
						}
						.footer {
							text-align: center;
							margin-top: 30px;
							font-size: 12px;
							color: #666;
						}
					</style>
				</head>
				<body>
					<div class="container">
						<div class="header">
							<h1>Password Reset Request</h1>
						</div>
						<p>Hi ${name},</p>
						<p>You requested to reset your password. Use the code below to reset your password:</p>
						
						<div class="reset-code">
							${resetCode}
						</div>
						
						<div class="warning">
							<strong>Important:</strong> This code will expire in 1 hour.
						</div>
						
						<div class="security-notice">
							<strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email and ensure your account is secure.
						</div>
						
						<p>For your security, never share this code with anyone.</p>
						
						<div class="footer">
							<p>This is an automated email. Please do not reply.</p>
							<p>&copy; ${new Date().getFullYear()} Your App Name. All rights reserved.</p>
						</div>
					</div>
				</body>
				</html>
			`,
			text: `Hi ${name},\n\nYou requested to reset your password. Your password reset code is: ${resetCode}\n\nThis code will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`,
		};

		const info = await transporter.sendMail(mailOptions);
		console.log('Password reset email sent:', info.messageId);
		return { success: true, messageId: info.messageId };
	} catch (error) {
		console.error('Error sending password reset email:', error);
		throw error;
	}
};