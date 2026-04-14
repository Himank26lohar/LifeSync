/**
 * Purpose:
 * Serve habit endpoints, including the new focus-mode and habit-insight responses,
 * while passing request timezone context into the service layer.
 */
const habitsService = require("../services/habits.service");

async function listHabits(req, res) {
  res.json(await habitsService.listHabits(req.user._id, {
    timezone: req.context.timezone,
    weekDate: req.query.weekDate,
    focusMode: req.query.focusMode,
  }));
}

async function createHabit(req, res) {
  res.json(await habitsService.createHabit(req.body, req.user._id, { timezone: req.context.timezone }));
}

async function updateHabit(req, res) {
  res.json(await habitsService.updateHabit(req.params.habitId, req.body, req.user._id, {
    timezone: req.context.timezone,
    weekDate: req.query.weekDate,
  }));
}

async function deleteHabit(req, res) {
  res.json(await habitsService.deleteHabit(req.params.habitId, req.user._id));
}

async function focusMode(req, res) {
  res.json(await habitsService.getFocusMode(req.user._id, { timezone: req.context.timezone, weekDate: req.query.weekDate }));
}

async function insights(req, res) {
  res.json(await habitsService.getHabitInsights(req.user._id, { timezone: req.context.timezone, weekDate: req.query.weekDate }));
}

async function dailySummary(req, res) {
  res.json(await habitsService.getDailySummary(req.user._id, { timezone: req.context.timezone, weekDate: req.query.weekDate }));
}

module.exports = { listHabits, createHabit, updateHabit, deleteHabit, focusMode, insights, dailySummary };
