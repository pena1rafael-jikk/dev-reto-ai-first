from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class BookmarkCreate(BaseModel):
    secop_process_id: str


class BookmarkOut(BaseModel):
    id: int
    user_id: int
    secop_process_id: str
    entidad: str | None = None
    departamento: str | None = None
    ciudad: str | None = None
    nombre_procedimiento: str | None = None
    precio_base: Decimal | None = None
    estado_apertura: str | None = None
    url_secop: str | None = None
    created_at: datetime
    deleted_at: datetime | None = None

    model_config = {"from_attributes": True}
