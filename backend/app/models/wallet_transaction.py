from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    DateTime,
    ForeignKey,
)

from .base import Base


class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    amount = Column(Float, nullable=False)

    transaction_type = Column(
        String(20),
        nullable=False,
    )
    # deposit | purchase | refund

    status = Column(
        String(20),
        default="pending",
    )
    # pending | success | cancelled

    payment_method = Column(
        String(30),
        nullable=True,
    )
    # p2p | click | payme

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )