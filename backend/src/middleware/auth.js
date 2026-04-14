/**
 * Purpose:
 * Protect private routes by resolving the bearer session token to a user document.
 * This preserves the original FastAPI session-token auth model instead of switching to JWT.
 */
const { getCollections } = require("../db/mongo");
const { httpError } = require("../utils/http");

async function requireUser(req, _res, next) {
  const authorization = req.header("authorization");
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return next(httpError(401, "Authentication required"));
  }

  const token = authorization.split(" ", 2)[1]?.trim();
  if (!token) {
    return next(httpError(401, "Authentication required"));
  }

  const { users } = getCollections();
  const user = await users.findOne({ session_token: token });
  if (!user) {
    return next(httpError(401, "Invalid or expired session"));
  }

  req.user = user;
  next();
}

module.exports = { requireUser };
