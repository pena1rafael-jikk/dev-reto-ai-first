from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import get_current_user
from app.schemas.secop import SecopConvocatoria
from app.services.secop_service import SecopService, SecopServiceError

router = APIRouter(prefix="/convocatorias", tags=["convocatorias"])

_502 = HTTPException(
    status_code=502,
    detail={"code": "SECOP_ERROR", "message": "El servicio SECOP no está disponible"},
)


@router.get("", response_model=dict)
async def list_convocatorias(
    q: str | None = Query(None),
    entidad: str | None = Query(None),
    departamento: str | None = Query(None),
    estado_apertura: str | None = Query(None),
    tipo_contrato: str | None = Query(None),
    modalidad: str | None = Query(None),
    fecha_desde: str | None = Query(None),
    fecha_hasta: str | None = Query(None),
    precio_min: str | None = Query(None),
    precio_max: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _: dict = Depends(get_current_user),
):
    filters = dict(
        q=q, entidad=entidad, departamento=departamento,
        estado_apertura=estado_apertura, tipo_contrato=tipo_contrato,
        modalidad=modalidad, fecha_desde=fecha_desde, fecha_hasta=fecha_hasta,
        precio_min=precio_min, precio_max=precio_max,
    )
    try:
        items = await SecopService().search(filters, limit=limit, offset=offset)
    except SecopServiceError:
        raise _502
    return {
        "data": [item.model_dump() for item in items],
        "meta": {"limit": limit, "offset": offset, "total": len(items)},
    }


@router.get("/{secop_process_id}", response_model=dict)
async def get_convocatoria(
    secop_process_id: str,
    _: dict = Depends(get_current_user),
):
    try:
        item = await SecopService().get_by_id(secop_process_id)
    except SecopServiceError:
        raise _502
    if item is None:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Proceso SECOP no encontrado"},
        )
    return {"data": item.model_dump()}
