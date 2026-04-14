/**
 * Purpose:
 * Assemble the Express application with shared middleware and all API route groups.
 * This mirrors the old FastAPI app-level wiring in one place.
 */
const express = require("express");
const cors = require("cors");
const { clientOrigin } = require("./config/env");
const { requestContext } = require("./middleware/request-context");
const { errorHandler, notFound } = require("./middleware/error-handler");
const { asyncHandler } = require("./utils/http");
const { getAiInsights } = require("./controllers/ai.controller");
const authRoutes = require("./routes/auth.routes");
const tasksRoutes = require("./routes/tasks.routes");
const habitsRoutes = require("./routes/habits.routes");
const wellnessRoutes = require("./routes/wellness.routes");
const journalRoutes = require("./routes/journal.routes");
const profileRoutes = require("./routes/profile.routes");
const timeRoutes = require("./routes/time.routes");

const app = express();

app.use(cors({ origin: [clientOrigin], credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(requestContext);

app.get("/", (_req, res) => {
  res.json({
    message: "LifeSync AI Backend is running!",
    docs: "Visit http://localhost:8000/docs to see all API endpoints",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/habits", habitsRoutes);
app.use("/api/wellness", wellnessRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/time", timeRoutes);
app.post("/api/ai/insights", asyncHandler(getAiInsights));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
