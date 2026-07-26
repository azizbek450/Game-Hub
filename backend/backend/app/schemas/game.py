from typing import List, Optional

from pydantic import BaseModel


class GameBase(BaseModel):
    title: str
    description: Optional[str] = None
    icon_url: Optional[str] = None


class GameCreate(GameBase):
    pass


class SkinResponse(BaseModel):
    id: int
    game_id: int
    title: str
    price: float
    image_url: Optional[str] = None
    is_available: bool

    class Config:
        from_attributes = True


class GameResponse(GameBase):
    id: int
    skins: List[SkinResponse] = []

    class Config:
        from_attributes = True