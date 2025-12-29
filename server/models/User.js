import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const { Schema } = mongoose;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  
  // Email verification fields
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationCode: { type: String },
  emailVerificationExpires: { type: Date },
  
  role: {
    type: String,
    enum: ['customer', 'restaurant', 'deliveryStaff', 'admin'],
    required: true,
  },
  isSuperAdmin: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
  
  // Address field for customers and restaurants
  address: {
    house: { type: String, default: '' },
    road: { type: String, default: '' },
    area: { type: String, default: '' },
    city: { type: String, default: '' },
  },
  
  // Delivery staff specific fields
  isAvailable: { type: Boolean, default: true },
  totalDeliveries: { type: Number, default: 0 },
  vehicleType: {
    type: String,
    enum: ['Car', 'Bike', 'Bicycle', 'Other'],
    sparse: true,
  },
  
  // Restaurant-specific fields (keeping location for backward compatibility)
  location: {
    house: { type: String, default: '' },
    road: { type: String, default: '' },
    area: { type: String, default: '' },
    city: { type: String, default: '' },
  },
  cuisineTypes: [String],
  menu: [{ type: Schema.Types.ObjectId, ref: 'MenuItem' }],
  isOpen: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  
  // Wallet for core financial features
  walletBalance: { type: Number, default: 0 },

  passwordResetCode: { type: String },
  passwordResetExpires: { type: Date },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Password hashing pre-save hook
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate 6-digit email verification code
UserSchema.methods.generateEmailVerificationCode = function() {
  // Generate random 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store the code directly (you can hash it for extra security if needed)
  this.emailVerificationCode = code;
  
  // Code expires in 24 hours
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  
  // Return code to send via email
  return code;
};

// Verify email with code
UserSchema.methods.verifyEmailWithCode = function(code) {
  // Check if code matches and is not expired
  if (
    this.emailVerificationCode === code &&
    this.emailVerificationExpires > Date.now()
  ) {
    this.isEmailVerified = true;
    this.emailVerificationCode = undefined;
    this.emailVerificationExpires = undefined;
    return true;
  }
  
  return false;
};

// Resend verification code (regenerate)
UserSchema.methods.resendVerificationCode = function() {
  // Only allow if email is not already verified
  if (this.isEmailVerified) {
    throw new Error('Email already verified');
  }
  
  // Generate new code
  return this.generateEmailVerificationCode();
};

UserSchema.methods.generatePasswordResetCode = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.passwordResetCode = code;
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return code;
};

UserSchema.methods.verifyPasswordResetCode = function(code) {
  if (
    this.passwordResetCode === code &&
    this.passwordResetExpires > Date.now()
  ) {
    return true;
  }
  return false;
};

UserSchema.methods.resetPassword = function(newPassword) {
  this.password = newPassword;
  this.passwordResetCode = undefined;
  this.passwordResetExpires = undefined;
};



export const User = mongoose.model('User', UserSchema);