from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+pg8000://meiw:meiw@localhost:5432/meiw"
    SECRET_KEY: str = "test"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30
    SALT: str = "test"

    class Config:
        env_file = ".env"


settings = Settings()