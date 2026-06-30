from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.bookmark import BookmarkCreate, BookmarkOut
from app.services.bookmark_service import BookmarkService

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


@router.get("", response_model=dict)
async def list_bookmarks(
    entidad: str | None = Query(None),
    departamento: str | None = Query(None),
    estado_apertura: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    filters = dict(entidad=entidad, departamento=departamento, estado_apertura=estado_apertura)
    items = await BookmarkService(db).list(current_user["id"], filters, limit, offset)
    return {"data": [BookmarkOut.model_validate(i).model_dump() for i in items], "meta": {"limit": limit, "offset": offset}}


@router.post("", response_model=dict, status_code=201)
async def create_bookmark(
    body: BookmarkCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    bm = await BookmarkService(db).create(current_user["id"], body.secop_process_id)
    return {"data": BookmarkOut.model_validate(bm).model_dump()}


@router.delete("/{bookmark_id}", response_model=dict)
async def delete_bookmark(
    bookmark_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    bm = await BookmarkService(db).soft_delete(current_user["id"], bookmark_id)
    return {"data": {"id": bm.id, "deleted_at": bm.deleted_at.isoformat()}}
