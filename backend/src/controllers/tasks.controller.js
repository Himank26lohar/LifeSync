/**
 * Purpose:
 * Expose task CRUD actions over HTTP while delegating validation and persistence to the task service.
 */
const tasksService = require("../services/tasks.service");

async function listTasks(req, res) {
  res.json(await tasksService.listTasks(req.user._id));
}

async function createTask(req, res) {
  res.json(await tasksService.createTask(req.body, req.user._id));
}

async function updateTask(req, res) {
  res.json(await tasksService.updateTask(req.params.taskId, req.body, req.user._id));
}

async function deleteTask(req, res) {
  res.json(await tasksService.deleteTask(req.params.taskId, req.user._id));
}

module.exports = { listTasks, createTask, updateTask, deleteTask };
