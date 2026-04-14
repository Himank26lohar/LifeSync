from fastapi import APIRouter, Depends, HTTPException
from auth import ensure_object_id, require_user
from database import habits_collection
from models.habit import Habit, HabitUpdate
from datetime import datetime

router = APIRouter()

def habit_to_dict(habit):
    habit["id"] = str(habit["_id"])
    del habit["_id"]
    habit.pop("user_id", None)
    return habit


# GET all habits
@router.get("/")
def get_habits(current_user=Depends(require_user)):
    habits = list(habits_collection.find({"user_id": str(current_user["_id"])}))
    return [habit_to_dict(h) for h in habits]


# POST create a new habit
@router.post("/")
def create_habit(habit: Habit, current_user=Depends(require_user)):
    new_habit = habit.dict()
    new_habit["created_at"] = datetime.utcnow()
    new_habit["user_id"] = str(current_user["_id"])
    result = habits_collection.insert_one(new_habit)
    new_habit["id"] = str(result.inserted_id)
    new_habit.pop("_id", None)
    new_habit.pop("user_id", None)
    return new_habit


# PUT update habit (toggle complete, update streak)
@router.put("/{habit_id}")
def update_habit(habit_id: str, habit_update: HabitUpdate, current_user=Depends(require_user)):
    object_id = ensure_object_id(habit_id)
    update_data = {k: v for k, v in habit_update.dict().items() if v is not None or isinstance(v, (bool, list, int))}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = habits_collection.update_one({"_id": object_id, "user_id": str(current_user["_id"])}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Habit not found")
    updated = habits_collection.find_one({"_id": object_id, "user_id": str(current_user["_id"])})
    return habit_to_dict(updated)


# DELETE a habit
@router.delete("/{habit_id}")
def delete_habit(habit_id: str, current_user=Depends(require_user)):
    object_id = ensure_object_id(habit_id)
    result = habits_collection.delete_one({"_id": object_id, "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Habit not found")
    return {"message": "Habit deleted successfully"}
