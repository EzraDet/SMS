import { error } from '../utils/response.js';

/**
 * Validate required fields in req.body
 * Usage: validateRequired(['firstName', 'lastName', 'gender'])
 */
export function validateRequired(fields) {
  return (req, res, next) => {
    const missing = [];
    fields.forEach((field) => {
      const value = req.body[field];
      if (value === undefined || value === null || value === '') {
        missing.push(field);
      }
    });

    if (missing.length > 0) {
      return error(
        res,
        `Missing required field(s): ${missing.join(', ')}`,
        400
      );
    }
    next();
  };
}

/**
 * Validate enum values (e.g. gender must be male/female)
 * Usage: validateEnum('gender', ['male', 'female'])
 */
export function validateEnum(field, allowedValues) {
  return (req, res, next) => {
    const value = req.body[field];
    if (value !== undefined && !allowedValues.includes(value)) {
      return error(
        res,
        `Invalid value for '${field}'. Allowed: ${allowedValues.join(', ')}`,
        400
      );
    }
    next();
  };
}

/**
 * Validate email format
 */
export function validateEmail(field = 'email') {
  return (req, res, next) => {
    const value = req.body[field];
    if (value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return error(res, `Invalid email format for '${field}'`, 400);
      }
    }
    next();
  };
}