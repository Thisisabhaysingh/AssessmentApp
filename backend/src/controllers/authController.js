import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { env } from '../config/env.js';
import { User } from '../config/db.js';
import { ok, created, bad } from '../utils/responseHelper.js';

const sign = (user) => jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

export const loginValidators = [
  body('email').isEmail(),
  body('password').isString().isLength({ min: 6 }),
];

export const registerValidators = [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['admin', 'manager', 'trainer']),
];

export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return bad(res, 'Invalid credentials', 422);
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) return bad(res, 'Invalid email or password', 401);
  const match = await bcrypt.compare(password, user.password);
  if (!match) return bad(res, 'Invalid email or password', 401);
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
