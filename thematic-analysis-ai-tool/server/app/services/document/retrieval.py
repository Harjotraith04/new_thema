"""
Document retrieval and search service
"""
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.permissions import PermissionChecker
from app.models.document import Document, DocumentType
from app.models.user import User


class DocumentRetrievalService:
    """Service for document retrieval and search operations"""

    @staticmethod
    def get_documents_by_project(
        db: Session,
        project_id: int,
        user_id: int,
        document_type: Optional[DocumentType] = None
    ) -> List[Document]:
        """Get all documents for a project that user has access to"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return []

        # Check user access to project
        project = PermissionChecker.check_project_access(
            db, project_id, user, raise_exception=False
        )
        if not project:
            return []

        query = db.query(Document).filter(Document.project_id == project_id)

        if document_type:
            query = query.filter(Document.document_type == document_type)

        return query.order_by(Document.created_at.desc()).all()

    @staticmethod
    def search_documents(
        db: Session,
        project_id: int,
        user_id: int,
        search_text: str,
        document_type: Optional[DocumentType] = None
    ) -> List[Document]:
        """Search documents by content"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return []

        # Check user access to project
        project = PermissionChecker.check_project_access(
            db, project_id, user, raise_exception=False
        )
        if not project:
            return []

        query = db.query(Document).filter(
            Document.project_id == project_id,
            Document.content.ilike(f"%{search_text}%")
        )

        if document_type:
            query = query.filter(Document.document_type == document_type)

        return query.order_by(Document.created_at.desc()).all()
