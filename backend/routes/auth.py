from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pymongo.errors import PyMongoError

from auth import create_session_token, hash_password, require_user, serialize_user, verify_password
from database import users_collection
from models.user import AuthCredentials

router = APIRouter()


def _normalize_username(username: str) -> str:
    return username.strip().lower()


@router.post("/signup")
def signup(credentials: AuthCredentials):
    try:
        username = _normalize_username(credentials.username)
        if users_collection.find_one({"username": username}):
            raise HTTPException(status_code=400, detail="Username already exists")

        salt, password_hash = hash_password(credentials.password)
        session_token = create_session_token()
        user_doc = {
            "username": username,
            "password_salt": salt,
            "password_hash": password_hash,
            "session_token": session_token,
            "created_at": datetime.utcnow(),
        }
        result = users_collection.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id

        return {
            "token": session_token,
            "user": serialize_user(user_doc),
        }
    except HTTPException:
        raise
    except PyMongoError:
        raise HTTPException(status_code=503, detail="Database unavailable. Check MongoDB connection and Atlas network access.")


@router.post("/login")
def login(credentials: AuthCredentials):
    try:
        username = _normalize_username(credentials.username)
        user = users_collection.find_one({"username": username})
        if not user or not verify_password(credentials.password, user["password_salt"], user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid username or password")

        session_token = create_session_token()
        users_collection.update_one({"_id": user["_id"]}, {"$set": {"session_token": session_token}})
        user["session_token"] = session_token

        return {
            "token": session_token,
            "user": serialize_user(user),
        }
    except HTTPException:
        raise
    except PyMongoError:
        raise HTTPException(status_code=503, detail="Database unavailable. Check MongoDB connection and Atlas network access.")


@router.get("/me")
def me(current_user=Depends(require_user)):
    try:
        return {"user": serialize_user(current_user)}
    except PyMongoError:
        raise HTTPException(status_code=503, detail="Database unavailable. Check MongoDB connection and Atlas network access.")


@router.post("/logout")
def logout(current_user=Depends(require_user)):
    try:
        users_collection.update_one({"_id": current_user["_id"]}, {"$unset": {"session_token": ""}})
        return {"message": "Logged out"}
    except PyMongoError:
        raise HTTPException(status_code=503, detail="Database unavailable. Check MongoDB connection and Atlas network access.")
