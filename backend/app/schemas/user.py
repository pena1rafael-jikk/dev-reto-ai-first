from datetime import datetime
from pydantic import BaseModel


class ProfileOut(BaseModel):
    id: int
    email: str
    full_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ProfileUpdateIn(BaseModel):
    full_name: str
