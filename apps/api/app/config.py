from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_env: str = "development"
    app_debug: bool = True
    database_url: str = "postgresql+asyncpg://vault:vault@localhost:5432/vault"
    database_url_sync: str = "postgresql://vault:vault@localhost:5432/vault"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str = "change-me-in-production"
    auth_required: bool = False
    anthropic_api_key: str = ""
    cors_origins: str = "http://localhost:3000"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
