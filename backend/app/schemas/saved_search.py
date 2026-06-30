from datetime import datetime
from pydantic import BaseModel


class SavedSearchCreate(BaseModel):
    name: str
    query_params: dict


class SavedSearchUpdate(BaseModel):
    name: str | None = None
    query_params: dict | None = None


class SavedSearchOut(BaseModel):
    id: int
    user_id: int
    name: str
    query_params: dict
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
