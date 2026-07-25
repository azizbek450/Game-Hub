import sys
import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from passlib.context import CryptContext
import jwt

# Loyihaning ildiz papkasini sys.path'ga kiritish (Import xatolarini oldini oladi)
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.config import settings

# Parollarni heshlash (shifrlash) uchun sozlama
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Parolni shifrlab hesh holatiga keltirish"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Kiritilgan parolni bazadagi heshlangan parol bilan solishtirish"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Foydalanuvchi uchun xavfsiz JWT token yaratish"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt