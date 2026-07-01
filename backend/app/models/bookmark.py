from decimal import Decimal
from datetime import datetime

from sqlalchemy import BigInteger, CheckConstraint, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class Bookmark(Base):
    __tablename__ = "bookmarks"
    __table_args__ = (
        CheckConstraint("length(trim(secop_process_id)) > 0", name="chk_bookmarks_secop_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    secop_process_id: Mapped[str] = mapped_column(Text, nullable=False)
    entidad: Mapped[str | None] = mapped_column(Text)
    nit_entidad: Mapped[str | None] = mapped_column(Text)
    departamento: Mapped[str | None] = mapped_column(Text)
    ciudad: Mapped[str | None] = mapped_column(Text)
    nombre_procedimiento: Mapped[str | None] = mapped_column(Text)
    descripcion_procedimiento: Mapped[str | None] = mapped_column(Text)
    precio_base: Mapped[Decimal | None] = mapped_column(Numeric(18, 2))
    fecha_publicacion: Mapped[datetime | None] = mapped_column(nullable=True)
    fecha_ultima_publicacion: Mapped[datetime | None] = mapped_column(nullable=True)
    modalidad_contratacion: Mapped[str | None] = mapped_column(Text)
    tipo_contrato: Mapped[str | None] = mapped_column(Text)
    estado_procedimiento: Mapped[str | None] = mapped_column(Text)
    estado_apertura: Mapped[str | None] = mapped_column(Text)
    url_secop: Mapped[str | None] = mapped_column(Text)
    secop_snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
