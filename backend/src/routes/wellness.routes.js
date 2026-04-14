/**
 * Purpose:
 * Register wellness log endpoints under `/api/wellness`.
 */
const express = require("express");
const { asyncHandler } = require("../utils/http");
const { requireUser } = require("../middleware/auth");
const controller = require("../controllers/wellness.controller");

const router = express.Router();

router.use(requireUser);
router.get("/", asyncHandler(controller.listWellness));
router.get("/recent", asyncHandler(controller.recentWellness));
router.post("/", asyncHandler(controller.createWellness));
router.put("/:entryId", asyncHandler(controller.updateWellness));
router.delete("/:entryId", asyncHandler(controller.deleteWellness));

module.exports = router;
