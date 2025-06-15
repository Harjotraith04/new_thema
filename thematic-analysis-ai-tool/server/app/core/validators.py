"""
Common validation utilities for data validation across the application.
"""
from fastapi import HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.models.project import Project
from app.models.document import Document
from app.models.code import Code
from app.models.user import User


class ValidationUtils:
    """Utility class for common validation operations"""

    @staticmethod
    def validate_parent_code(
        db: Session,
        parent_id: Optional[int],
        project_id: int
    ) -> Optional[Code]:
        """
        Validate that a parent code exists in the specified project.

        Args:
            db: Database session
            parent_id: ID of the parent code (optional)
            project_id: ID of the project

        Returns:
            Parent Code object if found, None if parent_id is None

        Raises:
            HTTPException: If parent code not found in project
        """
        if not parent_id:
            return None

        parent_code = db.query(Code).filter(
            Code.id == parent_id,
            Code.project_id == project_id
        ).first()

        if not parent_code:
            raise HTTPException(
                status_code=404,
                detail="Parent code not found in this project"
            )

        return parent_code

    @staticmethod
    def validate_unique_code_name(
        db: Session,
        name: str,
        project_id: int,
        parent_id: Optional[int] = None,
        exclude_id: Optional[int] = None
    ):
        """
        Validate that a code name is unique within a project and parent context.

        Args:
            db: Database session
            name: Name to validate
            project_id: ID of the project
            parent_id: ID of the parent code (optional)
            exclude_id: ID to exclude from check (for updates)

        Raises:
            HTTPException: If name already exists
        """
        query = db.query(Code).filter(
            Code.name == name,
            Code.project_id == project_id,
            Code.parent_id == parent_id
        )

        if exclude_id:
            query = query.filter(Code.id != exclude_id)

        existing_code = query.first()

        if existing_code:
            context = f" under parent '{existing_code.parent.name}'" if parent_id else " at root level"
            raise HTTPException(
                status_code=400,
                detail=f"Code name '{name}' already exists in this project{context}"
            )

    @staticmethod
    def validate_code_hierarchy(
        code_id: int,
        new_parent_id: Optional[int]
    ):
        """
        Validate that a code hierarchy change doesn't create circular references.

        Args:
            code_id: ID of the code being moved
            new_parent_id: ID of the new parent (optional)

        Raises:
            HTTPException: If circular reference would be created
        """
        if not new_parent_id:
            return

        if new_parent_id == code_id:
            raise HTTPException(
                status_code=400,
                detail="Cannot set code as its own parent (circular reference)"
            )

    @staticmethod
    def validate_collaborator_email(
        db: Session,
        email: str,
        project_id: int
    ) -> User:
        """
        Validate collaborator email and check if user exists.

        Args:
            db: Database session
            email: Email to validate
            project_id: ID of the project

        Returns:
            User object if found

        Raises:
            HTTPException: If user not found or already a collaborator
        """
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=404,
                detail=f"User with email {email} not found"
            )

        project = db.query(Project).filter(Project.id == project_id).first()
        if user in project.collaborators:
            raise HTTPException(
                status_code=400,
                detail=f"User {email} is already a collaborator"
            )

        if project.owner_id == user.id:
            raise HTTPException(
                status_code=400,
                detail="Project owner cannot be added as collaborator"
            )

        return user

    @staticmethod
    def validate_position_range(
        start_position: Optional[int],
        end_position: Optional[int]
    ):
        """
        Validate that position range is valid.

        Args:
            start_position: Start position (optional)
            end_position: End position (optional)

        Raises:
            HTTPException: If range is invalid
        """
        if start_position is not None and end_position is not None:
            if start_position >= end_position:
                raise HTTPException(
                    status_code=400,
                    detail="Start position must be less than end position"
                )
            if start_position < 0:
                raise HTTPException(
                    status_code=400,
                    detail="Position cannot be negative"
                )
