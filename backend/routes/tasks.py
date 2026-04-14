from fastapi import APIRouter, Depends, HTTPException
from auth import ensure_object_id, require_user
from database import tasks_collection
from models.task import Task, TaskUpdate
from datetime import datetime

router = APIRouter()

# Helper: convert MongoDB doc to JSON-friendly dict
def task_to_dict(task):
    task["id"] = str(task["_id"])
    del task["_id"]
    task.pop("user_id", None)
    # Category is deprecated; keep API clean
    task.pop("category", None)
    return task


# GET all tasks
@router.get("/")
def get_tasks(current_user=Depends(require_user)):
    tasks = list(tasks_collection.find({"user_id": str(current_user["_id"])}))
    return [task_to_dict(t) for t in tasks]


# POST create a new task
@router.post("/")
def create_task(task: Task, current_user=Depends(require_user)):
    new_task = task.dict()
    new_task["created_at"] = datetime.utcnow()
    new_task["user_id"] = str(current_user["_id"])
    new_task.pop("category", None)
    result = tasks_collection.insert_one(new_task)
    new_task["id"] = str(result.inserted_id)
    new_task.pop("_id", None)
    new_task.pop("user_id", None)
    return new_task


# PUT update a task (e.g. mark complete)
@router.put("/{task_id}")
def update_task(task_id: str, task_update: TaskUpdate, current_user=Depends(require_user)):
    object_id = ensure_object_id(task_id)
    update_data = {k: v for k, v in task_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = tasks_collection.update_one({"_id": object_id, "user_id": str(current_user["_id"])}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    updated = tasks_collection.find_one({"_id": object_id, "user_id": str(current_user["_id"])})
    return task_to_dict(updated)


# DELETE a task
@router.delete("/{task_id}")
def delete_task(task_id: str, current_user=Depends(require_user)):
    object_id = ensure_object_id(task_id)
    result = tasks_collection.delete_one({"_id": object_id, "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}
