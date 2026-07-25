import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.config import settings

# Loyihaning ildiz papkasini sys.path'ga kiritish (Import xatolarini oldini oladi)
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

# Baza bilan ulanishni hosil qilamiz
engine = create_engine(settings.DATABASE_URL)

# Har bir so'rov (request) uchun alohida seans ochish uchun xizmat qiladi
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Barcha SQL jadvallarimiz (modellarimiz) vorislik oladigan asosiy klas
Base = declarative_base()

# Har bir API so'rovda bazani ochib, ish tugagach yopadigan funksiya (Dependency)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()