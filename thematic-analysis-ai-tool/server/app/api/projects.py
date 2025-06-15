from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut, ProjectSummary, ProjectComprehensive
from app.schemas.user import UserOut
from app.services.project_service import ProjectService
from app.services.document_service import DocumentService
from app.services.code_service import CodeService
from app.services.quote_service import QuoteService
from app.services.annotation_service import AnnotationService

from app.core.auth import get_current_user
from app.db.session import get_db

router = APIRouter()


@router.post("/", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_new_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """Create a new project"""
    try:
        return ProjectService.create_project(db, project, getattr(current_user, 'id'))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[ProjectSummary])
def list_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """Get all projects for the current user"""
    return ProjectService.get_project_summary_list(db, getattr(current_user, 'id'), skip, limit)


@router.get("/{project_id}", response_model=ProjectComprehensive)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    project_data = ProjectService.get_project_comprehensive(
        db, project_id, getattr(current_user, 'id'))
    if not project_data:
        raise HTTPException(status_code=404, detail="Project not found")

    return ProjectComprehensive(**project_data)


@router.put("/{project_id}", response_model=ProjectOut)
def update_project_details(
    project_id: int,
    project_update: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """Update project details"""
    try:
        project = ProjectService.update_project(
            db, project_id, project_update, getattr(current_user, 'id'))
        return project
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{project_id}")
def delete_project_endpoint(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """Delete a project"""
    try:
        ProjectService.delete_project(
            db, project_id, getattr(current_user, 'id'))
        return {"message": "Project deleted successfully"}
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=403, detail=str(e))


@router.post("/{project_id}/collaborators")
def add_project_collaborator(
    project_id: int,
    collaborator_email: str,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """Add a collaborator to a project"""
    try:
        ProjectService.add_collaborator(
            db, project_id, collaborator_email, getattr(current_user, 'id')
        )
        return {"message": f"Collaborator {collaborator_email} added successfully"}
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{project_id}/collaborators/{collaborator_email}")
def remove_project_collaborator(
    project_id: int,
    collaborator_email: str,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """Remove a collaborator from a project"""
    try:
        ProjectService.remove_collaborator(
            db, project_id, collaborator_email, getattr(current_user, 'id')
        )
        return {"message": f"Collaborator {collaborator_email} removed successfully"}
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=400, detail=str(e))
