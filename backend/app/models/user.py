from datetime import datetime, timezone

from sqlalchemy import BigInteger, Boolean, Column, DateTime, String
from sqlalchemy.orm import relationship

from .base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, index=True)

    telegram_id = Column(BigInteger, unique=True, nullable=True)

    username = Column(String(50), unique=True, nullable=False)

    full_name = Column(String(150), nullable=True)

    hashed_password = Column(String(255), nullable=False)

    role = Column(String(20), default="user")

    is_active = Column(Boolean, default=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    wallet = relationship(
        "Wallet",
        back_populates="user",
        uselist=False,
    )

    orders = relationship(
        "Order",
        back_populates="user",
    )