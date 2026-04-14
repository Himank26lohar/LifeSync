/**
 * Purpose:
 * Read and upsert the profile document that stores long-term identity, goals, and milestones.
 */
const { getCollections } = require("../db/mongo");
const { ensureBodyObject, isPlainObject } = require("../utils/validation");
const { httpError } = require("../utils/http");

function serializeProfile(doc) {
  if (!doc) return null;
  const response = { ...doc };
  delete response._id;
  delete response.user_id;
  return response;
}

function validateProfile(payload) {
  ensureBodyObject(payload);
  if (!isPlainObject(payload.profile)) throw httpError(422, "profile must be an object");
  return {
    profile: payload.profile,
    selectedYear: payload.selectedYear,
    goalsByYear: payload.goalsByYear || {},
    milestones: Array.isArray(payload.milestones) ? payload.milestones : [],
  };
}

async function getProfile(userId) {
  const { profile } = getCollections();
  return serializeProfile(await profile.findOne({ user_id: String(userId) }));
}

async function saveProfile(payload, userId) {
  const { profile } = getCollections();
  const document = validateProfile(payload);
  await profile.updateOne({ user_id: String(userId) }, { $set: { user_id: String(userId), ...document } }, { upsert: true });
  return serializeProfile(await profile.findOne({ user_id: String(userId) }));
}

module.exports = { getProfile, saveProfile };
