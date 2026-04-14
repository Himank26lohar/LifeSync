from fastapi import APIRouter, Depends, HTTPException
from auth import ensure_object_id, require_user
from database import wellness_collection
from models.wellness import WellnessLog, WellnessUpdate
from datetime import datetime

router = APIRouter()

def wellness_to_dict(entry):
    entry["id"] = str(entry["_id"])
    del entry["_id"]
    entry.pop("user_id", None)
    return entry


# GET all wellness logs
@router.get("/")
def get_wellness(current_user=Depends(require_user)):
    logs = list(wellness_collection.find({"user_id": str(current_user["_id"])}).sort("logged_at", 1))
    return [wellness_to_dict(l) for l in logs]


# POST log today's wellness
# POST log today's wellness
@router.post("/")
def log_wellness(entry: WellnessLog, current_user=Depends(require_user)):
    # Check if entry already exists for today
    today = datetime.utcnow().strftime("%m/%d/%Y")
    existing = wellness_collection.find_one({"date": today, "user_id": str(current_user["_id"])})
    if existing:
        raise HTTPException(status_code=400, detail="Already logged today. Delete existing entry first.")
    
    new_entry = entry.dict()
    new_entry["logged_at"] = datetime.utcnow()
    new_entry["user_id"] = str(current_user["_id"])
    result = wellness_collection.insert_one(new_entry)
    new_entry["id"] = str(result.inserted_id)
    new_entry.pop("_id", None)
    new_entry.pop("user_id", None)
    return new_entry


# PUT update a wellness log
@router.put("/{entry_id}")
def update_wellness(entry_id: str, update: WellnessUpdate, current_user=Depends(require_user)):
    object_id = ensure_object_id(entry_id)
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = wellness_collection.update_one({"_id": object_id, "user_id": str(current_user["_id"])}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    updated = wellness_collection.find_one({"_id": object_id, "user_id": str(current_user["_id"])})
    return wellness_to_dict(updated)


# DELETE a wellness log
@router.delete("/{entry_id}")
def delete_wellness(entry_id: str, current_user=Depends(require_user)):
    object_id = ensure_object_id(entry_id)
    result = wellness_collection.delete_one({"_id": object_id, "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"message": "Wellness log deleted"}


# GET last 7 logs (for charts)
@router.get("/recent")
def get_recent_wellness(current_user=Depends(require_user)):
    logs = list(wellness_collection.find({"user_id": str(current_user["_id"])}).sort("logged_at", -1).limit(7))
    return [wellness_to_dict(l) for l in reversed(logs)]
