from datetime import datetime

from pydantic import BaseModel


class OrderCreate(BaseModel):
    user_id: int
    skin_id: int


class OrderResponse(BaseModel):
    id: int
    user_id: int
    skin_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True