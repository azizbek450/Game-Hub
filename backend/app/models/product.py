from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from .base import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    game_id = Column(
        Integer,
        ForeignKey("games.id"),
        nullable=False,
    )

    name = Column(String(150), nullable=False)

    product_type = Column(
        String(30),
        nullable=False,
    )
    # currency | skin | giftcard | pass | item

    description = Column(String(500), nullable=True)

    price = Column(Float, nullable=False)

    image_url = Column(String(255), nullable=True)

    stock = Column(Integer, default=-1)
    # -1 = cheksiz

    is_active = Column(Boolean, default=True)

    game = relationship(
        "Game",
        back_populates="products",
    )