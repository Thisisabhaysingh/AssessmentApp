import { Router } from 'express';
import { authenticate, permit } from '../middleware/authMiddleware.js';
import {
  login,
  loginValidators,
  me,
  logout,
  register,
  registerValidators,
  changePassword,
  forgotPassword,
  forgotPasswordValidators,
  verifyOTP,
  verifyOTPValidators,
  resetPassword,
  resetPasswordValidators
} from '../controllers/authController.js';

const router = Router();

// Existing routes
router.post('/login', loginValidators, login);
router.post('/register', authenticate, permit('admin'), registerValidators, register);
router.get('/me', authenticate, me);
router.post('/logout', authenticate, logout);

// Change password (authenticated)
router.post('/change-password', authenticate, changePassword);

// Forgot password routes
router.post('/forgot-password', forgotPasswordValidators, forgotPassword);
router.post('/verify-otp', verifyOTPValidators, verifyOTP);
router.post('/reset-password', resetPasswordValidators, resetPassword);

export default router;
