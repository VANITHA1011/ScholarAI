from datetime import datetime, timedelta
from typing import Union, Any
from jose import jwt

import os

# Security Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "SUPER_SECRET_SCHOLARSHIP_AI_PLATFORM_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

import bcrypt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def create_access_token(subject: Union[str, Any], role: str = None, expires_delta: timedelta = None, extra_claims: dict = None) -> str:
    if expires_delta:
      expire = datetime.utcnow() + expires_delta
    else:
      expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    if role:
        to_encode["role"] = role
    if extra_claims:
        to_encode.update(extra_claims)
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

