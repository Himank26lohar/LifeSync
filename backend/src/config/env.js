/**
 * Purpose:
 * Load environment variables once and expose normalized runtime settings to the rest of the backend.
 * Keeping this separate avoids sprinkling `process.env` reads throughout the codebase.
 */
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

module.exports = {
  port: Number(process.env.PORT || 8000),
  mongoUrl: process.env.MONGODB_URL || "",
  databaseName: process.env.DATABASE_NAME || "lifesync",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  appTimezone: process.env.APP_TIMEZONE || "UTC",
  mongoTlsAllowInvalidCerts: process.env.MONGODB_TLS_ALLOW_INVALID_CERTS === "true",
  mongoTlsAllowInvalidHostnames: process.env.MONGODB_TLS_ALLOW_INVALID_HOSTNAMES === "true",
  aiProvider: (process.env.AI_PROVIDER || "gemini").trim().toLowerCase(),
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  ollamaBaseUrl: (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/+$/, ""),
  ollamaModel: process.env.OLLAMA_MODEL || "llama3.2:3b",
};
