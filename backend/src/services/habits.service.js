/**
 * Purpose:
 * Hold the most important habit logic in the system:
 * CRUD behavior, weekly overlap prevention, focus-mode responses, and ADHD-support metadata.
 */
const { getCollections } = require("../db/mongo");
const { ensureObjectId } = require("../utils/auth");
const { httpError } = require("../utils/http");
const {
  ensureBodyObject,
  ensureOptionalBoolean,
  ensureOptionalNumber,
  ensureOptionalString,
} = require("../utils/validation");
const { formatDateInTimezone, getTodayIndex, getWeekRange } = require("../utils/date");

const DEFAULT_WEEK_START = 1;

function normalizeBooleanArray(values, size) {
  const source = Array.isArray(values) ? values : [];
  return Array.from({ length: size }, (_, index) => source[index] === true);
}

function normalizeMonthProgress(values) {
  if (values === null) return null;
  const length = Array.isArray(values) ? values.length : 0;
  return normalizeBooleanArray(values, length);
}

function buildWeekContext(timezone, weekDate) {
  return getWeekRange({ dateString: weekDate, timezone, weekStartsOn: DEFAULT_WEEK_START });
}

function habitToResponse(habit, options = {}) {
  const response = { ...habit, id: String(habit._id) };
  delete response._id;
  delete response.user_id;
  delete response.weekly_logs;
  delete response.grace_days_used;
  delete response.missed_count;

  // Always resolve the exact requested week so previous-week data never leaks into the current view.
  const week = buildWeekContext(options.timezone || "UTC", options.weekDate);
  const weeklyLogs = habit.weekly_logs && typeof habit.weekly_logs === "object" ? habit.weekly_logs : {};
  const fallbackCurrentWeek =
    habit.week_meta?.start_date === week.startDate && Array.isArray(habit.week_progress)
      ? habit.week_progress
      : [];

  response.week_progress = normalizeBooleanArray(weeklyLogs[week.startDate] || fallbackCurrentWeek, 7);
  response.week_context = {
    start_date: week.startDate,
    end_date: week.endDate,
    timezone: week.timezone,
    week_starts_on: DEFAULT_WEEK_START,
    selected: week.anchorDate,
  };
  response.encouragement = buildEncouragement(response);
  response.recovery = buildRecovery(habit);
  response.micro_tasks = buildMicroTasks(response);
  response.smart_reminder = buildReminder(habit);
  response.difficulty = habit.difficulty || "medium";
  response.reward_points = Number(habit.reward_points || 0);
  return response;
}

function validateHabit(payload) {
  ensureBodyObject(payload);
  return {
    name: ensureOptionalString(payload.name, "name") ?? "",
    icon: ensureOptionalString(payload.icon, "icon") ?? "flame",
    color: ensureOptionalString(payload.color, "color") ?? "#a855f7",
    streak: payload.streak === undefined ? 0 : ensureOptionalNumber(payload.streak, "streak"),
    completed_today: payload.completed_today === undefined ? false : ensureOptionalBoolean(payload.completed_today, "completed_today"),
    week_progress: normalizeBooleanArray(payload.week_progress, 7),
    month_progress: payload.month_progress === undefined ? null : normalizeMonthProgress(payload.month_progress),
  };
}

function validateHabitUpdate(payload) {
  ensureBodyObject(payload);
  const update = {};
  if (payload.name !== undefined) update.name = ensureOptionalString(payload.name, "name");
  if (payload.icon !== undefined) update.icon = ensureOptionalString(payload.icon, "icon");
  if (payload.color !== undefined) update.color = ensureOptionalString(payload.color, "color");
  if (payload.streak !== undefined) update.streak = ensureOptionalNumber(payload.streak, "streak");
  if (payload.completed_today !== undefined) update.completed_today = ensureOptionalBoolean(payload.completed_today, "completed_today");
  if (payload.week_progress !== undefined) update.week_progress = normalizeBooleanArray(payload.week_progress, 7);
  if (payload.month_progress !== undefined) update.month_progress = normalizeMonthProgress(payload.month_progress);
  if (payload.reward_points !== undefined) update.reward_points = ensureOptionalNumber(payload.reward_points, "reward_points");
  if (payload.difficulty !== undefined) update.difficulty = ensureOptionalString(payload.difficulty, "difficulty");

  Object.keys(update).forEach((key) => update[key] === undefined && delete update[key]);
  if (!Object.keys(update).length) throw httpError(400, "No fields to update");
  return update;
}

function buildEncouragement(habit) {
  if (habit.completed_today) return `Nice work. ${habit.name} is complete for today.`;
  if ((habit.streak || 0) >= 7) return `You're protecting a ${habit.streak}-day streak. One small win keeps it alive.`;
  return `Start with two minutes. ${habit.name} only needs a tiny first step today.`;
}

function buildRecovery(habit) {
  const used = Number(habit.grace_days_used || 0);
  return {
    available: used < 1 && !habit.completed_today,
    used,
    remaining: Math.max(0, 1 - used),
    rule: "One grace day can protect a streak after a missed day.",
  };
}

function buildMicroTasks(habit) {
  const label = habit.name || "habit";
  return [
    `Open ${label.toLowerCase()} and prepare for 2 minutes`,
    `Do the smallest repeatable version of ${label.toLowerCase()}`,
    `Mark progress and stop if your energy is low`,
  ];
}

function buildReminder(habit) {
  const misses = Number(habit.missed_count || 0);
  const intensity = misses >= 3 ? "high" : misses >= 1 ? "medium" : "low";
  return {
    intensity,
    next_reminder_in_minutes: intensity === "high" ? 90 : intensity === "medium" ? 180 : 360,
    reason: misses >= 3 ? "You've missed this habit a few times recently." : "Gentle reminder cadence is active.",
  };
}

async function listHabits(userId, { timezone, weekDate, focusMode } = {}) {
  const { habits } = getCollections();
  const mapped = (await habits.find({ user_id: String(userId) }).toArray()).map((habit) =>
    habitToResponse(habit, { timezone, weekDate })
  );
  return focusMode === "today" ? mapped.filter((habit) => !habit.completed_today) : mapped;
}

async function createHabit(payload, userId, { timezone } = {}) {
  const { habits } = getCollections();
  const habit = validateHabit(payload);
  const week = buildWeekContext(timezone, undefined);
  habit.created_at = new Date();
  habit.user_id = String(userId);
  // Week progress is stored by explicit week start date, which fixes the old overlap bug.
  habit.weekly_logs = { [week.startDate]: normalizeBooleanArray(habit.week_progress, 7) };
  habit.week_meta = {
    start_date: week.startDate,
    end_date: week.endDate,
    timezone: week.timezone,
    week_starts_on: DEFAULT_WEEK_START,
    selected: week.anchorDate,
  };
  habit.reward_points = 0;
  habit.difficulty = "medium";
  habit.grace_days_used = 0;
  habit.missed_count = 0;

  const result = await habits.insertOne(habit);
  habit._id = result.insertedId;
  return habitToResponse(habit, { timezone, weekDate: week.anchorDate });
}

async function updateHabit(habitId, payload, userId, { timezone, weekDate } = {}) {
  const { habits } = getCollections();
  const objectId = ensureObjectId(habitId);
  const existing = await habits.findOne({ _id: objectId, user_id: String(userId) });
  if (!existing) throw httpError(404, "Habit not found");

  const update = validateHabitUpdate(payload);
  const week = buildWeekContext(timezone, weekDate || payload.week_date || payload.weekDate);
  const weeklyLogs = existing.weekly_logs && typeof existing.weekly_logs === "object" ? { ...existing.weekly_logs } : {};

  if (update.week_progress) {
    // Persist updates into the selected week's bucket instead of a timeless 7-slot array.
    weeklyLogs[week.startDate] = normalizeBooleanArray(update.week_progress, 7);
    update.week_meta = {
      start_date: week.startDate,
      end_date: week.endDate,
      timezone: week.timezone,
      week_starts_on: DEFAULT_WEEK_START,
      selected: week.anchorDate,
    };
  }

  if (typeof update.completed_today === "boolean") {
    // Reward and reminder data are additive improvements; they do not alter the base habit contract.
    const rewardPoints = Number(existing.reward_points || 0);
    update.reward_points = update.completed_today ? rewardPoints + 10 : Math.max(0, rewardPoints - 10);
    update.missed_count = update.completed_today ? 0 : Number(existing.missed_count || 0) + 1;
  }

  if (Object.keys(weeklyLogs).length) update.weekly_logs = weeklyLogs;

  await habits.updateOne({ _id: objectId, user_id: String(userId) }, { $set: update });
  return habitToResponse(await habits.findOne({ _id: objectId, user_id: String(userId) }), { timezone, weekDate: week.anchorDate });
}

async function deleteHabit(habitId, userId) {
  const { habits } = getCollections();
  const result = await habits.deleteOne({ _id: ensureObjectId(habitId), user_id: String(userId) });
  if (!result.deletedCount) throw httpError(404, "Habit not found");
  return { message: "Habit deleted successfully" };
}

async function getFocusMode(userId, options = {}) {
  const habits = await listHabits(userId, { ...options, focusMode: "today" });
  return {
    date: formatDateInTimezone(new Date(), options.timezone),
    timezone: options.timezone,
    habits,
    encouragement:
      habits.length === 0
        ? "You're caught up for today. Enjoy the breathing room."
        : "Pick one habit, finish it, then come back for the next one.",
  };
}

async function getHabitInsights(userId, options = {}) {
  const habits = await listHabits(userId, options);
  const todayIndex = getTodayIndex(options.timezone);
  // Aggregate the selected week's completions to surface simple, ADHD-friendly patterns.
  const completedByDay = Array.from({ length: 7 }, (_, dayIndex) =>
    habits.reduce((total, habit) => total + (habit.week_progress[dayIndex] ? 1 : 0), 0)
  );
  const missesByDay = completedByDay.map((count) => Math.max(0, habits.length - count));
  const maxMisses = Math.max(...missesByDay, 0);
  const weakestDay = missesByDay.findIndex((count) => count === maxMisses);
  const bestHabit = habits.reduce((current, habit) => (!current || habit.streak > current.streak ? habit : current), null);
  const dayNames = ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays", "Sundays"];

  const insights = [];
  if (weakestDay >= 0 && habits.length) insights.push(`You usually miss habits on ${dayNames[weakestDay]}.`);
  if (bestHabit) insights.push(`Your strongest current streak is ${bestHabit.name} at ${bestHabit.streak} days.`);
  insights.push(todayIndex < 3 ? "Your best streak window is trending earlier in the week." : "Late-week check-ins need a little more support.");

  return {
    timezone: options.timezone,
    week: buildWeekContext(options.timezone, options.weekDate),
    insights,
    inactivity_pattern: missesByDay,
    reward_summary: {
      total_points: habits.reduce((sum, habit) => sum + Number(habit.reward_points || 0), 0),
      badges: [
        habits.some((habit) => habit.streak >= 7) ? "Week Warrior" : null,
        habits.some((habit) => habit.completed_today) ? "Today Counts" : null,
      ].filter(Boolean),
    },
  };
}

async function getDailySummary(userId, options = {}) {
  const habits = await listHabits(userId, options);
  const completed = habits.filter((habit) => habit.completed_today).length;
  return {
    date: formatDateInTimezone(new Date(), options.timezone),
    timezone: options.timezone,
    completed,
    total: habits.length,
    pending: habits.filter((habit) => !habit.completed_today).map((habit) => ({
      id: habit.id,
      name: habit.name,
      encouragement: habit.encouragement,
      micro_tasks: habit.micro_tasks,
    })),
    motivation:
      completed === habits.length
        ? "Everything is complete for today."
        : completed === 0
          ? "A tiny start still counts today."
          : "You're already moving. One more habit keeps the momentum going.",
  };
}

module.exports = {
  listHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  getFocusMode,
  getHabitInsights,
  getDailySummary,
};
