import sys
import os
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

# Loyihaning ildiz papkasini sys.path'ga kiritish
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))


# --- USER SCHEMAS ---
class UserCreate(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: Optional[str] = None
    full_name: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str


# --- SKIN SCHEMAS ---
class SkinBase(BaseModel):
    title: str
    price: float
    image_url: Optional[str] = None
    is_available: Optional[bool] = True

class SkinCreate(SkinBase):
    game_id: int

class SkinResponse(SkinBase):
    id: int
    game_id: int

    class Config:
        from_attributes = True


# --- GAME SCHEMAS ---
class GameBase(BaseModel):
    title: str
    description: Optional[str] = None
    icon_url: Optional[str] = None

class GameCreate(GameBase):
    pass

class GameResponse(GameBase):
    id: int
    skins: List[SkinResponse] = []

    class Config:
        from_attributes = True


# --- WALLET SCHEMAS ---
class WalletResponse(BaseModel):
    id: int
    user_id: int
    balance: float
    currency: str

    class Config:
        from_attributes = True

class WalletTopUp(BaseModel):
    user_id: int
    amount: float


# --- ORDER SCHEMAS ---
class OrderCreate(BaseModel):
    user_id: int
    product_id: int


class OrderResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    amount: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- ADMIN SCHEMAS ---
class UserAdminResponse(BaseModel):
    id: int
    username: Optional[str] = None
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ---------------- PRODUCT ----------------

class ProductCreate(BaseModel):
    game_id: int
    name: str
    product_type: str
    description: str | None = None
    price: float
    image_url: str | None = None
    stock: int = -1
    is_active: bool = True


class ProductResponse(ProductCreate):
    id: int

    class Config:
        from_attributes = True


class WalletTransactionResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    transaction_type: str
    status: str
    payment_method: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True

class WalletTopUpRequest(BaseModel):
    user_id: int
    amount: float
    payment_method: str = "p2p"


class WalletTransactionResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    transaction_type: str
    status: str
    payment_method: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True