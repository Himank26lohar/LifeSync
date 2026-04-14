/**
 * Purpose:
 * Handle journal entry CRUD logic and convert Mongo documents into frontend-safe payloads.
 */
const { getCollections } = require("../db/mongo");
const { ensureObjectId } = require("../utils/auth");
const { httpError } = require("../utils/http");
const { ensureArray, ensureBodyObject, ensureOptionalString } = require("../utils/validation");

function entryToResponse(entry) {
  const response = { ...entry, id: String(entry._id) };
  delete response._id;
  delete response.user_id;
  return response;
}

function validateEntry(payload) {
  ensureBodyObject(payload);
  if (typeof payload.body !== "string") throw httpError(422, "body must be a string");
  return {
    title: ensureOptionalString(payload.title, "title") ?? "",
    body: payload.body,
    tag: ensureOptionalString(payload.tag, "tag") ?? "Personal",
    date: ensureOptionalString(payload.date, "date") ?? "",
    time: ensureOptionalString(payload.time, "time") ?? "",
    media: payload.media === undefined ? [] : ensureArray(payload.media, "media"),
    created_at: new Date(),
  };
}

function validateEntryUpdate(payload) {
  ensureBodyObject(payload);
  const update = {};
  if (payload.title !== undefined) update.title = ensureOptionalString(payload.title, "title");
  if (payload.body !== undefined) update.body = ensureOptionalString(payload.body, "body");
  if (payload.tag !== undefined) update.tag = ensureOptionalString(payload.tag, "tag");
  if (payload.date !== undefined) update.date = ensureOptionalString(payload.date, "date");
  if (payload.time !== undefined) update.time = ensureOptionalString(payload.time, "time");
  if (payload.media !== undefined) update.media = payload.media === null ? null : ensureArray(payload.media, "media");
  Object.keys(update).forEach((key) => update[key] === undefined && delete update[key]);
  if (!Object.keys(update).length) throw httpError(400, "No fields to update");
  return update;
}

async function listEntries(userId) {
  const { journal } = getCollections();
  return (await journal.find({ user_id: String(userId) }).sort({ created_at: -1 }).toArray()).map(entryToResponse);
}

async function getEntryByDate(date, userId) {
  const { journal } = getCollections();
  const entry = await journal.findOne({ date, user_id: String(userId) });
  return entry ? entryToResponse(entry) : null;
}

async function createEntry(payload, userId) {
  const { journal } = getCollections();
  const entry = validateEntry(payload);
  entry.user_id = String(userId);
  const result = await journal.insertOne(entry);
  entry._id = result.insertedId;
  return entryToResponse(entry);
}

async function updateEntry(entryId, payload, userId) {
  const { journal } = getCollections();
  const objectId = ensureObjectId(entryId);
  const result = await journal.updateOne({ _id: objectId, user_id: String(userId) }, { $set: validateEntryUpdate(payload) });
  if (!result.matchedCount) throw httpError(404, "Entry not found");
  return entryToResponse(await journal.findOne({ _id: objectId, user_id: String(userId) }));
}

async function deleteEntry(entryId, userId) {
  const { journal } = getCollections();
  const result = await journal.deleteOne({ _id: ensureObjectId(entryId), user_id: String(userId) });
  if (!result.deletedCount) throw httpError(404, "Entry not found");
  return { message: "Entry deleted" };
}

module.exports = { listEntries, getEntryByDate, createEntry, updateEntry, deleteEntry };
