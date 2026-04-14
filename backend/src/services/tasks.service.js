/**
 * Purpose:
 * Contain all task business logic: payload validation, Mongo persistence, and API serialization.
 */
const { getCollections } = require("../db/mongo");
const { ensureObjectId } = require("../utils/auth");
const { httpError } = require("../utils/http");
const {
  ensureArray,
  ensureBodyObject,
  ensureBoolean,
  ensureOptionalBoolean,
  ensureOptionalString,
} = require("../utils/validation");

function taskToResponse(task) {
  const response = { ...task, id: String(task._id) };
  delete response._id;
  delete response.user_id;
  delete response.category;
  return response;
}

function validateTask(payload) {
  ensureBodyObject(payload);
  if (typeof payload.title !== "string") throw httpError(422, "title must be a string");
  return {
    title: payload.title,
    desc: ensureOptionalString(payload.desc, "desc") ?? "",
    priority: ensureOptionalString(payload.priority, "priority") ?? "medium",
    tags: payload.tags === undefined ? [] : ensureArray(payload.tags, "tags"),
    due: ensureOptionalString(payload.due, "due") ?? "",
    completed: payload.completed === undefined ? false : ensureBoolean(payload.completed, "completed"),
    completed_at: payload.completed_at ?? null,
    created_at: payload.created_at ? new Date(payload.created_at) : new Date(),
  };
}

function validateTaskUpdate(payload) {
  ensureBodyObject(payload);
  const update = {};
  if (payload.title !== undefined) update.title = ensureOptionalString(payload.title, "title");
  if (payload.desc !== undefined) update.desc = ensureOptionalString(payload.desc, "desc");
  if (payload.priority !== undefined) update.priority = ensureOptionalString(payload.priority, "priority");
  if (payload.tags !== undefined) update.tags = payload.tags === null ? null : ensureArray(payload.tags, "tags");
  if (payload.due !== undefined) update.due = ensureOptionalString(payload.due, "due");
  if (payload.completed !== undefined) update.completed = ensureOptionalBoolean(payload.completed, "completed");
  if (payload.completed_at !== undefined) update.completed_at = payload.completed_at;
  Object.keys(update).forEach((key) => update[key] === undefined && delete update[key]);
  if (!Object.keys(update).length) throw httpError(400, "No fields to update");
  return update;
}

async function listTasks(userId) {
  const { tasks } = getCollections();
  return (await tasks.find({ user_id: String(userId) }).toArray()).map(taskToResponse);
}

async function createTask(payload, userId) {
  const { tasks } = getCollections();
  const task = validateTask(payload);
  task.user_id = String(userId);
  const result = await tasks.insertOne(task);
  task._id = result.insertedId;
  return taskToResponse(task);
}

async function updateTask(taskId, payload, userId) {
  const { tasks } = getCollections();
  const objectId = ensureObjectId(taskId);
  const update = validateTaskUpdate(payload);
  const result = await tasks.updateOne({ _id: objectId, user_id: String(userId) }, { $set: update });
  if (!result.matchedCount) throw httpError(404, "Task not found");
  return taskToResponse(await tasks.findOne({ _id: objectId, user_id: String(userId) }));
}

async function deleteTask(taskId, userId) {
  const { tasks } = getCollections();
  const result = await tasks.deleteOne({ _id: ensureObjectId(taskId), user_id: String(userId) });
  if (!result.deletedCount) throw httpError(404, "Task not found");
  return { message: "Task deleted successfully" };
}

module.exports = { listTasks, createTask, updateTask, deleteTask };
