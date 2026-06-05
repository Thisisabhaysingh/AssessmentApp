import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { unauthorized, forbidden } from '../utils/responseHelper.js';
import { User } from '../config/db.js';

export const authenticate = async (req, res, next) => {
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
    
    // Check if user is still active
    const user = await User.findByPk(payload.id);
    if (!user) {
      console.log(`❌ User not found in database`);
      return unauthorized(res, 'User not found');
    }
    
    if (user.status === 'inactive') {
      console.log(`❌ User ${payload.name} is inactive`);
      return unauthorized(res, 'Account is inactive. Please contact administrator.');
    }
    
    req.user = payload;
    next();
  } catch (e) {
    console.error(`❌ Token verification failed:`, e.message);
    return unauthorized(res, 'Invalid token');
  }
};

export const permit = (...roles) => (req, res, next) => {
  console.log(`🔑 Checking authorization for user:`, req.user);
  console.log(`🔑 Required roles:`, roles);
  console.log(`🔑 User role:`, req.user?.role);
  console.log(`🔑 Role check result:`, roles.includes(req.user?.role));
  
  if (!req.user) {
    console.log(`❌ No user in request, returning unauthorized`);
    return unauthorized(res);
  }
  if (!roles.includes(req.user.role)) {
    console.log(`❌ User role ${req.user.role} not in required roles [${roles.join(', ')}], returning forbidden`);
    return forbidden(res);
  }
  console.log(`✅ Authorization successful for user ${req.user.name} with role ${req.user.role}`);
  next();
};

// Alias for permit to maintain consistency
export const authorize = permit;
