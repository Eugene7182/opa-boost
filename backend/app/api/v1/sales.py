"""Sales API."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.schemas.sales import SaleCreate, SaleResponse
from app.services import sales as sales_service

router = APIRouter()


@router.post("", response_model=SaleResponse)
async def create_sale(payload: SaleCreate, db: Session = Depends(get_db)):
    sale, calculation = sales_service.create_sale(db, payload)
    sale_schema = SaleResponse.model_validate(sale)
    return sale_schema.model_copy(update={"calculation": calculation})
