/**
 * Purpose:
 * Register all task CRUD endpoints under `/api/tasks`.
 */
const express = require("express");
const { asyncHandler } = require("../utils/http");
const { requireUser } = require("../middleware/auth");
const controller = require("../controllers/tasks.controller");

const router = express.Router();

router.use(requireUser);
router.get("/", asyncHandler(controller.listTasks));
router.post("/", asyncHandler(controller.createTask));
router.put("/:taskId", asyncHandler(controller.updateTask));
router.delete("/:taskId", asyncHandler(controller.deleteTask));

module.exports = router;
