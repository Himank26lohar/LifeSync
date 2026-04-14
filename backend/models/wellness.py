from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class WellnessLog(BaseModel):
    mood: int
    sleep: float
    energy: Optional[int] = 3        # 1-5
    stress: Optional[int] = 3        # 1-5
    tags: Optional[List[str]] = []   # ["Anxious", "Calm", etc]
    note: Optional[str] = ""
    date: Optional[str] = ""
    day: Optional[str] = ""
    logged_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

class WellnessUpdate(BaseModel):
    mood: Optional[int] = None
    sleep: Optional[float] = None
    energy: Optional[int] = None
    stress: Optional[int] = None
    tags: Optional[List[str]] = None
    note: Optional[str] = None