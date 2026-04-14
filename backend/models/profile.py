from pydantic import BaseModel
from typing import List


class ProfileTarget(BaseModel):
    id: str
    title: str = ""
    description: str = ""
    done: bool = False


class ProfileMonth(BaseModel):
    month: str
    targets: List[ProfileTarget] = []
    notes: str = ""


class ProfileYear(BaseModel):
    yearlyGoals: List[ProfileTarget] = []
    months: List[ProfileMonth] = []


class ProfileIdentity(BaseModel):
    name: str = ""
    bio: str = ""
    location: str = ""
    cover: str = ""


class ProfileMilestone(BaseModel):
    id: str
    title: str = ""
    date: str = ""
    description: str = ""


class ProfileDocument(BaseModel):
    profile: ProfileIdentity
    selectedYear: int
    goalsByYear: dict[str, ProfileYear]
    milestones: List[ProfileMilestone] = []
