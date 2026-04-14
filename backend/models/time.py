from pydantic import BaseModel
from typing import Optional

class FocusSession(BaseModel):
    duration: int = 25
    date: str
    type: Optional[str] = "focus"
    task_id: Optional[str] = ""
    start_time: Optional[str] = ""
    end_time: Optional[str] = ""

class FocusSessionUpdate(BaseModel):
    duration: Optional[int] = None
    date: Optional[str] = None
    type: Optional[str] = None
    task_id: Optional[str] = None

class TimeBlock(BaseModel):
    day: int
    hour: int
    title: str
    color: str
    duration_mins: Optional[int] = 30
    start_frac: Optional[float] = 0.0   # fraction of hour where block starts e.g. 0.5 = 30min past

class TimeBlockUpdate(BaseModel):
    day: Optional[int] = None
    hour: Optional[int] = None
    title: Optional[str] = None
    color: Optional[str] = None
    duration_mins: Optional[int] = None
    start_frac: Optional[float] = None