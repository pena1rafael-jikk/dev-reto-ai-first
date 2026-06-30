from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.auth import LoginIn, RegisterIn, RegisterOut, TokenOut
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=RegisterOut, status_code=201)
async def register(body: RegisterIn, db: AsyncSession = Depends(get_db)):
    result = await AuthService(db).register(body.email, body.password, body.full_name)
    return {"data": result, **result}


@router.post("/login", response_model=TokenOut)
async def login(body: LoginIn, db: AsyncSession = Depends(get_db)):
    return await AuthService(db).login(body.email, body.password)
