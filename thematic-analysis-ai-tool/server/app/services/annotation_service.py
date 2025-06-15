from sqlalchemy.orm import Session
from typing import List, Optional
import datetime

from app.core.permissions import PermissionChecker
from app.models.annotation import Annotation
from app.models.quote import Quote
from app.models.document import Document
from app.models.document_segment import DocumentSegment
from app.models.user import User
from app.schemas.annotation import AnnotationWithDetails


class AnnotationService:
    """Service for annotation management and operations"""
    @staticmethod
    def create_annotation(
        db: Session,
        content: str,
        annotation_type: str,
        user_id: int,
        quote_id: Optional[int] = None,
        segment_id: Optional[int] = None,
        document_id: Optional[int] = None,
        code_id: Optional[int] = None
    ) -> Annotation:
        """Create a new annotation with validation"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # At least one target must be specified
        if not any([quote_id, segment_id, document_id, code_id]):
            raise ValueError(
                "At least one target (quote, segment, document, or code) must be specified")

        project_id = None

        # Validate and get project_id based on the target
        if quote_id:
            quote = PermissionChecker.check_quote_access(
                db, quote_id, user, raise_exception=False
            )
            if not quote:
                raise ValueError("Quote not found or access denied")

            document = db.query(Document).filter(
                Document.id == quote.document_id).first()
            if not document:
                raise ValueError("Document not found for quote")
            project_id = document.project_id

        elif segment_id:
            segment = db.query(DocumentSegment).filter(
                DocumentSegment.id == segment_id).first()
            if not segment:
                raise ValueError("Segment not found")

            document = db.query(Document).filter(
                Document.id == segment.document_id).first()
            if not document:
                raise ValueError("Document not found for segment")

            # Check if user has access to the document/project
            project = PermissionChecker.check_project_access(
                db, document.project_id, user, raise_exception=False
            )
            if not project:
                raise ValueError("Access denied to document")
            project_id = document.project_id

        elif document_id:
            document = db.query(Document).filter(
                Document.id == document_id).first()
            if not document:
                raise ValueError("Document not found")

            # Check if user has access to the document/project
            project = PermissionChecker.check_project_access(
                db, document.project_id, user, raise_exception=False
            )
            if not project:
                raise ValueError("Access denied to document")
            project_id = document.project_id

        # Create annotation
        db_annotation = Annotation(
            content=content,
            annotation_type=annotation_type,
            quote_id=quote_id,
            segment_id=segment_id,
            document_id=document_id,
            code_id=code_id,
            project_id=project_id,
            created_by_id=user_id
        )

        db.add(db_annotation)
        db.commit()
        db.refresh(db_annotation)

        return db_annotation

    @staticmethod
    def update_annotation(
        db: Session,
        annotation_id: int,
        user_id: int,
        **update_data
    ) -> Annotation:
        """Update an annotation with validation"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Get annotation
        annotation = db.query(Annotation).filter(
            Annotation.id == annotation_id).first()
        if not annotation:
            raise ValueError("Annotation not found")

        # Check if user has access to the project
        project = PermissionChecker.check_project_access(
            db, annotation.project_id, user, raise_exception=False
        )
        if not project:
            raise ValueError("Not authorized to modify this annotation")

        # Update fields (excluding None values)
        for field, value in update_data.items():
            if value is not None and hasattr(annotation, field):
                setattr(annotation, field, value)

        annotation.updated_at = datetime.datetime.now(datetime.timezone.utc)
        db.commit()
        db.refresh(annotation)

        return annotation

    @staticmethod
    def delete_annotation(
        db: Session,
        annotation_id: int,
        user_id: int
    ) -> bool:
        """Delete an annotation with validation"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Get annotation
        annotation = db.query(Annotation).filter(
            Annotation.id == annotation_id).first()
        if not annotation:
            raise ValueError("Annotation not found")

        # Check if user has access to the project
        project = PermissionChecker.check_project_access(
            db, annotation.project_id, user, raise_exception=False
        )
        if not project:
            raise ValueError("Not authorized to delete this annotation")

        db.delete(annotation)
        db.commit()

        return True    
    
    @ staticmethod
    def get_quote_annotations(
        db: Session,
        quote_id: int,
        user_id: int
    ) -> List[Annotation]:
        """Get all annotations for a quote"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return []

        # Check if quote exists and user has access
        quote = PermissionChecker.check_quote_access(
            db, quote_id, user, raise_exception=False
        )
        if not quote:
            return []

        annotations = db.query(Annotation).filter(
            Annotation.quote_id == quote_id
        ).order_by(Annotation.created_at).all()

        return annotations

    @staticmethod
    def get_segment_annotations(
        db: Session,
        segment_id: int,
        user_id: int
    ) -> List[Annotation]:
        """Get all annotations for a segment"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return []

        # Check if segment exists and user has access
        segment = db.query(DocumentSegment).filter(
            DocumentSegment.id == segment_id).first()
        if not segment:
            return []

        # Get document to check project access
        document = db.query(Document).filter(
            Document.id == segment.document_id).first()
        if not document:
            return []

        # Check project access
        project = PermissionChecker.check_project_access(
            db, document.project_id, user, raise_exception=False
        )
        if not project:
            return []

        annotations = db.query(Annotation).filter(
            Annotation.segment_id == segment_id
        ).order_by(Annotation.created_at).all()

        return annotations

    @staticmethod
    def get_project_annotations(
        db: Session,
        project_id: int,
        user_id: int,
        annotation_type: Optional[str] = None,
        created_by_id: Optional[int] = None
    ) -> List[AnnotationWithDetails]:
        """Get all annotations for a project with filtering options"""

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

        # Build query with filters
        query = db.query(Annotation).filter(
            Annotation.project_id == project_id)

        if annotation_type:
            query = query.filter(Annotation.annotation_type == annotation_type)

        if created_by_id:
            query = query.filter(Annotation.created_by_id == created_by_id)

        annotations = query.order_by(Annotation.created_at.desc()).all()

        # Convert to AnnotationWithDetails
        result = []
        for annotation in annotations:
            # Get the quote info
            quote = db.query(Quote).filter(
                Quote.id == annotation.quote_id).first()

            annotation_details = AnnotationWithDetails(
                id=annotation.id,
                content=annotation.content,
                annotation_type=annotation.annotation_type,
                quote_id=annotation.quote_id,
                project_id=annotation.project_id,
                created_by_id=annotation.created_by_id,
                created_at=annotation.created_at,
                updated_at=annotation.updated_at,
                quote_text=quote.text if quote else "",
                document_id=quote.document_id if quote else None
            )
            result.append(annotation_details)

        return result

    @staticmethod
    def get_annotation(
        db: Session,
        annotation_id: int,
        user_id: int
    ) -> Optional[Annotation]:
        """Get a specific annotation"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None

        # Get annotation
        annotation = db.query(Annotation).filter(
            Annotation.id == annotation_id).first()
        if not annotation:
            return None

        # Check if user has access to the project
        project = PermissionChecker.check_project_access(
            db, annotation.project_id, user, raise_exception=False
        )
        if not project:
            return None

        return annotation
