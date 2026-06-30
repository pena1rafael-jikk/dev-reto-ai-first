from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, get_password_hash, verify_password
from app.repositories.user_repository import UserRepository


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = UserRepository(db)

    async def register(self, email: str, password: str, full_name: str) -> dict:
        existing = await self.repo.get_by_email(email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "EMAIL_ALREADY_EXISTS", "message": "El email ya está registrado"},
            )
        user = await self.repo.create(
            email=email,
            password_hash=get_password_hash(password),
            full_name=full_name,
        )
        token = create_access_token(sub=user.id, email=user.email)
        return {"id": user.id, "email": user.email, "full_name": user.full_name, "access_token": token}

    async def login(self, email: str, password: str) -> dict:
        user = await self.repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "INVALID_CREDENTIALS", "message": "Credenciales inválidas"},
            )
        token = create_access_token(sub=user.id, email=user.email)
        return {"access_token": token, "token_type": "bearer"}
