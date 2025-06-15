from sqlalchemy.orm import Session
from typing import List, Optional, Dict

from app.models.quote import Quote
from .quote.creation import QuoteCreationService
from .quote.retrieval import QuoteRetrievalService


class QuoteService:
    """
    Main quote service that delegates to specialized services.
    Maintains backward compatibility while using modular architecture.
    """

    @staticmethod
    def create_quote(
        db: Session,
        text: str,
        segment_id: int,
        created_by_id: int,
        start_char: Optional[int] = None,
        end_char: Optional[int] = None,
        document_id: Optional[int] = None
    ) -> Quote:
        """Create a new quote with validation - segment-based"""
        return QuoteCreationService.create_quote(
            db, text, segment_id, created_by_id, start_char, end_char, document_id
        )

    @staticmethod
    def get_quotes_by_document(
        db: Session,
        document_id: int,
        user_id: int,
        code_id: Optional[int] = None
    ) -> List[Quote]:
        """Get all quotes for a document"""
        return QuoteRetrievalService.get_quotes_by_document(
            db, document_id, user_id, code_id
        )

    @staticmethod
    def get_quotes_by_code(
        db: Session,
        code_id: int,
        user_id: int
    ) -> List[Quote]:
        """Get all quotes for a specific code"""
        return QuoteRetrievalService.get_quotes_by_code(db, code_id, user_id)

    @staticmethod
    def get_quotes_by_project_with_details(
        db: Session,
        project_id: int,
        user_id: int,
        code_id: Optional[int] = None,
        document_id: Optional[int] = None,
        created_by_id: Optional[int] = None
    ):
        """Get all quotes for a project with detailed information"""
        return QuoteRetrievalService.get_quotes_by_project_with_details(
            db, project_id, user_id, code_id, document_id, created_by_id
        )

    @staticmethod
    def assign_code_to_quote(
        db: Session,
        quote_id: int,
        code_id: int,
        user_id: int
    ) -> Quote:
        """Assign a code to a quote using many-to-many relationship"""
        from app.core.permissions import PermissionChecker
        from app.models.code import Code
        from app.models.user import User

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check if user has access to the quote
        quote = PermissionChecker.check_quote_access(
            db, quote_id, user, raise_exception=False
        )
        if not quote:
            raise ValueError("Quote not found or access denied")

        # Validate code exists and user has access to it via project
        code = db.query(Code).filter(Code.id == code_id).first()
        if not code:
            raise ValueError("Code not found")

        # Check if code belongs to same project as quote's document
        if code.project_id != quote.document.project_id:
            raise ValueError("Code and quote must belong to the same project")

        # Check if association already exists
        if code in quote.codes:
            raise ValueError("Code is already assigned to this quote")

        # Add the association
        quote.codes.append(code)
        db.commit()
        db.refresh(quote)

        return quote

    @staticmethod
    def remove_code_from_quote(
        db: Session,
        quote_id: int,
        code_id: int,
        user_id: int
    ) -> Quote:
        """Remove a code from a quote using many-to-many relationship"""
        from app.core.permissions import PermissionChecker
        from app.models.code import Code
        from app.models.user import User

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check if user has access to the quote
        quote = PermissionChecker.check_quote_access(
            db, quote_id, user, raise_exception=False
        )
        if not quote:
            raise ValueError("Quote not found or access denied")

        # Validate code exists
        code = db.query(Code).filter(Code.id == code_id).first()
        if not code:
            raise ValueError("Code not found")

        # Check if association exists
        if code not in quote.codes:
            raise ValueError("Code is not assigned to this quote")

        # Remove the association
        quote.codes.remove(code)
        db.commit()
        db.refresh(quote)

        return quote

    @staticmethod
    def get_quote_codes(
        db: Session,
        quote_id: int,
        user_id: int
    ) -> List:
        """Get all codes assigned to a quote"""
        from app.core.permissions import PermissionChecker
        from app.models.user import User

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check if user has access to the quote
        quote = PermissionChecker.check_quote_access(
            db, quote_id, user, raise_exception=False
        )
        if not quote:
            raise ValueError("Quote not found or access denied")

        return quote.codes

    @staticmethod
    def search_quotes(
        db: Session,
        project_id: int,
        user_id: int,
        search_text: str,
        document_id: Optional[int] = None,
        code_id: Optional[int] = None
    ) -> List[Quote]:
        """Search quotes by text content"""
        return QuoteRetrievalService.search_quotes(
            db, project_id, user_id, search_text, document_id, code_id)

    @staticmethod
    def get_quote_context(
        db: Session,
        quote_id: int,
        context_chars: int = 200
    ) -> Dict[str, str]:
        """Get surrounding context for a quote"""
        return QuoteRetrievalService.get_quote_context(
            db, quote_id, context_chars
        )    @ staticmethod

    def get_overlapping_quotes(
        db: Session,
        segment_id: int,
        start_char: int,
        end_char: int
    ) -> List[Quote]:
        """Find quotes that overlap with the given character range in a segment"""
        return QuoteRetrievalService.get_overlapping_quotes(
            db, segment_id, start_char, end_char
        )

    @staticmethod
    def update_quote(
        db: Session,
        quote_id: int,
        user_id: int,
        **update_data
    ) -> Quote:
        """Update a quote with validation"""
        return QuoteCreationService.update_quote(
            db, quote_id, user_id, **update_data
        )

    @staticmethod
    def delete_quote(
        db: Session,
        quote_id: int,
        user_id: int
    ) -> bool:
        """Delete a quote"""
        return QuoteCreationService.delete_quote(db, quote_id, user_id)
