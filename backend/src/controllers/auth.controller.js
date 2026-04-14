/**
 * Purpose:
 * Translate auth HTTP requests into auth service calls and return API-shaped responses.
 * Controllers stay thin so the real logic lives in services.
 */
const { serializeUser } = require("../utils/auth");
const authService = require("../services/auth.service");

async function signup(req, res) {
  res.json(await authService.signup(req.body));
}

async function login(req, res) {
  res.json(await authService.login(req.body));
}

async function me(req, res) {
  res.json({ user: serializeUser(req.user) });
}

async function logout(req, res) {
  res.json(await authService.logout(req.user._id));
}

module.exports = { signup, login, me, logout };
