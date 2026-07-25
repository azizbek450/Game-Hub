import sys
import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

# Loyihaning ildiz papkasini sys.path'ga kiritish (Import xatolarini oldini oladi)
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.database.connection import get_db
from backend.database.models import Game, Skin
from backend.app.schemas import GameCreate, GameResponse, SkinCreate, SkinResponse

router = APIRouter()

# --- GAMES ---
@router.post("/", response_model=GameResponse, status_code=status.HTTP_201_CREATED)
def create_game(game_data: GameCreate, db: Session = Depends(get_db)):
    db_game = Game(**game_data.model_dump())
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    return db_game

@router.get("/", response_model=List[GameResponse])
def get_all_games(db: Session = Depends(get_db)):
    return db.query(Game).all()


# --- SKINS ---
@router.post("/skins", response_model=SkinResponse, status_code=status.HTTP_201_CREATED)
def create_skin(skin_data: SkinCreate, db: Session = Depends(get_db)):
    game = db.query(Game).filter(Game.id == skin_data.game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="O'yin topilmadi!")

    db_skin = Skin(**skin_data.model_dump())
    db.add(db_skin)
    db.commit()
    db.refresh(db_skin)
    return db_skin