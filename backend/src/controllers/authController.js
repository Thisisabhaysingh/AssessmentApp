import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { env } from '../config/env.js';
import { User } from '../config/db.js';
import { ok, created, bad } from '../utils/responseHelper.js';
import { sendOTPEmail } from '../utils/emailService.js';

// Store OTPs in memory (in production, use Redis or database)
const otpStore = new Map();

const sign = (user) => jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const loginValidators = [
  body('email').isEmail(),
  body('password').isString().isLength({ min: 6 }),
];

export const registerValidators = [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['admin', 'manager', 'school_ops_manager', 'trainer']),
];

export const forgotPasswordValidators = [
  body('email').isEmail().withMessage('Valid email is required'),
];

export const verifyOTPValidators = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
];

export const resetPasswordValidators = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return bad(res, 'Invalid credentials', 422);
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) return bad(res, 'Invalid email or password', 401);
  
  // Check if user is inactive
  if (user.status === 'inactive') {
    return bad(res, 'Account is inactive. Please contact administrator.', 403);
  }
  
  const match = await bcrypt.compare(password, user.password);
  if (!match) return bad(res, 'Invalid email or password', 401);
  
  // Update last login timestamp
  await user.update({ lastLogin: new Date() });
  
  const token = sign(user);
  res.cookie('token', token, { httpOnly: true, secure: env.COOKIE_SECURE, sameSite: env.COOKIE_SAME_SITE, maxAge: 1000 * 60 * 60 * 8 });
  return ok(res, { user: { id: user.id, name: user.name, email: user.email, role: user.role } }, 'Logged in');
};

export const me = async (req, res) => {
  console.log(`👤 Auth me request for user: ${req.user?.name} (${req.user?.role})`);
  return ok(res, { user: req.user });
};

export const logout = async (_req, res) => {
  res.clearCookie('token');
  return ok(res, {}, 'Logged out');
};

export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return bad(res, 'Invalid input', 422);
  const { name, email, password, role, department, designation } = req.body;
  const exists = await User.findOne({ where: { email } });
  if (exists) return bad(res, 'Email already exists', 400);
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed, role, department, designation });
  return created(res, { id: user.id, name: user.name, email: user.email, role: user.role }, 'User created');
};

// Change Password (Authenticated)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // From JWT middleware

    if (!currentPassword || !newPassword) {
      return bad(res, 'Current password and new password are required', 400);
    }

    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return bad(res, 'User not found', 404);
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return bad(res, 'Current password is incorrect', 400);
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return bad(res, 'New password must be different from current password', 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await user.update({ password: hashedPassword });

    return ok(res, { message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return bad(res, 'Failed to change password', 500);
  }
};

// Forgot Password - Send OTP
export const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return bad(res, 'Invalid email', 422);
    
    const { email } = req.body;
    
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if email exists or not
      return ok(res, { message: 'If an account with this email exists, an OTP has been sent' });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    
    // Store OTP (in production, use Redis or database)
    otpStore.set(email, { otp, expiresAt });
    
    console.log(`🔐 OTP for ${email}: ${otp} (expires at ${expiresAt})`);
    
    // Send OTP email
    try {
      await sendOTPEmail(email, otp);
      console.log('✅ OTP email sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', emailError);
      // Continue with the flow even if email fails (OTP is still stored)
    }
    
    return ok(res, { 
      message: 'If an account with this email exists, an OTP has been sent',
      expiresAt 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return bad(res, 'Failed to send OTP', 500);
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return bad(res, 'Invalid input', 422);
    
    const { email, otp } = req.body;
    
    // Check if OTP exists and is valid
    const storedOTP = otpStore.get(email);
    if (!storedOTP) {
      return bad(res, 'OTP not found or expired', 400);
    }
    
    // Check if OTP has expired
    if (Date.now() > storedOTP.expiresAt) {
      otpStore.delete(email);
      return bad(res, 'OTP has expired', 400);
    }
    
    // Check if OTP matches
    if (storedOTP.otp !== otp) {
      return bad(res, 'Invalid OTP', 400);
    }
    
    // Mark OTP as verified (in production, store this in database)
    otpStore.set(email, { ...storedOTP, verified: true });
    
    return ok(res, { message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return bad(res, 'Failed to verify OTP', 500);
  }
};

// Reset Password with OTP
export const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return bad(res, 'Invalid input', 422);
    
    const { email, otp, newPassword } = req.body;
    
    // Check if OTP was verified
    const storedOTP = otpStore.get(email);
    if (!storedOTP || !storedOTP.verified) {
      return bad(res, 'OTP not verified or expired', 400);
    }
    
    // Check if OTP has expired
    if (Date.now() > storedOTP.expiresAt) {
      otpStore.delete(email);
      return bad(res, 'OTP has expired', 400);
    }
    
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return bad(res, 'User not found', 404);
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await user.update({ password: hashedPassword });
    
    // Clean up OTP
    otpStore.delete(email);
    
    console.log(`🔑 Password reset successfully for ${email}`);
    
    return ok(res, { message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return bad(res, 'Failed to reset password', 500);
  }
};
