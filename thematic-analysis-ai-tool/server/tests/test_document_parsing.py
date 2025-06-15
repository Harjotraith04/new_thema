import pytest
import requests
import io
import time
import os
import warnings
from typing import Tuple
import pandas as pd
from docx import Document as DocxDocument

BASE_URL = "http://localhost:8000/api/v1"

# Silence openpyxl datetime deprecation warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)


@pytest.fixture(scope="module")
def setup_environment() -> Tuple[dict, int]:
    # Register a new user
    timestamp = str(int(time.time()))
    user_data = {
        "username": f"parse_user_{timestamp}",
        "email": f"parse{timestamp}@example.com",
        "password": "parsepassword123"
    }
    resp = requests.post(f"{BASE_URL}/auth/register", json=user_data)
    assert resp.status_code in (200, 201)

    # Login
    login_data = {"email": user_data["email"],
                  "password": user_data["password"]}
    resp = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create project
    project_data = {"title": "Parsing Test Project",
                    "description": "Test parsing of various formats"}
    resp = requests.post(f"{BASE_URL}/projects/",
                         json=project_data, headers=headers)
    assert resp.status_code in (200, 201)
    project_id = resp.json()["id"]
    return headers, project_id


def upload_file(headers: dict, project_id: int, filename: str, content_bytes: bytes, mime: str) -> dict:
    files = {("file"): (filename, content_bytes, mime)}
    data = {"project_id": project_id}
    # Use extended read timeout for large files like PDFs
    resp = requests.post(
        f"{BASE_URL}/documents/",
        files=files,
        data=data,
        headers=headers,
        # connect, read timeout (in seconds) to accommodate large uploads
        timeout=(10, 300)
    )
    assert resp.status_code in (200, 201), f"Upload failed: {resp.text}"
    return resp.json()


def get_segments(headers: dict, document_id: int) -> list:
    # Allow extra time for PDF segmentation
    resp = requests.get(
        f"{BASE_URL}/segments/document/{document_id}",
        headers=headers,
        timeout=(10, 300)  # allow extra time for PDF segmentation
    )
    assert resp.status_code == 200, f"Get segments failed: {resp.text}"
    return resp.json()


def test_csv_parsing(setup_environment):
    headers, project_id = setup_environment
    # Prepare CSV content
    csv_text = "col1,col2\nval1,val2\n"
    doc = upload_file(headers, project_id, "test.csv",
                      csv_text.encode("utf-8"), "text/csv")
    segments = get_segments(headers, doc["id"])
    assert any("col1: val1" in seg["content"]
               for seg in segments), "CSV content not parsed correctly"


def test_xlsx_parsing(setup_environment):
    headers, project_id = setup_environment
    # Create a simple Excel file in memory
    df = pd.DataFrame({"a": [1, 2], "b": [3, 4]})
    buffer = io.BytesIO()
    df.to_excel(buffer, index=False)
    buffer.seek(0)
    excel_bytes = buffer.getvalue()
    doc = upload_file(headers, project_id, "test.xlsx", excel_bytes,
                      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    segments = get_segments(headers, doc["id"])
    # Expect at least one segment containing cell data
    assert any("a: 1" in seg["content"]
               for seg in segments), "XLSX content not parsed correctly"


def test_docx_parsing(setup_environment):
    headers, project_id = setup_environment
    # Create a simple DOCX file in memory
    docx_doc = DocxDocument()
    docx_doc.add_paragraph("Hello world. This is a test.")
    buffer = io.BytesIO()
    docx_doc.save(buffer)
    docx_bytes = buffer.getvalue()
    doc = upload_file(headers, project_id, "test.docx", docx_bytes,
                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    segments = get_segments(headers, doc["id"])
    assert any("Hello world" in seg["content"]
               for seg in segments), "DOCX content not parsed correctly"

