from app.db.database import Base, engine
from fastapi import FastAPI, Depends, Request
from fastapi.responses import JSONResponse

from app.api.endpoints import users, projects, tasks
from app.middleware.security import get_user_by_token
from app.middleware.middleware import logging_middleware, logger
from contextlib import asynccontextmanager
# Base.metadata.create_all(bind=engine)
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Создаём таблицы
    Base.metadata.create_all(bind=engine)
    
    # 🔥 Создаём FTS-индекс через raw SQL (только для PostgreSQL)
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_tasks_title_tsv 
            ON tasks USING GIN (to_tsvector('russian'::regconfig, title))
        """))
        conn.commit()
    
    yield  # Запуск приложения
    
    # Опционально: закрытие ресурсов
    engine.dispose()


app = FastAPI()
app.include_router(users.router, prefix="/api/v1", tags=["Users"])
app.include_router(projects.router, prefix="/api/v1", tags=["Projects"])
app.include_router(tasks.router, prefix="/api/v1", tags=["Tasks"])
origins = ['*']

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Alarm! Global exception!")
    return JSONResponse(
        status_code=500, content={"error": "O-o-o-ps! Internal server error"}
    )


@app.get("/")
def read_root():
    return {"message": "meow"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
    )