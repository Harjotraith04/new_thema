from sqlalchemy.orm import Session
from typing import List, Optional
import datetime

from app.core.permissions import PermissionChecker
from app.core.validators import ValidationUtils
from app.models.code import Code
from app.models.user import User
from app.models.quote import Quote


class CodeService:
    """Service for code management and operations"""

    @staticmethod
    def create_code(
        db: Session,
        name: str,
        project_id: int,
        created_by_id: int,
        description: Optional[str] = None,
        color: Optional[str] = "#3B82F6",
        parent_id: Optional[int] = None,
        is_auto_generated: bool = False
    ) -> Code:
        """Create a new code with validation"""

        # Get user object
        user = db.query(User).filter(User.id == created_by_id).first()
        if not user:
            raise ValueError("User not found")

        # Check user access to project
        project = PermissionChecker.check_project_access(
            db, project_id, user, raise_exception=False
        )
        if not project:
            raise ValueError("Project not found or access denied")

        # Validate parent code if provided
        if parent_id:
            parent_code = ValidationUtils.validate_parent_code(
                db, parent_id, project_id
            )

        # Validate unique code name
        ValidationUtils.validate_unique_code_name(
            db, name, project_id, parent_id
        )

        # Create code
        db_code = Code(
            name=name,
            description=description,
            color=color,
            project_id=project_id,
            parent_id=parent_id,
            created_by_id=created_by_id,
            is_auto_generated=is_auto_generated,
        )

        db.add(db_code)
        db.commit()
        db.refresh(db_code)

        return db_code

    @staticmethod
    def update_code(
        db: Session,
        code_id: int,
        user_id: int,
        **update_data
    ) -> Code:
        """Update a code with validation"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check if user has access to the code
        code = PermissionChecker.check_code_access(
            db, code_id, user, raise_exception=False
        )
        if not code:
            raise ValueError("Code not found or access denied")

        # Check if new parent code exists (if provided)
        if 'parent_id' in update_data and update_data['parent_id'] != code.parent_id:
            if update_data['parent_id']:
                ValidationUtils.validate_parent_code(
                    db, update_data['parent_id'], code.project_id
                )
                # Prevent circular references
                ValidationUtils.validate_code_hierarchy(
                    code.id, update_data['parent_id'])

        # Check if name change would create duplicate
        if 'name' in update_data and update_data['name'] != code.name:
            parent_id = update_data.get('parent_id', code.parent_id)
            ValidationUtils.validate_unique_code_name(
                db, update_data['name'], code.project_id, parent_id, exclude_id=code.id
            )

        # Update fields (excluding None values)
        for field, value in update_data.items():
            if value is not None and hasattr(code, field):
                setattr(code, field, value)

        code.updated_at = datetime.datetime.now(datetime.timezone.utc)
        db.commit()
        db.refresh(code)

        return code

    @staticmethod
    def delete_code(
        db: Session,
        code_id: int,
        user_id: int
    ) -> bool:
        """Delete a code with validation"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check if user has access to the code
        code = PermissionChecker.check_code_access(
            db, code_id, user, raise_exception=False
        )
        if not code:
            raise ValueError("Code not found or access denied")

        # Check if code has children
        children = db.query(Code).filter(Code.parent_id == code.id).first()
        if children:
            raise ValueError("Cannot delete code with child codes")

        # Check if code is used in quotes
        quotes_using_code = db.query(Quote).filter(
            Quote.code_id == code.id).first()
        if quotes_using_code:
            raise ValueError("Cannot delete code that is used in quotes")

        db.delete(code)
        db.commit()

        return True

    @staticmethod
    def get_project_codes(
        db: Session,
        project_id: int,
        user_id: int,
        parent_id: Optional[int] = None
    ) -> List[Code]:
        """Get all codes for a project"""

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

        # Build query
        query = db.query(Code).filter(Code.project_id == project_id)

        if parent_id is not None:
            query = query.filter(Code.parent_id == parent_id)

        codes = query.order_by(Code.name).all()
        return codes

    @staticmethod
    def get_code(
        db: Session,
        code_id: int,
        user_id: int
    ) -> Optional[Code]:
        """Get a specific code"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None

        # Check if user has access to the code
        code = PermissionChecker.check_code_access(
            db, code_id, user, raise_exception=False
        )
        return code

    @staticmethod
    def get_code_quotes(
        db: Session,
        code_id: int,
        user_id: int
    ) -> List:
        """Get all quotes assigned to a code"""
        from app.core.permissions import PermissionChecker
        from app.models.user import User

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check if user has access to the code
        code = PermissionChecker.check_code_access(
            db, code_id, user, raise_exception=False
        )
        if not code:
            raise ValueError("Code not found or access denied")

        return code.quotes

    @staticmethod
    def get_code_segments(
        db: Session,
        code_id: int,
        user_id: int
    ) -> List:
        """Get all segments assigned to a code"""
        from app.core.permissions import PermissionChecker
        from app.models.user import User

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check if user has access to the code
        code = PermissionChecker.check_code_access(
            db, code_id, user, raise_exception=False
        )
        if not code:
            raise ValueError("Code not found or access denied")

        return code.segments
