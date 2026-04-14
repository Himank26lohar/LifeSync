/**
 * Purpose:
 * Centralize HTTP error formatting so controllers and services can throw structured errors
 * without repeating response-shaping logic in every route.
 */
const { AppError } = require("../utils/http");

function notFound(_req, _res, next) {
  next(new AppError(404, "Not Found"));
}

function errorHandler(error, _req, res, _next) {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const detail = error instanceof AppError ? error.detail : error?.message || "Internal server error";
  res.status(statusCode).json({ detail });
}

module.exports = { notFound, errorHandler };
