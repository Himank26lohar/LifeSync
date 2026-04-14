from fastapi import APIRouter, Depends
from auth import ensure_object_id, require_user
from database import db
from models.time import FocusSession, FocusSessionUpdate, TimeBlock, TimeBlockUpdate

router = APIRouter()

def to_dict(doc):
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    doc.pop("user_id", None)
    return doc

# ── Focus Sessions ──────────────────────────────────────────────────────────

@router.get("/focus")
def get_focus_sessions(current_user=Depends(require_user)):
    return [to_dict(s) for s in db["focus_sessions"].find({"user_id": str(current_user["_id"])})]

@router.post("/focus")
def create_focus_session(s: FocusSession, current_user=Depends(require_user)):
    payload = s.dict()
    payload["user_id"] = str(current_user["_id"])
    result = db["focus_sessions"].insert_one(payload)
    created = db["focus_sessions"].find_one({"_id": result.inserted_id, "user_id": str(current_user["_id"])})
    return to_dict(created)

@router.delete("/focus/{id}")
def delete_focus_session(id: str, current_user=Depends(require_user)):
    db["focus_sessions"].delete_one({"_id": ensure_object_id(id), "user_id": str(current_user["_id"])})
    return {"deleted": True}

# ── Time Blocks ─────────────────────────────────────────────────────────────

@router.get("/blocks")
def get_blocks(current_user=Depends(require_user)):
    return [to_dict(b) for b in db["time_blocks"].find({"user_id": str(current_user["_id"])})]

@router.post("/blocks")
def create_block(b: TimeBlock, current_user=Depends(require_user)):
    payload = b.dict()
    payload["user_id"] = str(current_user["_id"])
    result = db["time_blocks"].insert_one(payload)
    created = db["time_blocks"].find_one({"_id": result.inserted_id, "user_id": str(current_user["_id"])})
    return to_dict(created)

@router.delete("/blocks/{id}")
def delete_block(id: str, current_user=Depends(require_user)):
    db["time_blocks"].delete_one({"_id": ensure_object_id(id), "user_id": str(current_user["_id"])})
    return {"deleted": True}
