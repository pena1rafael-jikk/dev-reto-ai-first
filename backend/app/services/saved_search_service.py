from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.saved_search_repository import SavedSearchRepository


class SavedSearchService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = SavedSearchRepository(db)

    async def list(self, user_id: int):
        return await self.repo.list_by_user(user_id)

    async def create(self, user_id: int, name: str, query_params: dict):
        return await self.repo.create(user_id, name, query_params)

    async def update(self, user_id: int, search_id: int, name: str | None, query_params: dict | None):
        ss = await self.repo.get_by_id(search_id)
        if ss is None or ss.user_id != user_id or ss.deleted_at is not None:
            raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Búsqueda no encontrada"})
        return await self.repo.update(search_id, name, query_params)

    async def soft_delete(self, user_id: int, search_id: int):
        ss = await self.repo.get_by_id(search_id)
        if ss is None or ss.user_id != user_id or ss.deleted_at is not None:
            raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Búsqueda no encontrada"})
        return await self.repo.soft_delete(search_id)
