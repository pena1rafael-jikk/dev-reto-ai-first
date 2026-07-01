import httpx

from app.core.config import settings
from app.schemas.secop import SecopConvocatoria, map_secop_response


class SecopServiceError(Exception):
    pass


def _escape_soql(value: str) -> str:
    return value.replace("'", "''")


class SecopService:
    def __init__(self) -> None:
        self._base_url = settings.soda_base_url

    def _build_where(self, filters: dict) -> str:
        clauses: list[str] = []

        for field in ("entidad", "departamento", "estado_apertura", "tipo_contrato", "modalidad"):
            val = filters.get(field)
            if val:
                col = {
                    "departamento": "departamento_entidad",
                    "estado_apertura": "estado_de_apertura_del_proceso",
                    "tipo_contrato": "tipo_de_contrato",
                    "modalidad": "modalidad_de_contratacion",
                }.get(field, field)
                clauses.append(f"{col}='{_escape_soql(val)}'")

        fecha_desde = filters.get("fecha_desde")
        fecha_hasta = filters.get("fecha_hasta")
        if fecha_desde:
            clauses.append(f"fecha_de_publicacion_del>='{_escape_soql(fecha_desde)}'")
        if fecha_hasta:
            clauses.append(f"fecha_de_publicacion_del<='{_escape_soql(fecha_hasta)}'")

        precio_min = filters.get("precio_min")
        precio_max = filters.get("precio_max")
        if precio_min is not None:
            clauses.append(f"precio_base>='{_escape_soql(str(precio_min))}'")
        if precio_max is not None:
            clauses.append(f"precio_base<='{_escape_soql(str(precio_max))}'")

        return " AND ".join(clauses)

    async def search(
        self, filters: dict, limit: int = 20, offset: int = 0
    ) -> list[SecopConvocatoria]:
        params: dict = {"$limit": limit, "$offset": offset}
        q = filters.get("q")
        if q:
            params["$q"] = q
        where = self._build_where(filters)
        if where:
            params["$where"] = where

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(self._base_url, params=params)
                resp.raise_for_status()
                return [map_secop_response(item) for item in resp.json()]
        except (httpx.RequestError, httpx.HTTPStatusError) as exc:
            raise SecopServiceError("SODA API no disponible") from exc

    async def get_by_id(self, secop_process_id: str) -> SecopConvocatoria | None:
        safe_id = _escape_soql(secop_process_id)
        params = {"$where": f"id_del_proceso='{safe_id}'", "$limit": 1}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(self._base_url, params=params)
                resp.raise_for_status()
                items = resp.json()
                if not items:
                    return None
                return map_secop_response(items[0])
        except (httpx.RequestError, httpx.HTTPStatusError) as exc:
            raise SecopServiceError("SODA API no disponible") from exc

    async def get_raw_by_id(self, secop_process_id: str) -> dict | None:
        safe_id = _escape_soql(secop_process_id)
        params = {"$where": f"id_del_proceso='{safe_id}'", "$limit": 1}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(self._base_url, params=params)
                resp.raise_for_status()
                items = resp.json()
                return items[0] if items else None
        except (httpx.RequestError, httpx.HTTPStatusError) as exc:
            raise SecopServiceError("SODA API no disponible") from exc
