/**
 * Purpose:
 * Proxy AI insight requests to Gemini or Ollama and normalize the result when needed.
 * This preserves the existing `/api/ai/insights` contract from the FastAPI backend.
 */
const { aiProvider, geminiApiKey, geminiModel, ollamaBaseUrl, ollamaModel } = require("../config/env");
const { normalizeAiJson } = require("../utils/ai");
const { httpError } = require("../utils/http");

async function getAiInsights(req, res) {
  const prompt = req.body?.prompt || "";

  if (aiProvider === "ollama") {
    const wrappedPrompt =
      "Return ONLY a valid JSON object (no markdown, no extra text). It MUST match the schema described below.\n\n" +
      prompt;

    let response;
    try {
      response = await fetch(`${ollamaBaseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ollamaModel,
          prompt: wrappedPrompt,
          stream: false,
          options: { temperature: 0.7 },
        }),
      });
    } catch (error) {
      throw httpError(502, `Could not reach local Ollama. Install Ollama and make sure it is running on port 11434. (${error.message})`);
    }

    const payload = await response.json().catch(() => null);
    if (!response.ok) throw httpError(response.status, payload || "Failed to reach Ollama");

    const text = payload?.response || "";
    if (!text) throw httpError(500, { message: "Ollama returned empty text", raw: payload });

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw httpError(500, { message: "Ollama did not return valid JSON", raw: text });
    }

    return res.json({ content: [{ text: JSON.stringify(normalizeAiJson(parsed)) }] });
  }

  if (!geminiApiKey) {
    throw httpError(500, "GEMINI_API_KEY not set (or set AI_PROVIDER=ollama to use a free local model)");
  }

  let response;
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
      }),
    });
  } catch (error) {
    throw httpError(502, `Failed to reach Gemini API: ${error.message}`);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) throw httpError(response.status, payload || "Gemini request failed");

  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!text) throw httpError(500, { message: "Gemini returned empty text", raw: payload });

  return res.json({ content: [{ text }] });
}

module.exports = { getAiInsights };
