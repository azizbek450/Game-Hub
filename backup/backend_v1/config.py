import sys
import os
from pydantic_settings import BaseSettings

# Loyihaning ildiz papkasini Python yo'liga kiritish (Import xatolarini oldini oladi)
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

class Settings(BaseSettings):
    # Proekt sozlamalari
    PROJECT_NAME: str = "GameHub API"
    
    # Ma'lumotlar bazasi (PostgreSQL) sozlamalari
    DATABASE_URL: str = "postgresql://postgres:11121509@localhost:5432/gamehub_db"
    
    # Xavfsizlik (JWT va Hashing) kalitlari
    SECRET_KEY: str = "SUPER_MAXFIY_KATTAN_KALIT_KEYIN_ALMASHTIRASIZ"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # Token 7 kun amal qiladi
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()