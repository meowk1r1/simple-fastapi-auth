from pydantic import Field, field_validator, ConfigDict, BaseModel
from datetime import date, datetime
from typing import Optional

class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)  # Работает с ORM-моделями


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

    @field_validator('name')
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError('Название проекта не может быть пустым')
        return v.strip()


class ProjectResponse(BaseSchema):
    id: int
    name: str
    user_id: int
    updated_at: datetime


# === Задача ===
class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    project_id: int = Field(..., gt=0)
    due_date: Optional[date] = None  # Pydantic v2 сам распарсит "ГГГГ-ММ-ДД"
    file: Optional[str] = None  # Путь к файлу (заполняется на бэке)

    @field_validator('title')
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError('Название задачи не может быть пустым')
        return v.strip()

    @field_validator('due_date')
    @classmethod
    def due_date_not_past(cls, v: Optional[date]) -> Optional[date]:
        if v and v < date.today():
            raise ValueError('Срок выполнения не может быть в прошлом')
        return v


class TaskResponse(BaseSchema):
    id: int
    title: str
    project_id: int
    user_id: int
    created_at: datetime
    due_date: Optional[date]
    file_path: Optional[str]
    is_completed: bool


class TaskToggleResponse(BaseSchema):
    id: int
    is_completed: bool