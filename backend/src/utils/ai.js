/**
 * Purpose:
 * Normalize AI output into the exact structure the frontend expects, even if the provider
 * returns noisy or partially malformed JSON.
 */
function normalizeAiJson(payload) {
  const safePayload = payload && typeof payload === "object" ? payload : {};
  const insights = Array.isArray(safePayload.insights) ? safePayload.insights : [];
  const normalizedInsights = insights.slice(0, 20).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    return [{
      title: String(item.title || "").slice(0, 120) || "Insight",
      desc: String(item.desc || "").slice(0, 800) || "",
      priority: ["high", "medium", "low"].includes(item.priority) ? item.priority : "medium",
      type: ["pattern", "warning", "achievement", "tip"].includes(item.type) ? item.type : "tip",
    }];
  });

  const nextWeek = Array.isArray(safePayload.next_week) ? safePayload.next_week : [];
  const normalizedNextWeek = nextWeek.slice(0, 20).flatMap((item) => {
    if (typeof item === "string") return [{ action: item.slice(0, 160), reason: "", category: "task" }];
    if (!item || typeof item !== "object") return [];
    return [{
      action: String(item.action || "").slice(0, 160) || "Action",
      reason: String(item.reason || "").slice(0, 300) || "",
      category: ["habit", "task", "wellness", "focus"].includes(item.category) ? item.category : "task",
    }];
  });
  while (normalizedNextWeek.length < 3) {
    normalizedNextWeek.push({ action: "Pick 1 priority task", reason: "Build momentum", category: "task" });
  }

  const habits = Array.isArray(safePayload.habit_recommendations) ? safePayload.habit_recommendations : [];
  const normalizedHabits = habits.slice(0, 10).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    return [{
      name: String(item.name || "").slice(0, 80) || "New habit",
      why: String(item.why || "").slice(0, 300) || "",
      difficulty: ["easy", "medium", "hard"].includes(item.difficulty) ? item.difficulty : "easy",
      time: ["morning", "afternoon", "evening"].includes(item.time) ? item.time : "morning",
    }];
  }).slice(0, 2);

  const journal = Array.isArray(safePayload.journal_insights) ? safePayload.journal_insights : [];
  const normalizedJournal = journal.slice(0, 10).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    return [{
      observation: String(item.observation || "").slice(0, 300) || "",
      suggestion: String(item.suggestion || "").slice(0, 300) || "",
    }];
  }).slice(0, 2);

  const score = safePayload.score && typeof safePayload.score === "object" ? safePayload.score : {};
  const clampInt = (value, fallback = 50) => {
    const numeric = Number.parseInt(value, 10);
    const safeValue = Number.isNaN(numeric) ? fallback : numeric;
    return Math.max(0, Math.min(100, safeValue));
  };

  return {
    insights: normalizedInsights.slice(0, 4),
    next_week: normalizedNextWeek.slice(0, 3),
    habit_recommendations: normalizedHabits,
    journal_insights: normalizedJournal,
    weekly_summary:
      typeof safePayload.weekly_summary === "string" && safePayload.weekly_summary.trim()
        ? safePayload.weekly_summary.slice(0, 600)
        : "Here's a quick summary of your week based on your activity data.",
    score: {
      productivity: clampInt(score.productivity, 60),
      wellness: clampInt(score.wellness, 60),
      consistency: clampInt(score.consistency, 60),
      balance: clampInt(score.balance, 60),
    },
  };
}

module.exports = { normalizeAiJson };
