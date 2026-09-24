import { verifyToken } from '../utils/jwt.js';
import { error } from '../utils/response.js';

/**
 * Require a valid JWT. Attaches `req.user = { id, username, role }`.
 */
export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    return error(res, 'Authentication required', 401);
  }

  const token = header.slice(7).trim();
  const payload = verifyToken(token);

  if (!payload) {
    return error(res, 'Invalid or expired token', 401);
  }

  req.user = payload;
  next();
}

/**
 * Restrict to specific roles.
 * Usage: authorize('admin', 'super_admin')
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return error(res, 'Authentication required', 401);

    if (!allowedRoles.includes(req.user.role)) {
      return error(res, 'Insufficient permissions', 403);
    }
    next();
  };
}