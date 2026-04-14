from pydantic import BaseModel
from typing import Optional, List

class Habit(BaseModel):
    name: str
    icon: str = "flame"
    color: str = "#a855f7"
    streak: int = 0
    completed_today: bool = False
    week_progress: List[bool] = [False]*7
    month_progress: Optional[List[bool]] = None

class HabitUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    streak: Optional[int] = None
    completed_today: Optional[bool] = None
    week_progress: Optional[List[bool]] = None
    month_progress: Optional[List[bool]] = None