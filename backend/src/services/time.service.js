/**
 * Purpose:
 * Persist focus sessions and time blocks without adding extra behavior beyond the original API.
 */
const { getCollections } = require("../db/mongo");
const { ensureObjectId } = require("../utils/auth");
const { ensureBodyObject } = require("../utils/validation");

function toResponse(doc) {
  const response = { ...doc, id: String(doc._id) };
  delete response._id;
  delete response.user_id;
  return response;
}

function validatePayload(payload) {
  ensureBodyObject(payload);
  return { ...payload };
}

async function listFocusSessions(userId) {
  const { focusSessions } = getCollections();
  return (await focusSessions.find({ user_id: String(userId) }).toArray()).map(toResponse);
}

async function createFocusSession(payload, userId) {
  const { focusSessions } = getCollections();
  const session = { ...validatePayload(payload), user_id: String(userId) };
  const result = await focusSessions.insertOne(session);
  return toResponse(await focusSessions.findOne({ _id: result.insertedId, user_id: String(userId) }));
}

async function deleteFocusSession(id, userId) {
  const { focusSessions } = getCollections();
  await focusSessions.deleteOne({ _id: ensureObjectId(id), user_id: String(userId) });
  return { deleted: true };
}

async function listTimeBlocks(userId) {
  const { timeBlocks } = getCollections();
  return (await timeBlocks.find({ user_id: String(userId) }).toArray()).map(toResponse);
}

async function createTimeBlock(payload, userId) {
  const { timeBlocks } = getCollections();
  const block = { ...validatePayload(payload), user_id: String(userId) };
  const result = await timeBlocks.insertOne(block);
  return toResponse(await timeBlocks.findOne({ _id: result.insertedId, user_id: String(userId) }));
}

async function deleteTimeBlock(id, userId) {
  const { timeBlocks } = getCollections();
  await timeBlocks.deleteOne({ _id: ensureObjectId(id), user_id: String(userId) });
  return { deleted: true };
}

module.exports = { listFocusSessions, createFocusSession, deleteFocusSession, listTimeBlocks, createTimeBlock, deleteTimeBlock };
