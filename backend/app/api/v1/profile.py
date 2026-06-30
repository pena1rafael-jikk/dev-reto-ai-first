from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.repositories.user_repository import UserRepository
from app.schemas.user import ProfileOut, ProfileUpdateIn

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=ProfileOut)
async def get_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user = await UserRepository(db).get_by_id(current_user["id"])
    return user


@router.put("", response_model=ProfileOut)
async def update_profile(
    body: ProfileUpdateIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user = await UserRepository(db).update(current_user["id"], body.full_name)
    return user
