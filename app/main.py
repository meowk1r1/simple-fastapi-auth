from app.db.database import Base, engine
from fastapi import FastAPI, Depends, Request
from fastapi.responses import JSONResponse

from app.api.endpoints import users
from app.middleware.security import get_user_by_token
from app.middleware.middleware import logging_middleware, logger

# Base.metadata.create_all(bind=engine)
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.include_router(users.router, prefix="/api/v1", tags=["Users"])

origins = ['*']

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_db():
    Base.metadata.create_all(bind=engine)

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