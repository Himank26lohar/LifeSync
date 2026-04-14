/**
 * Purpose:
 * Serve profile read/write requests using the profile service.
 */
const profileService = require("../services/profile.service");

async function getProfile(req, res) {
  res.json(await profileService.getProfile(req.user._id));
}

async function saveProfile(req, res) {
  res.json(await profileService.saveProfile(req.body, req.user._id));
}

module.exports = { getProfile, saveProfile };
