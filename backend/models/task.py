from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class Task(BaseModel):
    title: str
    desc: Optional[str] = ""
    priority: Optional[str] = "medium"
    tags: Optional[List[str]] = []
    due: Optional[str] = ""
    completed: Optional[bool] = False
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    desc: Optional[str] = None
    priority: Optional[str] = None
    tags: Optional[List[str]] = None
    due: Optional[str] = None
    completed: Optional[bool] = None
    completed_at: Optional[datetime] = None