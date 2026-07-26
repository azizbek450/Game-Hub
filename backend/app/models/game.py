from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from .base import Base


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    icon_url = Column(String, nullable=True)

    skins = relationship(
        "Skin",
        back_populates="game",
        cascade="all, delete-orphan",
    )