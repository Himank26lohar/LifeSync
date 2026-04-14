/**
 * Purpose:
 * Encapsulate password hashing, secure password comparison, session-token creation,
 * and Mongo id validation so auth-sensitive code stays consistent everywhere.
 */
const crypto = require("crypto");
const { ObjectId } = require("mongodb");
const { httpError } = require("./http");

function hashPassword(password, salt) {
  const actualSalt = salt || crypto.randomBytes(16).toString("hex");
  const digest = crypto.pbkdf2Sync(Buffer.from(password, "utf8"), Buffer.from(actualSalt, "utf8"), 100000, 32, "sha256");
  return { salt: actualSalt, hash: digest.toString("hex") };
}

function verifyPassword(password, salt, expectedHash) {
  const candidate = hashPassword(password, salt).hash;
  const left = Buffer.from(candidate, "utf8");
  const right = Buffer.from(expectedHash, "utf8");
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function createSessionToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function serializeUser(doc) {
  return {
    id: String(doc._id),
    username: doc.username,
    created_at: doc.created_at,
  };
}

function ensureObjectId(value) {
  if (!ObjectId.isValid(value)) throw httpError(400, "Invalid id");
  return new ObjectId(value);
}

module.exports = {
  hashPassword,
  verifyPassword,
  createSessionToken,
  serializeUser,
  ensureObjectId,
};
