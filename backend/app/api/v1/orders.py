import sys
import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

# Loyihaning ildiz papkasini sys.path'ga kiritish (Import xatolarini oldini oladi)
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.database.session import get_db
from app.models import Wallet, Order, Skin, User
from app.schemas import WalletResponse, WalletTopUp, OrderCreate, OrderResponse

router = APIRouter()

# --- HAMYONGA PUL TASHALASH (Top Up) ---
@router.post("/wallet/topup", response_model=WalletResponse)
def top_up_wallet(data: WalletTopUp, db: Session = Depends(get_db)):
    wallet = db.query(Wallet).filter(Wallet.user_id == data.user_id).first()
    
    # Agar foydalanuvchida hali hamyon bo'lmasa, yangi ochamiz
    if not wallet:
        wallet = Wallet(user_id=data.user_id, balance=data.amount)
        db.add(wallet)
    else:
        wallet.balance += data.amount

    db.commit()
    db.refresh(wallet)
    return wallet


# --- SKIN / ITEM SOTIB OLISH ---
@router.post("/buy", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def buy_skin(order_data: OrderCreate, db: Session = Depends(get_db)):
    # 1. Skin va User borligini tekshiramiz
    skin = db.query(Skin).filter(Skin.id == order_data.skin_id).first()
    if not skin or not skin.is_available:
        raise HTTPException(status_code=404, detail="Skin topilmadi yoki sotuvda yo'q!")

    wallet = db.query(Wallet).filter(Wallet.user_id == order_data.user_id).first()
    if not wallet or wallet.balance < skin.price:
        raise HTTPException(status_code=400, detail="Mabla'g yetarli emas!")

    # 2. Balansdan pulni yechamiz
    wallet.balance -= skin.price

    # 3. Buyurtma yaratamiz
    new_order = Order(
        user_id=order_data.user_id,
        skin_id=skin.id,
        amount=skin.price,
        status="completed"
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order