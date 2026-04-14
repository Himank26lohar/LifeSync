/**
 * Purpose:
 * Implement wellness log CRUD rules, including the original "only one log per day" constraint.
 */
const { getCollections } = require("../db/mongo");
const { ensureObjectId } = require("../utils/auth");
const { httpError } = require("../utils/http");
const { ensureArray, ensureBodyObject, ensureNumber, ensureOptionalNumber, ensureOptionalString } = require("../utils/validation");
const { toUsDate } = require("../utils/date");

function logToResponse(entry) {
  const response = { ...entry, id: String(entry._id) };
  delete response._id;
  delete response.user_id;
  return response;
}

function validateWellness(payload) {
  ensureBodyObject(payload);
  return {
    mood: ensureNumber(payload.mood, "mood"),
    sleep: ensureNumber(payload.sleep, "sleep"),
    energy: payload.energy === undefined ? 3 : ensureNumber(payload.energy, "energy"),
    stress: payload.stress === undefined ? 3 : ensureNumber(payload.stress, "stress"),
    tags: payload.tags === undefined ? [] : ensureArray(payload.tags, "tags"),
    note: ensureOptionalString(payload.note, "note") ?? "",
    date: ensureOptionalString(payload.date, "date") ?? "",
    day: ensureOptionalString(payload.day, "day") ?? "",
    logged_at: payload.logged_at ? new Date(payload.logged_at) : new Date(),
  };
}

function validateWellnessUpdate(payload) {
  ensureBodyObject(payload);
  const update = {};
  if (payload.mood !== undefined) update.mood = ensureOptionalNumber(payload.mood, "mood");
  if (payload.sleep !== undefined) update.sleep = ensureOptionalNumber(payload.sleep, "sleep");
  if (payload.energy !== undefined) update.energy = ensureOptionalNumber(payload.energy, "energy");
  if (payload.stress !== undefined) update.stress = ensureOptionalNumber(payload.stress, "stress");
  if (payload.tags !== undefined) update.tags = payload.tags === null ? null : ensureArray(payload.tags, "tags");
  if (payload.note !== undefined) update.note = ensureOptionalString(payload.note, "note");
  Object.keys(update).forEach((key) => update[key] === undefined && delete update[key]);
  if (!Object.keys(update).length) throw httpError(400, "No fields to update");
  return update;
}

async function listWellness(userId) {
  const { wellness } = getCollections();
  return (await wellness.find({ user_id: String(userId) }).sort({ logged_at: 1 }).toArray()).map(logToResponse);
}

async function createWellness(payload, userId) {
  const { wellness } = getCollections();
  const today = toUsDate(new Date());
  if (await wellness.findOne({ date: today, user_id: String(userId) })) {
    throw httpError(400, "Already logged today. Delete existing entry first.");
  }
  const entry = validateWellness(payload);
  entry.user_id = String(userId);
  const result = await wellness.insertOne(entry);
  entry._id = result.insertedId;
  return logToResponse(entry);
}

async function updateWellness(entryId, payload, userId) {
  const { wellness } = getCollections();
  const objectId = ensureObjectId(entryId);
  const result = await wellness.updateOne({ _id: objectId, user_id: String(userId) }, { $set: validateWellnessUpdate(payload) });
  if (!result.matchedCount) throw httpError(404, "Entry not found");
  return logToResponse(await wellness.findOne({ _id: objectId, user_id: String(userId) }));
}

async function deleteWellness(entryId, userId) {
  const { wellness } = getCollections();
  const result = await wellness.deleteOne({ _id: ensureObjectId(entryId), user_id: String(userId) });
  if (!result.deletedCount) throw httpError(404, "Entry not found");
  return { message: "Wellness log deleted" };
}

async function recentWellness(userId) {
  const { wellness } = getCollections();
  return (await wellness.find({ user_id: String(userId) }).sort({ logged_at: -1 }).limit(7).toArray()).reverse().map(logToResponse);
}

module.exports = { listWellness, createWellness, updateWellness, deleteWellness, recentWellness };
