from fastapi import APIRouter, Depends, HTTPException, Form, status
from sqlalchemy.orm import Session

from ...db.database import get_db, User, Project
from ...middleware.security import get_user_id_by_token
from ..models import other
router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("/", response_model=other.ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: other.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_id_by_token)
):
    """3.4. Добавление проекта"""
    # Проверка уникальности названия для пользователя
    exists = db.query(Project).filter_by(
        user_id=current_user.id, 
        name=project_in.name
    ).first()
    if exists:
        raise HTTPException(
            status_code=400, 
            detail="Проект с таким названием уже существует"
        )

    new_project = Project(user_id=current_user.id, name=project_in.name)
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project


@router.get("/", response_model=list[other.ProjectResponse])
def get_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_id_by_token)
):
    """Список проектов текущего пользователя"""
    return db.query(Project).filter_by(user_id=current_user.id).all()