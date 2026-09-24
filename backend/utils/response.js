/**
 * Success response
 */
export function success(res, data = {}, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Error response
 */
export function error(res, message = 'Something went wrong', statusCode = 500, err = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    error: err ? err.toString() : undefined,
  });
}