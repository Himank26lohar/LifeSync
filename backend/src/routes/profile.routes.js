/**
 * Purpose:
 * Register profile endpoints under `/api/profile`.
 */
const express = require("express");
const { asyncHandler } = require("../utils/http");
const { requireUser } = require("../middleware/auth");
const controller = require("../controllers/profile.controller");

const router = express.Router();

router.use(requireUser);
router.get("/", asyncHandler(controller.getProfile));
router.put("/", asyncHandler(controller.saveProfile));

module.exports = router;
