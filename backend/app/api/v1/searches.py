from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.saved_search import SavedSearchCreate, SavedSearchOut, SavedSearchUpdate
from app.services.saved_search_service import SavedSearchService

router = APIRouter(prefix="/searches", tags=["searches"])


@router.get("", response_model=dict)
async def list_searches(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    items = await SavedSearchService(db).list(current_user["id"])
    return {"data": [SavedSearchOut.model_validate(i).model_dump() for i in items]}


@router.post("", response_model=dict, status_code=201)
async def create_search(
    body: SavedSearchCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ss = await SavedSearchService(db).create(current_user["id"], body.name, body.query_params)
    return {"data": SavedSearchOut.model_validate(ss).model_dump()}


@router.put("/{search_id}", response_model=dict)
async def update_search(
    search_id: int,
    body: SavedSearchUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ss = await SavedSearchService(db).update(current_user["id"], search_id, body.name, body.query_params)
    return {"data": SavedSearchOut.model_validate(ss).model_dump()}


@router.delete("/{search_id}", response_model=dict)
async def delete_search(
    search_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ss = await SavedSearchService(db).soft_delete(current_user["id"], search_id)
    return {"data": {"id": ss.id, "deleted_at": ss.deleted_at.isoformat()}}
