/**
 * Purpose:
 * Provide small HTTP helpers used across the backend, including a custom error type
 * and an async wrapper so route handlers can stay clean and promise-based.
 */
class AppError extends Error {
  constructor(statusCode, detail) {
    super(typeof detail === "string" ? detail : "Request failed");
    this.statusCode = statusCode;
    this.detail = detail;
  }
}

function httpError(statusCode, detail) {
  return new AppError(statusCode, detail);
}

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

module.exports = {
  AppError,
  httpError,
  asyncHandler,
};
