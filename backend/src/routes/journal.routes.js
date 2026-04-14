/**
 * Purpose:
 * Register all journal endpoints under `/api/journal`.
 */
const express = require("express");
const { asyncHandler } = require("../utils/http");
const { requireUser } = require("../middleware/auth");
const controller = require("../controllers/journal.controller");

const router = express.Router();

router.use(requireUser);
router.get("/", asyncHandler(controller.listEntries));
router.get("/date/:date", asyncHandler(controller.getEntryByDate));
router.post("/", asyncHandler(controller.createEntry));
router.put("/:entryId", asyncHandler(controller.updateEntry));
router.delete("/:entryId", asyncHandler(controller.deleteEntry));

module.exports = router;
