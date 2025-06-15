from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import cloudinary

from app.core.permissions import PermissionChecker
from app.models.document import Document
from app.models.user import User


class DocumentManagementService:
    """Service for document management and analytics operations"""

    @staticmethod
    def delete_document(db: Session, document_id: int, user_id: int) -> bool:
        """Delete a document and its Cloudinary file"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False

        # Check user access to document
        document = PermissionChecker.check_document_access(
            db, document_id, user, raise_exception=False
        )
        if not document:
            return False

        # Delete from Cloudinary
        if document.cloudinary_public_id:
            try:
                cloudinary.uploader.destroy(
                    document.cloudinary_public_id,
                    resource_type="raw"
                )
            except Exception as e:
                print(f"Failed to delete from Cloudinary: {e}")

        # Delete from database
        db.delete(document)
        db.commit()

        return True

    @staticmethod
    def get_document_stats(db: Session, document_id: int) -> Dict[str, Any]:
        """Get statistics for a document"""

        document = db.query(Document).filter(
            Document.id == document_id).first()
        if not document:
            return {}

        from app.models.quote import Quote
        from app.models.annotation import Annotation

        quote_count = db.query(Quote).filter(
            Quote.document_id == document_id).count()
        annotation_count = db.query(Annotation).join(Quote).filter(
            Quote.document_id == document_id
        ).count()

        stats = {
            "quote_count": quote_count,
            "annotation_count": annotation_count,
            "file_size": document.file_size,
            "document_type": document.document_type
        }

        if document.content:
            stats["character_count"] = len(document.content)
            stats["word_count"] = len(document.content.split())
            stats["line_count"] = document.content.count('\\n') + 1

        if document.file_metadata:
            stats.update(document.file_metadata)

        return stats

    @staticmethod
    def update_document(
        db: Session,
        document_id: int,
        user_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None
    ) -> Document:
        """Update a document's metadata"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check user access to document
        document = PermissionChecker.check_document_access(
            db, document_id, user, raise_exception=False
        )
        if not document:
            raise ValueError("Document not found or access denied")

        # Update fields if provided
        if name is not None:
            document.name = name
        if description is not None:
            document.description = description

        db.commit()
        db.refresh(document)

        return document
