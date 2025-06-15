from sqlalchemy.orm import Session, selectinload
from sqlalchemy import or_
from typing import List, Optional, Dict, Any
from app.models.project import Project
from app.models.user import User
from app.models.document import Document
from app.models.document_segment import DocumentSegment
from app.models.code import Code
from app.models.quote import Quote
from app.models.annotation import Annotation
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectSummary, ProjectComprehensive


class ProjectService:
    """Service for project operations"""

    @staticmethod
    def create_project(db: Session, project: ProjectCreate, user_id: int) -> Project:
        """Create a new project"""
        try:
            db_project = Project(
                title=project.title,
                description=project.description,
                owner_id=user_id
            )

            db.add(db_project)
            db.commit()
            db.refresh(db_project)
            return db_project
        except Exception as e:
            db.rollback()
            raise ValueError(f"Failed to create project: {str(e)}")

    @staticmethod
    def get_project(db: Session, project_id: int, user_id: int) -> Optional[Project]:
        """Get a project by ID that the user has access to"""
        return db.query(Project).filter(
            Project.id == project_id,
            or_(
                Project.owner_id == user_id,
                Project.collaborators.any(User.id == user_id)
            )
        ).first()

    @staticmethod
    def get_user_projects(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Project]:
        """Get all projects accessible to a user"""
        return db.query(Project).filter(
            or_(
                Project.owner_id == user_id,
                Project.collaborators.any(User.id == user_id)
            )
        ).offset(skip).limit(limit).all()

    @staticmethod
    def update_project(
        db: Session,
        project_id: int,
        project_update: ProjectUpdate,
        user_id: int
    ) -> Project:
        """Update a project (only by owner)"""
        db_project = db.query(Project).filter(
            Project.id == project_id,
            Project.owner_id == user_id
        ).first()

        if not db_project:
            raise ValueError("Project not found or you're not the owner")

        try:
            update_data = project_update.dict(exclude_unset=True)
            collaborator_emails = update_data.pop('collaborator_emails', None)

            for field, value in update_data.items():
                setattr(db_project, field, value)

            if collaborator_emails is not None:
                if collaborator_emails:
                    collaborators = db.query(User).filter(
                        User.email.in_(collaborator_emails)
                    ).all()

                    found_emails = {user.email for user in collaborators}
                    missing_emails = set(collaborator_emails) - found_emails
                    if missing_emails:
                        raise ValueError(
                            f"Users not found: {', '.join(missing_emails)}")

                    db_project.collaborators = collaborators
                else:
                    db_project.collaborators = []

            db.commit()
            db.refresh(db_project)
            return db_project
        except Exception as e:
            db.rollback()
            raise ValueError(f"Failed to update project: {str(e)}")

    @staticmethod
    def delete_project(db: Session, project_id: int, user_id: int) -> bool:
        """Delete a project (only by owner)"""
        db_project = db.query(Project).filter(
            Project.id == project_id,
            Project.owner_id == user_id
        ).first()

        if not db_project:
            raise ValueError("Project not found or you're not the owner")

        try:
            db.delete(db_project)
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            raise ValueError(f"Failed to delete project: {str(e)}")

    @staticmethod
    def add_collaborator(db: Session, project_id: int, collaborator_email: str, user_id: int) -> bool:
        """Add a collaborator to a project (only by owner)"""
        db_project = db.query(Project).filter(
            Project.id == project_id,
            Project.owner_id == user_id
        ).first()

        if not db_project:
            raise ValueError("Project not found or you're not the owner")

        collaborator = db.query(User).filter(
            User.email == collaborator_email
        ).first()

        if not collaborator:
            raise ValueError(f"User with email {collaborator_email} not found")

        if collaborator not in db_project.collaborators:
            try:
                db_project.collaborators.append(collaborator)
                db.commit()
            except Exception as e:
                db.rollback()
                raise ValueError(f"Failed to add collaborator: {str(e)}")

        return True

    @staticmethod
    def remove_collaborator(db: Session, project_id: int, collaborator_email: str, user_id: int) -> bool:
        """Remove a collaborator from a project (only by owner)"""
        db_project = db.query(Project).filter(
            Project.id == project_id,
            Project.owner_id == user_id
        ).first()

        if not db_project:
            raise ValueError("Project not found or you're not the owner")

        collaborator = db.query(User).filter(
            User.email == collaborator_email
        ).first()

        if collaborator and collaborator in db_project.collaborators:
            try:
                db_project.collaborators.remove(collaborator)
                db.commit()
            except Exception as e:
                db.rollback()
                raise ValueError(f"Failed to remove collaborator: {str(e)}")

        return True

    @staticmethod
    def get_project_summary_list(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[ProjectSummary]:
        """Get a list of project summaries for a user"""
        projects = ProjectService.get_user_projects(db, user_id, skip, limit)

        summaries = []
        for project in projects:
            summary = ProjectSummary(
                id=project.id,
                title=project.title,
                description=project.description,
                owner_id=project.owner_id,
                document_count=len(project.documents),
                collaborator_count=len(project.collaborators),
                created_at=project.created_at,
                updated_at=project.updated_at
            )
            summaries.append(summary)

        return summaries

    @staticmethod
    def get_project_comprehensive(db: Session, project_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        """Get a project with all related data loaded efficiently using joins"""
        # Check if user has access to project first
        project = db.query(Project).filter(
            Project.id == project_id,
            or_(
                Project.owner_id == user_id,
                Project.collaborators.any(User.id == user_id)
            )
        ).first()

        print(f"Project ID: {project_id}, User ID: {user_id}, Project Found: {project is not None}")

        if not project:
            return None

        # Load project with all relationships using selectinload to avoid N+1 queries
        project_with_data = db.query(Project).options(
            selectinload(Project.documents).selectinload(Document.segments),
            selectinload(Project.codes).selectinload(
                Code.quotes).selectinload(Quote.segment),
            selectinload(Project.codes).selectinload(Code.segments),
            selectinload(Project.annotations).selectinload(Annotation.quote),
            selectinload(Project.annotations).selectinload(Annotation.segment),
            selectinload(Project.annotations).selectinload(
                Annotation.document),
            selectinload(Project.annotations).selectinload(Annotation.code),
            selectinload(Project.annotations).selectinload(
                Annotation.created_by)
        ).filter(Project.id == project_id).first()

        print(f"Project with data loaded: {project_with_data is not None}")

        # Get all quotes for the project with their relationships
        quotes = db.query(Quote).join(Document).filter(
            Document.project_id == project_id
        ).options(
            selectinload(Quote.codes),
            selectinload(Quote.segment),
            selectinload(Quote.document),
            selectinload(Quote.created_by)
        ).all()


        print(f"Quotes loaded: {len(quotes)}")

        # Build comprehensive data structure
        return {
            "id": project_with_data.id,
            "title": project_with_data.title,
            "description": project_with_data.description,
            "owner_id": project_with_data.owner_id,
            "created_at": project_with_data.created_at,
            "updated_at": project_with_data.updated_at,
            "documents": [
                {
                    "id": doc.id,
                    "name": doc.name,
                    "description": doc.description,
                    "document_type": doc.document_type.value,
                    "project_id": doc.project_id,
                    "uploaded_by_id": doc.uploaded_by_id,
                    "created_at": doc.created_at,
                    "updated_at": doc.updated_at,
                    "file_size": doc.file_size,
                    "segments": [
                        {
                            "id": seg.id,
                            "document_id": seg.document_id,
                            "segment_type": seg.segment_type,
                            "content": seg.content,
                            "line_number": seg.line_number,
                            "page_number": seg.page_number,
                            "paragraph_index": seg.paragraph_index,
                            "row_index": seg.row_index,
                            "character_start": seg.character_start,
                            "character_end": seg.character_end,
                            "additional_data": seg.additional_data,
                            "created_at": seg.created_at,
                            "updated_at": seg.updated_at
                        } for seg in doc.segments
                    ]
                } for doc in project_with_data.documents
            ],
            "codes": [
                {
                    "id": code.id,
                    "name": code.name,
                    "description": code.description,
                    "color": code.color,
                    "project_id": code.project_id,
                    "parent_id": code.parent_id,
                    "created_by_id": code.created_by_id,
                    "created_at": code.created_at,
                    "updated_at": code.updated_at,
                    "quotes": [
                        {
                            "id": quote.id,
                            "text": quote.text,
                            "start_char": quote.start_char,
                            "end_char": quote.end_char,
                            "segment_id": quote.segment_id,
                            "document_id": quote.document_id,
                            "created_by_id": quote.created_by_id,
                            "created_at": quote.created_at,
                            "updated_at": quote.updated_at
                        } for quote in code.quotes
                    ],
                    "segments": [
                        {
                            "id": seg.id,
                            "document_id": seg.document_id,
                            "segment_type": seg.segment_type,
                            "content": seg.content,
                            "line_number": seg.line_number,
                            "page_number": seg.page_number,
                            "paragraph_index": seg.paragraph_index,
                            "row_index": seg.row_index,
                            "character_start": seg.character_start,
                            "character_end": seg.character_end,
                            "additional_data": seg.additional_data,
                            "created_at": seg.created_at,
                            "updated_at": seg.updated_at
                        } for seg in code.segments
                    ],
                    "quotes_count": len(code.quotes),
                    "segments_count": len(code.segments)
                } for code in project_with_data.codes
            ],
            "quotes": [
                {
                    "id": quote.id,
                    "text": quote.text,
                    "start_char": quote.start_char,
                    "end_char": quote.end_char,
                    "segment_id": quote.segment_id,
                    "document_id": quote.document_id,
                    "created_by_id": quote.created_by_id,
                    "created_at": quote.created_at,
                    "updated_at": quote.updated_at,
                    "codes": [
                        {
                            "id": code.id,
                            "name": code.name,
                            "description": code.description,
                            "color": code.color,
                            "project_id": code.project_id,
                            "parent_id": code.parent_id,
                            "created_by_id": code.created_by_id,
                            "created_at": code.created_at,
                            "updated_at": code.updated_at
                        } for code in quote.codes
                    ],
                    "segment_content": quote.segment.content if quote.segment else None,
                    "segment_type": quote.segment.segment_type if quote.segment else None
                } for quote in quotes
            ],
            "annotations": [
                {
                    "id": ann.id,
                    "content": ann.content,
                    "annotation_type": ann.annotation_type.value,
                    "quote_id": ann.quote_id,
                    "segment_id": ann.segment_id,
                    "document_id": ann.document_id,
                    "code_id": ann.code_id,
                    "project_id": ann.project_id,
                    "created_by_id": ann.created_by_id,
                    "created_at": ann.created_at,
                    "updated_at": ann.updated_at,
                    "quote_text": ann.quote.text if ann.quote else None,
                    "segment_content": ann.segment.content if ann.segment else None,
                    "document_name": ann.document.name if ann.document else None,
                    "code_name": ann.code.name if ann.code else None,
                    "created_by_email": ann.created_by.email if ann.created_by else None
                } for ann in project_with_data.annotations
            ]
        }

