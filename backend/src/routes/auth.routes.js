/**
 * Purpose:
 * Define the auth route table and attach auth middleware only where a signed-in user is required.
 */
const express = require("express");
const { asyncHandler } = require("../utils/http");
const { requireUser } = require("../middleware/auth");
const controller = require("../controllers/auth.controller");

const router = express.Router();

router.post("/signup", asyncHandler(controller.signup));
router.post("/login", asyncHandler(controller.login));
router.get("/me", requireUser, asyncHandler(controller.me));
router.post("/logout", requireUser, asyncHandler(controller.logout));

module.exports = router;
