import sys
import os

# Loyihaning asosiy (ildiz) papkasini Python yo'liga qo'shish
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.database.session import engine
from app.models import Base

from app.api.v1.auth import router as auth_router
from app.api.v1.games import router as games_router
from app.api.v1.orders import router as orders_router
from app.api.v1.wallet import router as wallet_router
from app.api.v1.admin import router as admin_router
from app.api.v1.products import router as products_router

# Ma'lumotlar bazasi jadvallarini avtomatik yaratish
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="YAKUDZA UC & GameHub API",
    version="v2.5.0",
    swagger_ui_parameters={"persistAuthorization": True},
)

# Telegram Mini App va ngrok so'rovlari uchun CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tunnel ogohlantirishlarini aylanib o'tish uchun middleware
@app.middleware("http")
async def add_bypass_header(request: Request, call_next):
    response = await call_next(request)
    response.headers["bypass-tunnel-reminder"] = "true"
    return response

# Frontend fayllarni ulash (Mini App)
frontend_path = os.path.join(
    os.getcwd(),
    "frontend"
)

print("Frontend path:", frontend_path)
print("Exists:", os.path.exists(frontend_path))

app.mount(
    "/app",
    StaticFiles(directory=frontend_path, html=True),
    name="frontend",
)

# Routerlar
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(games_router, prefix="/games", tags=["Games"])
app.include_router(products_router, prefix="/products", tags=["Products"])
app.include_router(orders_router, prefix="/orders", tags=["Orders"])
app.include_router(wallet_router, prefix="/wallet", tags=["Wallet"])
app.include_router(admin_router, prefix="/admin", tags=["Admin"])

@app.get("/")
def home():
    return {
        "status": "online",
        "project": "GAME HUB API",
        "message": "Barcha tizimlar muvaffaqiyatli va xatosiz ishlamoqda!"
    }