from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import Product
from app.schemas import ProductCreate, ProductResponse

router = APIRouter()


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
):
    product = Product(**product_data.model_dump())

    db.add(product)
    db.commit()
    db.refresh(product)

    return product


@router.get("/", response_model=List[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Mahsulot topilmadi",
        )

    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_data: ProductCreate,
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Mahsulot topilmadi",
        )

    for key, value in product_data.model_dump().items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)

    return product


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Mahsulot topilmadi",
        )

    db.delete(product)
    db.commit()

    return {
        "message": "Mahsulot muvaffaqiyatli o'chirildi"
    }