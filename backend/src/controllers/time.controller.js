/**
 * Purpose:
 * Expose focus-session and time-block scheduling endpoints.
 */
const timeService = require("../services/time.service");

async function listFocusSessions(req, res) {
  res.json(await timeService.listFocusSessions(req.user._id));
}

async function createFocusSession(req, res) {
  res.json(await timeService.createFocusSession(req.body, req.user._id));
}

async function deleteFocusSession(req, res) {
  res.json(await timeService.deleteFocusSession(req.params.id, req.user._id));
}

async function listTimeBlocks(req, res) {
  res.json(await timeService.listTimeBlocks(req.user._id));
}

async function createTimeBlock(req, res) {
  res.json(await timeService.createTimeBlock(req.body, req.user._id));
}

async function deleteTimeBlock(req, res) {
  res.json(await timeService.deleteTimeBlock(req.params.id, req.user._id));
}

module.exports = { listFocusSessions, createFocusSession, deleteFocusSession, listTimeBlocks, createTimeBlock, deleteTimeBlock };
