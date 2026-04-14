import hashlib
import hmac
import secrets

from fastapi import Header, HTTPException
from bson import ObjectId

from database import users_collection


def hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    actual_salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        actual_salt.encode("utf-8"),
        100000,
    )
    return actual_salt, digest.hex()


def verify_password(password: str, salt: str, expected_hash: str) -> bool:
    _, candidate = hash_password(password, salt)
    return hmac.compare_digest(candidate, expected_hash)


def create_session_token() -> str:
    return secrets.token_urlsafe(32)


def serialize_user(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "username": doc["username"],
        "created_at": doc.get("created_at"),
    }


def require_user(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")

    user = users_collection.find_one({"session_token": token})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    return user


def ensure_object_id(value: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=400, detail="Invalid id")
    return ObjectId(value)
