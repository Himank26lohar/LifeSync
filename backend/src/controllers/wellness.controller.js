/**
 * Purpose:
 * Map wellness endpoints to the underlying service functions.
 */
const wellnessService = require("../services/wellness.service");

async function listWellness(req, res) {
  res.json(await wellnessService.listWellness(req.user._id));
}

async function createWellness(req, res) {
  res.json(await wellnessService.createWellness(req.body, req.user._id));
}

async function updateWellness(req, res) {
  res.json(await wellnessService.updateWellness(req.params.entryId, req.body, req.user._id));
}

async function deleteWellness(req, res) {
  res.json(await wellnessService.deleteWellness(req.params.entryId, req.user._id));
}

async function recentWellness(req, res) {
  res.json(await wellnessService.recentWellness(req.user._id));
}

module.exports = { listWellness, createWellness, updateWellness, deleteWellness, recentWellness };
