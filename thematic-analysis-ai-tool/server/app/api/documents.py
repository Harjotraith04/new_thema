from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
import os
import pathlib
from sqlalchemy.orm import Session
from typing import List, Optional
import asyncio
from app.db.session import get_db, SessionLocal
from app.core.auth import get_current_user
from app.core.permissions import PermissionChecker
from app.models.user import User
from app.models.document import DocumentType
from app.schemas.document import DocumentOut, DocumentUpdate, BulkUploadResult, DocumentUpload
from app.services.document_service import DocumentService

router = APIRouter()

async def _do_single_upload(
    project_id: int,
    file: UploadFile,
    name: Optional[str],
    description: Optional[str],
    db: Session,
    current_user: User
) -> DocumentUpload:
    content = await file.read()
    ext = pathlib.Path(file.filename or "").suffix.lower()
    if ext == ".pdf":
        doc_type = DocumentType.PDF
    elif ext == ".docx":
        doc_type = DocumentType.DOCX
    elif ext in (".csv", ".xlsx", ".xls"):
        doc_type = DocumentType.CSV
    else:
        doc_type = DocumentType.TEXT

    with SessionLocal() as db:
        return await asyncio.to_thread(
            DocumentService.create_document,
            db,
            str(name or file.filename),
            description,
            doc_type,
            project_id,
            getattr(current_user, "id"),
            content,
            str(file.filename)
        )

# Maybe not needed
@router.post("/", response_model=DocumentUpload)
async def upload_document(
    project_id: int = Form(...),
    file: UploadFile = File(...),
    name: Optional[str]   = Form(None),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a single document"""
    PermissionChecker.check_project_access(db, project_id, current_user)

    content = await file.read()
    ext = pathlib.Path(file.filename or "").suffix.lower()
    if ext == ".pdf":
        doc_type = DocumentType.PDF
    elif ext == ".docx":
        doc_type = DocumentType.DOCX
    elif ext in (".csv", ".xlsx", ".xls"):
        doc_type = DocumentType.CSV
    else:
        doc_type = DocumentType.TEXT

    try:
        return DocumentService.create_document(
            db=db,
            name=str(name or file.filename),
            description=description,
            document_type=doc_type,
            project_id=project_id,
            uploaded_by_id=getattr(current_user, "id"),
            file_content=content,
            filename=str(file.filename)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Needed
@router.post("/bulk-upload", response_model=BulkUploadResult)
async def bulk_upload_documents(
    project_id: int = Form(...),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    PermissionChecker.check_project_access(db, project_id, current_user)

    uploaded = []
    failed   = []

    async def _wrap(file: UploadFile):
        try:
            doc = await _do_single_upload(
                project_id, file, None, None, db, current_user
            )
            uploaded.append(doc)
        except HTTPException as e:
            failed.append({"filename": file.filename, "error": e.detail})

    tasks = [_wrap(file) for file in files]
    await asyncio.gather(*tasks)

    return {
        "uploaded_documents": uploaded,
        "failed_uploads":     failed,
        "total_files":        len(files),
        "total_uploaded":     len(uploaded),
        "total_errors":       len(failed),
    }

# Maybe not needed
@router.get("/project/{project_id}", response_model=List[DocumentOut])
def get_project_documents(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all documents for a project"""
    documents = DocumentService.get_documents_by_project(
        db, project_id, getattr(current_user, 'id')
    )
    return documents

# Maybe not needed
@router.get("/{document_id}", response_model=DocumentOut)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific document"""
    document = PermissionChecker.check_document_access(
        db, document_id, current_user)
    return document

# Needed
@router.put("/{document_id}", response_model=DocumentOut)
def update_document(
    document_id: int,
    document_update: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a document"""
    try:
        updated_document = DocumentService.update_document(
            db=db,
            document_id=document_id,
            user_id=getattr(current_user, 'id'),
            **document_update.model_dump(exclude_unset=True)
        )
        return updated_document
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=403, detail=str(e))

# Needed
@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a document"""
    try:
        DocumentService.delete_document(
            db=db,
            document_id=document_id,
            user_id=getattr(current_user, 'id')
        )
        return {"message": "Document deleted successfully"}
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=403, detail=str(e))