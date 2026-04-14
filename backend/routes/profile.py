from fastapi import APIRouter, Depends
from auth import require_user
from database import profile_collection
from models.profile import ProfileDocument

router = APIRouter()

def _serialize_profile(doc):
    if not doc:
        return None
    doc.pop("_id", None)
    doc.pop("user_id", None)
    return doc


@router.get("/")
def get_profile(current_user=Depends(require_user)):
    profile = profile_collection.find_one({"user_id": str(current_user["_id"])})
    return _serialize_profile(profile)


@router.put("/")
def save_profile(profile: ProfileDocument, current_user=Depends(require_user)):
    payload = profile.dict()
    profile_collection.update_one(
        {"user_id": str(current_user["_id"])},
        {"$set": {"user_id": str(current_user["_id"]), **payload}},
        upsert=True,
    )
    saved = profile_collection.find_one({"user_id": str(current_user["_id"])})
    return _serialize_profile(saved)
