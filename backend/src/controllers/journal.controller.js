/**
 * Purpose:
 * Handle journal API requests and keep route handlers small and readable.
 */
const journalService = require("../services/journal.service");

async function listEntries(req, res) {
  res.json(await journalService.listEntries(req.user._id));
}

async function getEntryByDate(req, res) {
  res.json(await journalService.getEntryByDate(req.params.date, req.user._id));
}

async function createEntry(req, res) {
  res.json(await journalService.createEntry(req.body, req.user._id));
}

async function updateEntry(req, res) {
  res.json(await journalService.updateEntry(req.params.entryId, req.body, req.user._id));
}

async function deleteEntry(req, res) {
  res.json(await journalService.deleteEntry(req.params.entryId, req.user._id));
}

module.exports = { listEntries, getEntryByDate, createEntry, updateEntry, deleteEntry };
