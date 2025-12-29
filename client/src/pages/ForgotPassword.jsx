// ============================================
// 1. UPDATE USER MODEL (Add to User.js)
// ============================================

// Add these fields to your UserSchema:
/*
  // Password reset fields (add after email verification fields)
  passwordResetCode: { type: String },
  passwordResetExpires: { type: Date },
*/

// Add these methods to your UserSchema:
/*
// Generate 6-digit password reset code
UserSchema.methods.generatePasswordResetCode = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.passwordResetCode = code;
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return code;
};

// Verify password reset code
UserSchema.methods.verifyPasswordResetCode = function(code) {
  if (
    this.passwordResetCode === code &&
    this.passwordResetExpires > Date.now()
  ) {
    return true;
  }
  return false;
};

// Reset password
UserSchema.methods.resetPassword = function(newPassword) {
  this.password = newPassword;
  this.passwordResetCode = undefined;
  this.passwordResetExpires = undefined;
};
*/

// ============================================
// 2. EMAIL SERVICE - Add to emailService.js
// ============================================

// Add this function to your emailService.js:
/*
export const sendPasswordResetEmail = async (email, name, resetCode) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      throw new Error('Email transporter not configured');
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Your App Name'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your Password',
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
              background-color: #dc2626;
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
              <h1>🔐 Password Reset Request</h1>
            </div>
            <p>Hi ${name},</p>
            <p>We received a request to reset your password. Use the code below to reset it:</p>
            
            <div class="reset-code">
              ${resetCode}
            </div>
            
            <div class="info">
              <strong>Important:</strong> This code will expire in 1 hour.
            </div>
            
            <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
            
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} Your App Name. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hi ${name},\n\nWe received a request to reset your password. Your password reset code is: ${resetCode}\n\nThis code will expire in 1 hour.\n\nIf you didn't request a password reset, please ignore this email.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};
*/

// ============================================
// 3. AUTH CONTROLLER - Add to authController.js
// ============================================

// Add these functions to your authController.js:
/*
import { sendPasswordResetEmail } from '../utils/emailService.js';

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
*/

// ============================================
// 4. AUTH ROUTES - Add to authRoutes.js
// ============================================

// Add these routes to your authRoutes.js:
/*
import { forgotPassword, resetPassword } from '../controllers/authController.js';

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
*/

// ============================================
// 5. FRONTEND - ForgotPassword.jsx
// ============================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post('/api/auth/forgot-password', {
        email: email,
      });

      if (response.data.success) {
        setSuccess('Password reset code sent! Check your email.');
        // Navigate to reset password page after 2 seconds
        setTimeout(() => {
          navigate('/reset-password', { state: { email: email } });
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to send reset code');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'An error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-violet-50 px-4 pb-16 pt-28">
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl bg-white p-10 shadow-xl ring-1 ring-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
              <svg 
                className="w-10 h-10 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Forgot Password?
            </h1>
            <p className="text-gray-600">
              No worries! Enter your email and we'll send you a reset code.
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-violet-50 border-2 border-violet-200 text-violet-700 rounded-lg text-sm flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg text-sm flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                  setSuccess('');
                }}
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 transition-all focus:border-violet-500 focus:outline-none"
                placeholder="your@email.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-violet-700 py-3.5 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending Code...
                </span>
              ) : (
                'Send Reset Code'
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <Link to="/login" className="text-violet-600 hover:text-violet-700 font-semibold">
                  Log in
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-violet-600 hover:text-violet-700 font-semibold">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}