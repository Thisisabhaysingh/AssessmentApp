import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { unauthorized, forbidden } from '../utils/responseHelper.js';

export const authenticate = (req, res, next) => {
  console.log(`🔐 Auth request to: ${req.path}`);
  const token = req.cookies?.token;
  console.log(`🍪 Token present: ${!!token}`);

  if (!token) {
    console.log(`❌ No token found, returning unauthorized`);
    return unauthorized(res);
  }

  try {
    console.log(`🔑 Verifying token...`);
    const payload = jwt.verify(token, env.JWT_SECRET);
    console.log(`✅ Token verified for user: ${payload.name} (${payload.role})`);
    req.user = payload;
    next();
  } catch (e) {
    console.error(`❌ Token verification failed:`, e.message);
    return unauthorized(res, 'Invalid token');
  }
};

export const permit = (...roles) => (req, res, next) => {
  if (!req.user) return unauthorized(res);
  if (!roles.includes(req.user.role)) return forbidden(res);
  next();
};
