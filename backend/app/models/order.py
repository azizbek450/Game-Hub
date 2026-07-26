from datetime import datetime, timezone

from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from .base import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    skin_id = Column(Integer, ForeignKey("skins.id"), nullable=False)

    status = Column(String(30), default="pending")

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="orders")
    skin = relationship("Skin", back_populates="orders")