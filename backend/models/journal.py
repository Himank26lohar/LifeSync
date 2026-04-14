from pydantic import BaseModel
from typing import Optional, List, Any

class JournalEntry(BaseModel):
    title: Optional[str] = ""
    body: str
    tag: Optional[str] = "Personal"
    date: Optional[str] = ""
    time: Optional[str] = ""
    media: Optional[List[Any]] = []

class JournalUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    tag: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    media: Optional[List[Any]] = None