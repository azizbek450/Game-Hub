from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import WalletTransaction
from app.schemas import (
    WalletTopUpRequest,
    WalletTransactionResponse,
)

router = APIRouter()


@router.post(
    "/topup",
    response_model=WalletTransactionResponse,
)
def create_topup(
    data: WalletTopUpRequest,
    db: Session = Depends(get_db),
):
    transaction = WalletTransaction(
        user_id=data.user_id,
        amount=data.amount,
        transaction_type="deposit",
        payment_method=data.payment_method,
        status="pending",
    )

    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    return transaction


@router.get(
    "/history",
    response_model=List[WalletTransactionResponse],
)
def wallet_history(
    user_id: int,
    db: Session = Depends(get_db),
):
    return (
        db.query(WalletTransaction)
        .filter(
            WalletTransaction.user_id == user_id
        )
        .order_by(
            WalletTransaction.id.desc()
        )
        .all()
    )