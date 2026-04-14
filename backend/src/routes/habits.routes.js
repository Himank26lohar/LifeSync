/**
 * Purpose:
 * Register habit endpoints under `/api/habits`, including additive ADHD-support endpoints
 * for focus mode, insights, and daily summary.
 */
const express = require("express");
const { asyncHandler } = require("../utils/http");
const { requireUser } = require("../middleware/auth");
const controller = require("../controllers/habits.controller");

const router = express.Router();

router.use(requireUser);
router.get("/", asyncHandler(controller.listHabits));
router.get("/focus", asyncHandler(controller.focusMode));
router.get("/insights", asyncHandler(controller.insights));
router.get("/daily-summary", asyncHandler(controller.dailySummary));
router.post("/", asyncHandler(controller.createHabit));
router.put("/:habitId", asyncHandler(controller.updateHabit));
router.delete("/:habitId", asyncHandler(controller.deleteHabit));

module.exports = router;
