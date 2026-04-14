from fastapi import APIRouter, Depends, HTTPException
from auth import ensure_object_id, require_user
from database import journal_collection
from models.journal import JournalEntry, JournalUpdate
from datetime import datetime

router = APIRouter()

def journal_to_dict(entry):
    entry["id"] = str(entry["_id"])
    del entry["_id"]
    entry.pop("user_id", None)
    return entry


# GET all journal entries
@router.get("/")
def get_entries(current_user=Depends(require_user)):
    entries = list(journal_collection.find({"user_id": str(current_user["_id"])}).sort("created_at", -1))
    return [journal_to_dict(e) for e in entries]


# GET entries for a specific date
@router.get("/date/{date}")
def get_entry_by_date(date: str, current_user=Depends(require_user)):
    entry = journal_collection.find_one({"date": date, "user_id": str(current_user["_id"])})
    if not entry:
        return None
    return journal_to_dict(entry)


# POST create a new journal entry
@router.post("/")
def create_entry(entry: JournalEntry, current_user=Depends(require_user)):
    new_entry = entry.dict()
    new_entry["created_at"] = datetime.utcnow()
    new_entry["user_id"] = str(current_user["_id"])
    result = journal_collection.insert_one(new_entry)
    new_entry["id"] = str(result.inserted_id)
    new_entry.pop("_id", None)
    new_entry.pop("user_id", None)
    return new_entry


# PUT update a journal entry
@router.put("/{entry_id}")
def update_entry(entry_id: str, update: JournalUpdate, current_user=Depends(require_user)):
    object_id = ensure_object_id(entry_id)
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = journal_collection.update_one({"_id": object_id, "user_id": str(current_user["_id"])}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    updated = journal_collection.find_one({"_id": object_id, "user_id": str(current_user["_id"])})
    return journal_to_dict(updated)


# DELETE a journal entry
@router.delete("/{entry_id}")
def delete_entry(entry_id: str, current_user=Depends(require_user)):
    object_id = ensure_object_id(entry_id)
    result = journal_collection.delete_one({"_id": object_id, "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"message": "Entry deleted"}
