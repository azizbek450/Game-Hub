from pydantic import BaseModel


class WalletResponse(BaseModel):
    id: int
    user_id: int
    balance: float
    currency: str

    class Config:
        from_attributes = True


class WalletTopUp(BaseModel):
    user_id: int
    amount: float