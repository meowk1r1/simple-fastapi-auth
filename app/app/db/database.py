from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from ..api.cfg import settings

DATABASE_URL = settings.DATABASE_URL

engine = create_engine(DATABASE_URL, echo=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

"""
Краткое правило для проверки:
Если в User написано tasks = relationship(..., back_populates="user"), 
то в Task должно быть зеркально: user = relationship(..., back_populates="tasks").
Та же логика для пары Project ↔ Task (tasks ↔ project).
"""



class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String, unique=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str]
    
    projects: Mapped[list["Project"]] = relationship(
        "Project",
        back_populates="user",
        cascade="all, delete-orphan"  # Удаляет посты при удалении пользователя
    )

    tasks: Mapped[list["Task"]] = relationship(
        "Task",
        back_populates="user",
        cascade="all, delete-orphan"  # Удаляет таски при удалении пользователя
    )

class Project(Base):
    __tablename__ = "projects"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    name: Mapped[str]
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())
    #Ключ - маппинг = отношение(имя связи, обратный ключ-связь)
    tasks: Mapped[list["Task"]] = relationship(
        "Task",
        back_populates="project",
        cascade="all, delete-orphan"
    )

    user: Mapped["User"] = relationship(
        "User",# Имя связи
        back_populates="projects"# отсылает нас на строчку 16 - ключ обратноый связи в табле юзерс
    )

class Task(Base):
    __tablename__ = "tasks"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    project_id: Mapped[int] = mapped_column(ForeignKey('projects.id'))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    title: Mapped[str]
    due_date: Mapped[datetime] = mapped_column(nullable=True)
    file_path: Mapped[str] = mapped_column(nullable=True)

    user: Mapped["User"] = relationship(
        "User",# Имя связи
        back_populates="tasks"# отсылает нас на строчку 16 - ключ обратноый связи в табле юзерс
    )
    project: Mapped["Project"] = relationship(
        "Project",
        back_populates="tasks",
    )