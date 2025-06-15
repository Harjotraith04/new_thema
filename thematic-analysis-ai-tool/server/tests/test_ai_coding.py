import requests
import time

BASE_URL = "http://localhost:8000/api/v1"


def test_ai_initial_coding():
    """Test the AI initial coding endpoint for generating and assigning codes to segments"""
    # 1. Register a new user
    timestamp = str(int(time.time()))
    user_data = {
        "username": f"ai_user_{timestamp}",
        "email": f"aitest{timestamp}@example.com",
        "password": "aipassword123"
    }
    resp = requests.post(f"{BASE_URL}/auth/register", json=user_data)
    assert resp.status_code in (200, 201), f"Registration failed: {resp.text}"

    # 2. Login to get token
    login_data = {"email": user_data["email"],
                  "password": user_data["password"]}
    resp = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    token = resp.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Create a project
    project_data = {"title": "AI Test Project",
                    "description": "Test AI coding"}
    resp = requests.post(f"{BASE_URL}/projects/",
                         json=project_data, headers=headers)
    assert resp.status_code in (
        200, 201), f"Project creation failed: {resp.text}"
    project_id = resp.json().get("id")

    # 4. Upload a test document
    test_content = "This is a test document for AI coding."
    files = {"file": ("ai_test.txt", test_content, "text/plain")}
    data = {"project_id": project_id,
            "name": "AI Test Document", "description": "AI test doc"}
    resp = requests.post(f"{BASE_URL}/documents/",
                         files=files, data=data, headers=headers)
    assert resp.status_code in (
        200, 201), f"Document upload failed: {resp.text}"
    document_id = resp.json().get("id")

    # 5. Call AI initial coding
    resp = requests.post(f"{BASE_URL}/ai/initial-coding",
                         json=[document_id], headers=headers)
    assert resp.status_code == 200, f"AI coding endpoint failed: {resp.text}"

    results = resp.json()
    assert isinstance(results, list), "Expected a list of results"
    for item in results:
        assert isinstance(item.get("segment_id"),
                          int), "segment_id should be int"
        assert isinstance(item.get("code_id"), (int, type(None))
                          ), "code_id should be int or None"
        assert isinstance(item.get("quote_id"), (int, type(None))
                          ), "quote_id should be int or None"
        assert isinstance(item.get("reasoning"),
                          str), "reasoning should be str"
        assert isinstance(item.get("message"), str), "message should be str"

    print("✅ AI initial coding test passed")
