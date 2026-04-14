/**
 * Purpose:
 * Hold lightweight validation helpers used by services to enforce request shapes
 * without adding a separate schema library during the migration.
 */
const { httpError } = require("./http");

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function ensureBodyObject(body) {
  if (!isPlainObject(body)) {
    throw httpError(400, "Invalid request body");
  }
}

function ensureString(value, field, { min, max, allowEmpty = false } = {}) {
  if (typeof value !== "string") {
    throw httpError(422, `${field} must be a string`);
  }
  if (!allowEmpty && !value.trim()) {
    throw httpError(422, `${field} is required`);
  }
  if (typeof min === "number" && value.length < min) {
    throw httpError(422, `${field} must be at least ${min} characters`);
  }
  if (typeof max === "number" && value.length > max) {
    throw httpError(422, `${field} must be at most ${max} characters`);
  }
  return value;
}

function ensureOptionalString(value, field, options = {}) {
  if (value === undefined || value === null) return undefined;
  return ensureString(value, field, { ...options, allowEmpty: true });
}

function ensureBoolean(value, field) {
  if (typeof value !== "boolean") throw httpError(422, `${field} must be a boolean`);
  return value;
}

function ensureOptionalBoolean(value, field) {
  if (value === undefined || value === null) return undefined;
  return ensureBoolean(value, field);
}

function ensureNumber(value, field) {
  if (typeof value !== "number" || Number.isNaN(value)) throw httpError(422, `${field} must be a number`);
  return value;
}

function ensureOptionalNumber(value, field) {
  if (value === undefined || value === null) return undefined;
  return ensureNumber(value, field);
}

function ensureArray(value, field) {
  if (!Array.isArray(value)) throw httpError(422, `${field} must be an array`);
  return value;
}

module.exports = {
  isPlainObject,
  ensureBodyObject,
  ensureString,
  ensureOptionalString,
  ensureBoolean,
  ensureOptionalBoolean,
  ensureNumber,
  ensureOptionalNumber,
  ensureArray,
};
