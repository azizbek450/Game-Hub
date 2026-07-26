import sys
import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

# Loyihaning ildiz papkasini sys.path'ga kiritish (Import xatolarini oldini oladi)
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.database.session import get_db
from app.models import User, Order, Wallet
from app.schemas import UserAdminResponse, OrderResponse, WalletResponse, WalletTopUp

router = APIRouter()

# 1. Barcha foydalanuvchilarni ko'rish
@router.get("/users", response_model=List[UserAdminResponse])
def get_all_users(db: Session = Depends(get_db)):
    return db.query(User).all()

# 2. Barcha buyurtmalarni (Orders) ko'rish
@router.get("/orders", response_model=List[OrderResponse])
def get_all_orders(db: Session = Depends(get_db)):
    return db.query(Order).order_by(Order.created_at.desc()).all()

# 3. Foydalanuvchini Admin qilish
@router.put("/users/{user_id}/make-admin")
def make_user_admin(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi!")
    
    user.role = "admin"
    db.commit()
    return {"message": f"{user.full_name} muvaffaqiyatli ADMIN qilindi!"}