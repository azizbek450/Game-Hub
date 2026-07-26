import sys
import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.database.session import get_db
from app.models import Wallet, Order, Product
from app.schemas import WalletResponse, WalletTopUp, OrderCreate, OrderResponse

router = APIRouter()


@router.post("/wallet/topup", response_model=WalletResponse)
def top_up_wallet(data: WalletTopUp, db: Session = Depends(get_db)):
    wallet = db.query(Wallet).filter(Wallet.user_id == data.user_id).first()

    if not wallet:
        wallet = Wallet(user_id=data.user_id, balance=data.amount)
        db.add(wallet)
    else:
        wallet.balance += data.amount

    db.commit()
    db.refresh(wallet)
    return wallet


@router.post("/buy", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def buy_product(order_data: OrderCreate, db: Session = Depends(get_db)):

    product = db.query(Product).filter(Product.id == order_data.product_id).first()

    if not product or not product.is_active:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi!")

    wallet = db.query(Wallet).filter(Wallet.user_id == order_data.user_id).first()

    if not wallet or wallet.balance < product.price:
        raise HTTPException(status_code=400, detail="Mablag' yetarli emas!")

    wallet.balance -= product.price

    new_order = Order(
    user_id=order_data.user_id,
    product_id=product.id,
    amount=product.price,
    status="pending",
)

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    return new_order