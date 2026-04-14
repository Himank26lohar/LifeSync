/**
 * Purpose:
 * Implement signup, login, and logout exactly around the existing session-token auth flow.
 * This is where credentials are validated, passwords are hashed, and sessions are rotated.
 */
const { getCollections } = require("../db/mongo");
const { createSessionToken, hashPassword, serializeUser, verifyPassword } = require("../utils/auth");
const { httpError } = require("../utils/http");
const { ensureBodyObject, ensureString } = require("../utils/validation");

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

function validateCredentials(payload) {
  ensureBodyObject(payload);
  return {
    username: ensureString(payload.username, "username", { min: 3, max: 32 }),
    password: ensureString(payload.password, "password", { min: 8, max: 128 }),
  };
}

async function signup(payload) {
  const credentials = validateCredentials(payload);
  const { users } = getCollections();
  const username = normalizeUsername(credentials.username);
  if (await users.findOne({ username })) {
    throw httpError(400, "Username already exists");
  }

  const password = hashPassword(credentials.password);
  const sessionToken = createSessionToken();
  const userDoc = {
    username,
    password_salt: password.salt,
    password_hash: password.hash,
    session_token: sessionToken,
    created_at: new Date(),
  };

  const result = await users.insertOne(userDoc);
  userDoc._id = result.insertedId;
  return { token: sessionToken, user: serializeUser(userDoc) };
}

async function login(payload) {
  const credentials = validateCredentials(payload);
  const { users } = getCollections();
  const username = normalizeUsername(credentials.username);
  const user = await users.findOne({ username });
  if (!user || !verifyPassword(credentials.password, user.password_salt, user.password_hash)) {
    throw httpError(401, "Invalid username or password");
  }

  const sessionToken = createSessionToken();
  await users.updateOne({ _id: user._id }, { $set: { session_token: sessionToken } });
  user.session_token = sessionToken;
  return { token: sessionToken, user: serializeUser(user) };
}

async function logout(userId) {
  const { users } = getCollections();
  await users.updateOne({ _id: userId }, { $unset: { session_token: "" } });
  return { message: "Logged out" };
}

module.exports = { signup, login, logout };
