/**
 * Purpose:
 * Derive request-specific context, currently the user's timezone, from headers or query params.
 * Habit week filtering depends on this so week boundaries stay correct for each user locale.
 */
const { resolveTimezone } = require("../utils/date");

function requestContext(req, _res, next) {
  req.context = {
    timezone: resolveTimezone(req.header("x-timezone") || req.query.timezone),
  };
  next();
}

module.exports = { requestContext };
