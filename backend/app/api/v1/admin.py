import sys
import os
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.database.session import get_db
from app.models import User, Order, Wallet, WalletTransaction
from app.schemas import (
    UserAdminResponse,
    OrderResponse,
    WalletResponse,
    WalletTopUp,
    WalletTransactionResponse,
)

router = APIRouter()


# ================= USERS =================

@router.get("/users", response_model=List[UserAdminResponse])
def get_all_users(db: Session = Depends(get_db)):
    return db.query(User).all()


@router.put("/users/{user_id}/make-admin")
def make_user_admin(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")

    user.role = "admin"
    db.commit()

    return {"message": "Admin qilindi"}


# ================= ORDERS =================

@router.get("/orders", response_model=List[OrderResponse])
def get_all_orders(db: Session = Depends(get_db)):
    return (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .all()
    )


# ================= PENDING TRANSACTIONS =================

@router.get(
    "/transactions/pending",
    response_model=List[WalletTransactionResponse],
)
def pending_transactions(db: Session = Depends(get_db)):
    return (
        db.query(WalletTransaction)
        .filter(WalletTransaction.status == "pending")
        .all()
    )


# ================= APPROVE TRANSACTION =================

@router.post("/transactions/{transaction_id}/approve")
def approve_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
):
    transaction = (
        db.query(WalletTransaction)
        .filter(WalletTransaction.id == transaction_id)
        .first()
    )

    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="Transaction topilmadi",
        )

    if transaction.status == "success":
        raise HTTPException(
            status_code=400,
            detail="Bu transaction allaqachon tasdiqlangan",
        )

    wallet = (
        db.query(Wallet)
        .filter(Wallet.user_id == transaction.user_id)
        .first()
    )

    if not wallet:
        wallet = Wallet(
            user_id=transaction.user_id,
            balance=0,
        )
        db.add(wallet)

    wallet.balance += transaction.amount
    transaction.status = "success"

    db.commit()

    return {
        "message": "Wallet to'ldirildi",
        "balance": wallet.balance,
    }
