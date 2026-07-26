import sys
import os
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.database.session import get_db
from app.models import Game, Product
from app.schemas import (
    GameCreate,
    GameResponse,
    ProductCreate,
    ProductResponse,
)

router = APIRouter()


# ---------- GAMES ----------

@router.post("/", response_model=GameResponse, status_code=status.HTTP_201_CREATED)
def create_game(game_data: GameCreate, db: Session = Depends(get_db)):
    game = Game(**game_data.model_dump())
    db.add(game)
    db.commit()
    db.refresh(game)
    return game


@router.get("/", response_model=List[GameResponse])
def get_games(db: Session = Depends(get_db)):
    return db.query(Game).all()


# ---------- PRODUCTS ----------

@router.post("/products", response_model=ProductResponse)
def create_product(product_data: ProductCreate, db: Session = Depends(get_db)):
    game = db.query(Game).filter(Game.id == product_data.game_id).first()

    if not game:
        raise HTTPException(404, "Game topilmadi")

    product = Product(**product_data.model_dump())

    db.add(product)
    db.commit()
    db.refresh(product)

    return product