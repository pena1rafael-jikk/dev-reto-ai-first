from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    postgres_db: str = "convocatorias"
    postgres_user: str = "convocatorias_user"
    postgres_password: str = "changeme"
    postgres_host: str = "db"
    postgres_port: int = 5432
    database_url: str = ""

    def model_post_init(self, __context: object) -> None:
        if not self.database_url:
            object.__setattr__(
                self,
                "database_url",
                f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
                f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}",
            )
        if self.secret_key == "change-this-secret":
            raise RuntimeError(
                "SECRET_KEY no configurado. Copia .env.example a .env y define SECRET_KEY."
            )

    # JWT
    secret_key: str = "change-this-secret"
    access_token_expire_minutes: int = 60

    # SECOP / SODA
    soda_base_url: str = "https://www.datos.gov.co/resource/p6dx-8zbt.json"

    # CORS
    cors_origins: str = "http://localhost:4200"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


settings = Settings()
