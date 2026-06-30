from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.bookmark_repository import BookmarkRepository
from app.services.secop_service import SecopService, SecopServiceError


class BookmarkService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = BookmarkRepository(db)

    async def list(self, user_id: int, filters: dict, limit: int, offset: int):
        return await self.repo.list_by_user(user_id, filters, limit, offset)

    async def create(self, user_id: int, secop_process_id: str):
        existing = await self.repo.get_active_by_user_process(user_id, secop_process_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "BOOKMARK_EXISTS", "message": "El proceso ya está guardado"},
            )
        svc = SecopService()
        try:
            conv = await svc.get_by_id(secop_process_id)
            snapshot = await svc.get_raw_by_id(secop_process_id)
        except SecopServiceError:
            raise HTTPException(
                status_code=502,
                detail={"code": "SECOP_ERROR", "message": "El servicio SECOP no está disponible"},
            )
        if conv is None:
            raise HTTPException(
                status_code=404,
                detail={"code": "NOT_FOUND", "message": "Proceso SECOP no encontrado"},
            )
        return await self.repo.create(user_id, conv, snapshot or {})

    async def soft_delete(self, user_id: int, bookmark_id: int):
        bm = await self.repo.get_by_id(bookmark_id)
        if bm is None or bm.user_id != user_id or bm.deleted_at is not None:
            raise HTTPException(
                status_code=404,
                detail={"code": "NOT_FOUND", "message": "Bookmark no encontrado"},
            )
        return await self.repo.soft_delete(bookmark_id)
