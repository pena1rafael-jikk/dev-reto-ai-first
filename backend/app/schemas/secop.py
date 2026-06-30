from datetime import datetime
from decimal import Decimal, InvalidOperation

from pydantic import BaseModel, field_validator


class SecopConvocatoria(BaseModel):
    secop_process_id: str | None = None
    entidad: str | None = None
    nit_entidad: str | None = None
    departamento: str | None = None
    ciudad: str | None = None
    nombre_procedimiento: str | None = None
    descripcion_procedimiento: str | None = None
    precio_base: Decimal | None = None
    fecha_publicacion: datetime | None = None
    fecha_ultima_publicacion: datetime | None = None
    modalidad_contratacion: str | None = None
    tipo_contrato: str | None = None
    estado_procedimiento: str | None = None
    estado_apertura: str | None = None
    url_secop: str | None = None

    model_config = {"from_attributes": True}


def _safe_decimal(value: object) -> Decimal | None:
    if value is None or str(value).strip() == "":
        return None
    try:
        return Decimal(str(value))
    except InvalidOperation:
        return None


def _safe_datetime(value: object) -> datetime | None:
    if value is None or str(value).strip() == "":
        return None
    try:
        raw = str(value).rstrip("Z").split(".")[0]
        return datetime.fromisoformat(raw)
    except (ValueError, AttributeError):
        return None


def map_secop_response(raw: dict) -> SecopConvocatoria:
    url_secop = None
    urlproceso = raw.get("urlproceso")
    if isinstance(urlproceso, dict):
        url_secop = urlproceso.get("url")
    elif isinstance(urlproceso, str):
        url_secop = urlproceso

    return SecopConvocatoria(
        secop_process_id=raw.get("id_del_proceso"),
        entidad=raw.get("entidad"),
        nit_entidad=raw.get("nit_entidad"),
        departamento=raw.get("departamento_entidad"),
        ciudad=raw.get("ciudad_entidad"),
        nombre_procedimiento=raw.get("nombre_del_procedimiento"),
        descripcion_procedimiento=raw.get("descripci_n_del_procedimiento"),
        precio_base=_safe_decimal(raw.get("precio_base")),
        fecha_publicacion=_safe_datetime(raw.get("fecha_de_publicacion_del")),
        fecha_ultima_publicacion=_safe_datetime(raw.get("fecha_de_ultima_publicaci")),
        modalidad_contratacion=raw.get("modalidad_de_contratacion"),
        tipo_contrato=raw.get("tipo_de_contrato"),
        estado_procedimiento=raw.get("estado_del_procedimiento"),
        estado_apertura=raw.get("estado_de_apertura_del_proceso"),
        url_secop=url_secop,
    )
