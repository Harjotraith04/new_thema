from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.document import Document, DocumentType
from app.schemas.document import DocumentUpload
from .document.upload import DocumentUploadService
from .document.retrieval import DocumentRetrievalService
from .document.management import DocumentManagementService


class DocumentService:

    @staticmethod
    def create_document(
        db: Session,
        name: str,
        description: Optional[str],
        document_type: DocumentType,
        project_id: int,
        uploaded_by_id: int,
        file_content: bytes,
        filename: str
    ) -> DocumentUpload:
        return DocumentUploadService.create_document(
            db, name, description, document_type, project_id,
            uploaded_by_id, file_content, filename
        )

    @staticmethod
    def get_documents_by_project(
        db: Session,
        project_id: int,
        user_id: int,
        document_type: Optional[DocumentType] = None
    ) -> List[Document]:
        return DocumentRetrievalService.get_documents_by_project(
            db, project_id, user_id, document_type
        )

    @staticmethod
    def delete_document(db: Session, document_id: int, user_id: int) -> bool:
        return DocumentManagementService.delete_document(
            db, document_id, user_id
        )

    @staticmethod
    def update_document(
        db: Session,
        document_id: int,
        user_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None
    ) -> Document:
        return DocumentManagementService.update_document(
            db, document_id, user_id, name, description
        )

    @staticmethod
    def search_documents(
        db: Session,
        project_id: int,
        user_id: int,
        search_text: str,
        document_type: Optional[DocumentType] = None
    ) -> List[Document]:
        return DocumentRetrievalService.search_documents(
            db, project_id, user_id, search_text, document_type
        )