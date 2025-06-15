from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.code import CodeOut, CodeCreate, CodeUpdate, CodeWithHierarchy
from app.services.code_service import CodeService

router = APIRouter()
# Maybe not needed

@router.post("/", response_model=CodeOut)
def create_code(
    code: CodeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new code"""
    try:
        new_code = CodeService.create_code(
            db=db,
            name=code.name,
            project_id=code.project_id,
            created_by_id=getattr(current_user, 'id'),
            description=code.description,
            color=code.color,
            parent_id=code.parent_id
        )
        return new_code
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create code: {str(e)}")


@router.get("/project/{project_id}", response_model=List[CodeOut])
def get_project_codes(
    project_id: int,
    parent_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all codes for a project"""
    codes = CodeService.get_project_codes(
        db=db,
        project_id=project_id,
        user_id=getattr(current_user, 'id'),
        parent_id=parent_id
    )
    return codes


def _get_children(parent_id: int, codes_dict: dict) -> List[CodeWithHierarchy]:
    """Helper function to build code hierarchy"""
    children = []
    for code in codes_dict.values():
        if code.parent_id == parent_id:
            code_with_hierarchy = CodeWithHierarchy(**code.__dict__)
            code_with_hierarchy.children = _get_children(code.id, codes_dict)
            children.append(code_with_hierarchy)
    return children


@router.get("/project/{project_id}/hierarchy", response_model=List[CodeWithHierarchy])
def get_project_codes_hierarchy(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all codes for a project in hierarchical structure"""

    # Get all codes for the project using service layer
    all_codes = CodeService.get_project_codes(
        db=db,
        project_id=project_id,
        user_id=getattr(current_user, 'id')
    )

    # Build hierarchy
    codes_dict = {code.id: code for code in all_codes}
    root_codes = []

    for code in all_codes:
        if code.parent_id is None:
            # This is a root code
            code_with_hierarchy = CodeWithHierarchy(**code.__dict__)
            code_with_hierarchy.children = _get_children(code.id, codes_dict)
            root_codes.append(code_with_hierarchy)

    return root_codes


@router.put("/{code_id}", response_model=CodeOut)
def update_code(
    code_id: int,
    code_update: CodeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a code"""
    try:
        updated_code = CodeService.update_code(
            db=db,
            code_id=code_id,
            user_id=getattr(current_user, 'id'),
            **code_update.model_dump(exclude_unset=True)
        )
        return updated_code
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update code: {str(e)}")


@router.delete("/{code_id}")
def delete_code(
    code_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a code"""
    try:
        CodeService.delete_code(
            db=db,
            code_id=code_id,
            user_id=getattr(current_user, 'id')
        )
        return {"message": "Code deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete code: {str(e)}")


@router.get("/{code_id}/quotes", response_model=List[dict])
def get_code_quotes(
    code_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all quotes assigned to a code"""
    try:
        quotes = CodeService.get_code_quotes(
            db=db,
            code_id=code_id,
            user_id=getattr(current_user, 'id')
        )
        return [{"id": quote.id, "text": quote.text[:100] + "..." if len(quote.text) > 100 else quote.text,
                "document_id": quote.document_id, "segment_id": quote.segment_id} for quote in quotes]
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=403, detail=str(e))


@router.get("/{code_id}/segments", response_model=List[dict])
def get_code_segments(
    code_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all segments assigned to a code"""
    try:
        segments = CodeService.get_code_segments(
            db=db,
            code_id=code_id,
            user_id=getattr(current_user, 'id')
        )
        return [{"id": segment.id, "content": segment.content[:100] + "..." if len(segment.content) > 100 else segment.content,
                "document_id": segment.document_id, "segment_type": segment.segment_type} for segment in segments]
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=403, detail=str(e))
