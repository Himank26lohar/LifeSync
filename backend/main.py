import os
import json
import httpx
from fastapi import HTTPException

# from routes import ai
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, tasks, habits, wellness, journal, profile
from dotenv import load_dotenv

app = FastAPI(
    title="LifeSync AI API",
    description="Backend API for LifeSync AI - Life Productivity & Wellness Assistant",
    version="1.0.0"
)

# Ensure `.env` is loaded even if DB isn't imported yet
load_dotenv()

def _normalize_ai_json(payload: dict) -> dict:
    """
    Local models can be loose with schema; normalize to what the frontend expects.
    """
    if not isinstance(payload, dict):
        payload = {}

    insights = payload.get("insights")
    if not isinstance(insights, list):
        insights = []
    normalized_insights = []
    for item in insights[:20]:
        if not isinstance(item, dict):
            continue
        normalized_insights.append(
            {
                "title": str(item.get("title", ""))[:120] or "Insight",
                "desc": str(item.get("desc", ""))[:800] or "",
                "priority": item.get("priority") if item.get("priority") in ("high", "medium", "low") else "medium",
                "type": item.get("type") if item.get("type") in ("pattern", "warning", "achievement", "tip") else "tip",
            }
        )

    next_week = payload.get("next_week")
    normalized_next_week = []
    if isinstance(next_week, list):
        for item in next_week[:20]:
            if isinstance(item, dict):
                normalized_next_week.append(
                    {
                        "action": str(item.get("action", ""))[:160] or "Action",
                        "reason": str(item.get("reason", ""))[:300] or "",
                        "category": item.get("category") if item.get("category") in ("habit", "task", "wellness", "focus") else "task",
                    }
                )
            elif isinstance(item, str):
                # Sometimes local models return day names or bare strings
                normalized_next_week.append({"action": item[:160], "reason": "", "category": "task"})
    if len(normalized_next_week) < 3:
        normalized_next_week = (normalized_next_week + [{"action": "Pick 1 priority task", "reason": "Build momentum", "category": "task"}])[:3]

    habit_recs = payload.get("habit_recommendations")
    normalized_habits = []
    if isinstance(habit_recs, list):
        for item in habit_recs[:10]:
            if not isinstance(item, dict):
                continue
            normalized_habits.append(
                {
                    "name": str(item.get("name", ""))[:80] or "New habit",
                    "why": str(item.get("why", ""))[:300] or "",
                    "difficulty": item.get("difficulty") if item.get("difficulty") in ("easy", "medium", "hard") else "easy",
                    "time": item.get("time") if item.get("time") in ("morning", "afternoon", "evening") else "morning",
                }
            )
    normalized_habits = normalized_habits[:2]

    journal_insights = payload.get("journal_insights")
    normalized_journal = []
    if isinstance(journal_insights, list):
        for item in journal_insights[:10]:
            if not isinstance(item, dict):
                continue
            normalized_journal.append(
                {
                    "observation": str(item.get("observation", ""))[:300] or "",
                    "suggestion": str(item.get("suggestion", ""))[:300] or "",
                }
            )
    normalized_journal = normalized_journal[:2]

    weekly_summary = payload.get("weekly_summary")
    if not isinstance(weekly_summary, str) or not weekly_summary.strip():
        weekly_summary = "Here’s a quick summary of your week based on your activity data."

    score = payload.get("score") if isinstance(payload.get("score"), dict) else {}
    def _clamp_int(v, default=50):
        try:
            iv = int(v)
        except Exception:
            iv = default
        return max(0, min(100, iv))

    normalized_score = {
        "productivity": _clamp_int(score.get("productivity"), 60),
        "wellness": _clamp_int(score.get("wellness"), 60),
        "consistency": _clamp_int(score.get("consistency"), 60),
        "balance": _clamp_int(score.get("balance"), 60),
    }

    return {
        "insights": normalized_insights[:4],
        "next_week": normalized_next_week[:3],
        "habit_recommendations": normalized_habits,
        "journal_insights": normalized_journal,
        "weekly_summary": weekly_summary[:600],
        "score": normalized_score,
    }

# ── CORS ──────────────────────────────────────────────────────────────────────
# This allows your React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React runs here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── ROUTES ────────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(tasks.router,    prefix="/api/tasks",    tags=["Tasks"])
app.include_router(habits.router,   prefix="/api/habits",   tags=["Habits"])
app.include_router(wellness.router, prefix="/api/wellness", tags=["Wellness"])
app.include_router(journal.router,  prefix="/api/journal",  tags=["Journal"])
app.include_router(profile.router,  prefix="/api/profile",  tags=["Profile"])
from routes.time import router as time_router
app.include_router(time_router, prefix="/api/time")
# app.include_router(ai.router, prefix="/api/ai", tags=["AI"])

# ── ROOT ──────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "message": "LifeSync AI Backend is running!",
        "docs": "Visit http://localhost:8000/docs to see all API endpoints"
    }

# ── RUN ───────────────────────────────────────────────────────────────────────
# To start: uvicorn main:app --reload


@app.post("/api/ai/insights")
async def get_ai_insights(data: dict):
    provider = (os.getenv("AI_PROVIDER", "gemini") or "gemini").strip().lower()
    prompt = data.get("prompt", "")

    async with httpx.AsyncClient() as client:
        if provider == "ollama":
            model = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
            base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
            wrapped_prompt = (
                "Return ONLY a valid JSON object (no markdown, no extra text). "
                "It MUST match the schema described below.\n\n"
                + prompt
            )
            try:
                res = await client.post(
                    f"{base_url}/api/generate",
                    headers={"Content-Type": "application/json"},
                    json={
                        "model": model,
                        "prompt": wrapped_prompt,
                        "stream": False,
                        "options": {"temperature": 0.7},
                    },
                    timeout=120.0,
                )
            except httpx.HTTPError as e:
                raise HTTPException(
                    status_code=502,
                    detail=(
                        "Could not reach local Ollama. Install Ollama and make sure it is running on port 11434. "
                        f"({str(e)})"
                    ),
                )

            if res.status_code >= 400:
                try:
                    raise HTTPException(status_code=res.status_code, detail=res.json())
                except ValueError:
                    raise HTTPException(status_code=res.status_code, detail=res.text)

            try:
                result = res.json()
                text = result.get("response", "") or ""
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Unexpected Ollama response format: {str(e)}")

            if not text:
                raise HTTPException(status_code=500, detail={"message": "Ollama returned empty text", "raw": result})

            # Validate/normalize to keep frontend stable
            try:
                parsed = json.loads(text)
            except Exception:
                raise HTTPException(status_code=500, detail={"message": "Ollama did not return valid JSON", "raw": text})

            normalized = _normalize_ai_json(parsed)
            return {"content": [{"text": json.dumps(normalized, ensure_ascii=False)}]}

        # Default: Gemini hosted API
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="GEMINI_API_KEY not set (or set AI_PROVIDER=ollama to use a free local model)",
            )

        model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        try:
            res = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1000},
                },
                timeout=30.0,
            )
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Failed to reach Gemini API: {str(e)}")

        if res.status_code >= 400:
            try:
                raise HTTPException(status_code=res.status_code, detail=res.json())
            except ValueError:
                raise HTTPException(status_code=res.status_code, detail=res.text)

        try:
            result = res.json()
            text = (
                result.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Unexpected Gemini response format: {str(e)}")

        if not text:
            raise HTTPException(status_code=500, detail={"message": "Gemini returned empty text", "raw": result})

        return {"content": [{"text": text}]}
