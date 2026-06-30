from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.saved_search import SavedSearch


class SavedSearchRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_by_user(self, user_id: int) -> list[SavedSearch]:
        result = await self.db.execute(
            select(SavedSearch).where(
                SavedSearch.user_id == user_id,
                SavedSearch.deleted_at.is_(None),
            )
        )
        return list(result.scalars().all())

    async def get_by_id(self, search_id: int) -> SavedSearch | None:
        result = await self.db.execute(
            select(SavedSearch).where(SavedSearch.id == search_id)
        )
        return result.scalar_one_or_none()

    async def create(self, user_id: int, name: str, query_params: dict) -> SavedSearch:
        ss = SavedSearch(user_id=user_id, name=name, query_params=query_params)
        self.db.add(ss)
        await self.db.commit()
        await self.db.refresh(ss)
        return ss

    async def update(
        self, search_id: int, name: str | None, query_params: dict | None
    ) -> SavedSearch | None:
        values: dict = {}
        if name is not None:
            values["name"] = name
        if query_params is not None:
            values["query_params"] = query_params
        if values:
            await self.db.execute(
                update(SavedSearch).where(SavedSearch.id == search_id).values(**values)
            )
            await self.db.commit()
        return await self.get_by_id(search_id)

    async def soft_delete(self, search_id: int) -> SavedSearch:
        ss = await self.get_by_id(search_id)
        ss.deleted_at = datetime.now(UTC)
        await self.db.commit()
        await self.db.refresh(ss)
        return ss
