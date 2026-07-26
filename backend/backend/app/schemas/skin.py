from typing import Optional

from pydantic import BaseModel


class SkinBase(BaseModel):
    title: str
    price: float
    image_url: Optional[str] = None
    is_available: bool = True


class SkinCreate(SkinBase):
    game_id: int


class SkinResponse(SkinBase):
    id: int
    game_id: int

    class Config:
        from_attributes = True