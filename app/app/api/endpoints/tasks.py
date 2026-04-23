# app/api/v1/tasks.py
import os
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
import datetime

from ...db.database import get_db, User, Project, Task
from ...middleware.security import get_user_id_by_token
from ..models.other import TaskCreate, TaskResponse, TaskToggleResponse

router = APIRouter(prefix="/tasks", tags=["Tasks"])
UPLOAD_DIR = Path("uploads/public")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    title: str,
    project_id: int,
    due_date: str | None = None,  # Строка "ГГГГ-ММ-ДД" из формы
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_id_by_token)
):
    """3.2. Создание новой задачи (Form-data)"""
    # 1. Валидация названия
    if not title.strip():
        raise HTTPException(status_code=400, detail="Название задачи не может быть пустым")

    # 2. Проверка проекта
    project = db.query(Project).filter_by(id=project_id, user_id=current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    # 3. Парсинг даты (если передана)
    due_date_obj = None
    if due_date:
        print(due_date)
        try:
            today = datetime.datetime.today()
            print(today)
            due_date_obj = datetime.datetime.strptime(due_date, "%Y-%m-%d")
            print(due_date_obj)
            if due_date_obj < today:
                raise HTTPException(status_code=400, detail="Срок не может быть в прошлом")
        except ValueError:
            raise HTTPException(status_code=400, detail="Неверный формат даты. Используйте ГГГГ-ММ-ДД")

    # 4. Загрузка файла
    file_path = None
    if file and file.filename:
        ext = Path(file.filename).suffix
        safe_name = f"{uuid.uuid4()}{ext}"
        save_path = UPLOAD_DIR / safe_name
        with open(save_path, "wb") as f:
            f.write(file.file.read())
        file_path = str(save_path)  # Или относительный путь: f"/uploads/public/{safe_name}"

    # 5. Сохранение задачи
    new_task = Task(
        user_id=current_user.id,
        project_id=project_id,
        title=title.strip(),
        due_date=due_date_obj,
        file_path=file_path,
        is_completed=False
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


@router.patch("/{task_id}/toggle", response_model=TaskToggleResponse)
def toggle_task_status(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_id_by_token)
):
    """3.6. Инверсия статуса задачи"""
    task = db.query(Task).filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    
    task.is_completed = not task.is_completed
    db.commit()
    db.refresh(task)
    return task


@router.get("/search", response_model=list[TaskResponse])
def search_tasks(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_id_by_token)
):
    search_term = q.strip()
    if not search_term:
        raise HTTPException(status_code=400, detail="Поисковый запрос пустой")

    # ✅ Ручная сборка: to_tsvector @@ to_tsquery
    return db.query(Task).filter(
        Task.user_id == current_user.id,
        func.to_tsvector('russian', Task.title).op('@@')(
            func.to_tsquery('russian', search_term)  # 👈 НЕ plainto_tsquery!
        )
    ).all()


@router.get("/", response_model=list[TaskResponse])
def get_tasks(
    view: str = Query("all", pattern="^(all|today|tomorrow|overdue)$"),
    show_completed: bool = False,
    project_id: int | None = Query(None, gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_id_by_token)
):
    """4.1. Фильтрация задач на главной странице"""
    from datetime import date, timedelta
    
    query = db.query(Task).filter(Task.user_id == current_user.id)
    
    if project_id:
        query = query.filter(Task.project_id == project_id)
    if not show_completed:
        query = query.filter(Task.is_completed == False)

    today = date.today()
    if view == "today":
        query = query.filter(Task.due_date == today)
    elif view == "tomorrow":
        query = query.filter(Task.due_date == today + timedelta(days=1))
    elif view == "overdue":
        query = query.filter(Task.due_date < today, Task.is_completed == False)
        
    return query.all()