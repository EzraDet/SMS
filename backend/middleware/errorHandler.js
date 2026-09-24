import { error } from '../utils/response.js';

/**
 * 404 Not Found handler
 */
export function notFound(req, res, next) {
  error(res, `Route ${req.originalUrl} not found`, 404);
}

/**
 * Global error handler
 */
export function errorHandler(err, req, res, next) {
  console.error('❌ Server Error:', err.stack);
  error(res, err.message || 'Internal Server Error', err.statusCode || 500, err);
}