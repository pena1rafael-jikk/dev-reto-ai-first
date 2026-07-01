from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bookmark import Bookmark


class BookmarkRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_by_user(
        self,
        user_id: int,
        filters: dict | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[Bookmark]:
        q = select(Bookmark).where(Bookmark.user_id == user_id, Bookmark.deleted_at.is_(None))
        if filters:
            if filters.get("entidad"):
                q = q.where(Bookmark.entidad == filters["entidad"])
            if filters.get("departamento"):
                q = q.where(Bookmark.departamento == filters["departamento"])
            if filters.get("estado_apertura"):
                q = q.where(Bookmark.estado_apertura == filters["estado_apertura"])
        q = q.limit(limit).offset(offset)
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def get_by_id(self, bookmark_id: int) -> Bookmark | None:
        result = await self.db.execute(
            select(Bookmark).where(Bookmark.id == bookmark_id)
        )
        return result.scalar_one_or_none()

    async def get_active_by_user_process(
        self, user_id: int, secop_process_id: str
    ) -> Bookmark | None:
        result = await self.db.execute(
            select(Bookmark).where(
                Bookmark.user_id == user_id,
                Bookmark.secop_process_id == secop_process_id,
                Bookmark.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def create(self, user_id: int, conv: object, snapshot: dict) -> Bookmark:
        bm = Bookmark(
            user_id=user_id,
            secop_process_id=conv.secop_process_id,
            entidad=conv.entidad,
            nit_entidad=conv.nit_entidad,
            departamento=conv.departamento,
            ciudad=conv.ciudad,
            nombre_procedimiento=conv.nombre_procedimiento,
            descripcion_procedimiento=conv.descripcion_procedimiento,
            precio_base=conv.precio_base,
            fecha_publicacion=conv.fecha_publicacion,
            fecha_ultima_publicacion=conv.fecha_ultima_publicacion,
            modalidad_contratacion=conv.modalidad_contratacion,
            tipo_contrato=conv.tipo_contrato,
            estado_procedimiento=conv.estado_procedimiento,
            estado_apertura=conv.estado_apertura,
            url_secop=conv.url_secop,
            secop_snapshot=snapshot,
        )
        self.db.add(bm)
        await self.db.commit()
        await self.db.refresh(bm)
        return bm

    async def soft_delete(self, bm: Bookmark) -> Bookmark:
        bm.deleted_at = datetime.now(UTC)
        await self.db.commit()
        await self.db.refresh(bm)
        return bm
