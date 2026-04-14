/**
 * Purpose:
 * Register focus-session and time-block endpoints under `/api/time`.
 */
const express = require("express");
const { asyncHandler } = require("../utils/http");
const { requireUser } = require("../middleware/auth");
const controller = require("../controllers/time.controller");

const router = express.Router();

router.use(requireUser);
router.get("/focus", asyncHandler(controller.listFocusSessions));
router.post("/focus", asyncHandler(controller.createFocusSession));
router.delete("/focus/:id", asyncHandler(controller.deleteFocusSession));
router.get("/blocks", asyncHandler(controller.listTimeBlocks));
router.post("/blocks", asyncHandler(controller.createTimeBlock));
router.delete("/blocks/:id", asyncHandler(controller.deleteTimeBlock));

module.exports = router;
