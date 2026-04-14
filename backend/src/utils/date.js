/**
 * Purpose:
 * Keep all timezone-aware date helpers in one module.
 * The weekly habit overlap fix relies on these helpers to compute strict Monday-Sunday week windows.
 */
const { appTimezone } = require("../config/env");

const formatterCache = new Map();

function getFormatter(timezone) {
  if (!formatterCache.has(timezone)) {
    formatterCache.set(
      timezone,
      new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    );
  }
  return formatterCache.get(timezone);
}

function resolveTimezone(candidate) {
  if (!candidate || typeof candidate !== "string") return appTimezone;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: candidate });
    return candidate;
  } catch {
    return appTimezone;
  }
}

function formatDateInTimezone(date = new Date(), timezone = appTimezone) {
  return getFormatter(resolveTimezone(timezone)).format(date);
}

function parseDateString(dateString) {
  if (typeof dateString !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return null;
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(dateString, offset) {
  const date = parseDateString(dateString);
  if (!date) return null;
  date.setUTCDate(date.getUTCDate() + offset);
  return toDateString(date);
}

function getWeekdayIndex(dateString) {
  const date = parseDateString(dateString);
  if (!date) return 0;
  return (date.getUTCDay() + 6) % 7;
}

function getWeekRange({ dateString, timezone, weekStartsOn = 1 } = {}) {
  const tz = resolveTimezone(timezone);
  const anchorDate = dateString || formatDateInTimezone(new Date(), tz);
  const weekdayIndex = getWeekdayIndex(anchorDate);
  const offset = weekStartsOn === 0 ? (weekdayIndex + 1) % 7 : weekdayIndex;
  const startDate = addDays(anchorDate, -offset);
  const endDate = addDays(startDate, 6);
  return { anchorDate, startDate, endDate, timezone: tz, weekStartsOn };
}

function getTodayIndex(timezone) {
  return getWeekdayIndex(formatDateInTimezone(new Date(), timezone));
}

function toUsDate(date = new Date()) {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${month}/${day}/${date.getUTCFullYear()}`;
}

module.exports = {
  resolveTimezone,
  formatDateInTimezone,
  parseDateString,
  addDays,
  getWeekdayIndex,
  getWeekRange,
  getTodayIndex,
  toUsDate,
};
