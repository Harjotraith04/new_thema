from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import Union

from app.models.project import Project
from app.models.user import User
from app.models.document import Document
from app.models.code import Code
from app.models.quote import Quote


class PermissionChecker:
    """Utility class for common permission checks"""

    @staticmethod
    def check_project_access(
        db: Session,
        project_id: int,
        user: User,
        raise_exception: bool = True
    ) -> Union[Project, None]:
        """
        Check if user has access to a project (owner or collaborator).

        Args:
            db: Database session
            project_id: ID of the project to check
            user: Current user
            raise_exception: Whether to raise HTTPException if no access

        Returns:
            Project object if user has access, None otherwise

        Raises:
            HTTPException: If project not found or user has no access (when raise_exception=True)
        """
        project = db.query(Project).filter(Project.id == project_id).first()

        if not project:
            if raise_exception:
                raise HTTPException(
                    status_code=404, detail="Project not found")
            return None

        is_authorized = bool(
            project.owner_id == user.id or
            user in project.collaborators
        )

        if not is_authorized:
            if raise_exception:
                raise HTTPException(
                    status_code=403,
                    detail="Not authorized to access this project"
                )
            return None

        return project

    @staticmethod
    def check_project_owner(
        db: Session,
        project_id: int,
        user: User,
        raise_exception: bool = True
    ) -> Union[Project, None]:
        """
        Check if user is the owner of a project.

        Args:
            db: Database session
            project_id: ID of the project to check
            user: Current user
            raise_exception: Whether to raise HTTPException if not owner

        Returns:
            Project object if user is owner, None otherwise

        Raises:
            HTTPException: If project not found or user is not owner (when raise_exception=True)
        """
        project = db.query(Project).filter(Project.id == project_id).first()

        if not project:
            if raise_exception:
                raise HTTPException(
                    status_code=404, detail="Project not found")
            return None

        if bool(project.owner_id != user.id):
            if raise_exception:
                raise HTTPException(
                    status_code=403,
                    detail="Only project owner can perform this action"
                )
            return None

        return project

    @staticmethod
    def check_document_access(
        db: Session,
        document_id: int,
        user: User,
        raise_exception: bool = True
    ) -> Union[Document, None]:
        """
        Check if user has access to a document through project access.

        Args:
            db: Database session
            document_id: ID of the document to check
            user: Current user
            raise_exception: Whether to raise HTTPException if no access

        Returns:
            Document object if user has access, None otherwise

        Raises:
            HTTPException: If document not found or user has no access (when raise_exception=True)
        """
        document = db.query(Document).filter(
            Document.id == document_id).first()

        if not document:
            if raise_exception:
                raise HTTPException(
                    status_code=404, detail="Document not found")
            return None

        # Check project access
        project = PermissionChecker.check_project_access(
            db, getattr(document, "project_id"), user, raise_exception
        )

        return document if project else None

    @staticmethod
    def check_code_access(
        db: Session,
        code_id: int,
        user: User,
        raise_exception: bool = True
    ) -> Union[Code, None]:
        """
        Check if user has access to a code through project access.

        Args:
            db: Database session
            code_id: ID of the code to check
            user: Current user
            raise_exception: Whether to raise HTTPException if no access

        Returns:
            Code object if user has access, None otherwise

        Raises:
            HTTPException: If code not found or user has no access (when raise_exception=True)
        """
        code = db.query(Code).filter(Code.id == code_id).first()

        if not code:
            if raise_exception:
                raise HTTPException(status_code=404, detail="Code not found")
            return None

        # Check project access
        project = PermissionChecker.check_project_access(
            db, getattr(code, "project_id"), user, raise_exception
        )

        return code if project else None

    @staticmethod
    def check_quote_access(
        db: Session,
        quote_id: int,
        user: User,
        raise_exception: bool = True
    ) -> Union[Quote, None]:
        """
        Check if user has access to a quote through document/project access.

        Args:
            db: Database session
            quote_id: ID of the quote to check
            user: Current user
            raise_exception: Whether to raise HTTPException if no access

        Returns:
            Quote object if user has access, None otherwise

        Raises:
            HTTPException: If quote not found or user has no access (when raise_exception=True)
        """
        quote = db.query(Quote).filter(Quote.id == quote_id).first()

        if not quote:
            if raise_exception:
                raise HTTPException(status_code=404, detail="Quote not found")
            return None

        # Check document access (which checks project access)
        document = PermissionChecker.check_document_access(
            db, quote.document_id, user, raise_exception
        )

        return quote if document else None
