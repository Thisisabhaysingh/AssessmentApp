import { Router } from 'express';
import { authenticate, permit } from '../middleware/authMiddleware.js';
import {
  login,
  loginValidators,
  me,
  logout,
  register,
  registerValidators,
  changePassword
} from '../controllers/authController.js';

const router = Router();

// Existing routes
router.post('/login', loginValidators, login);
router.post('/register', authenticate, permit('admin'), registerValidators, register);
router.get('/me', authenticate, me);
router.post('/logout', authenticate, logout);

// Change password (authenticated)
router.post('/change-password', authenticate, changePassword);

export default router;
