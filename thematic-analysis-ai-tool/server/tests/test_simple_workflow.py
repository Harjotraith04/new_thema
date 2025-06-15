#!/usr/bin/env python3
"""
Simple test workflow for the thematic analysis tool
"""
import requests
import sys
import random
import string

BASE_URL = "http://localhost:8000/api/v1"


def random_email():
    """Generate a random email for testing"""
    random_string = ''.join(random.choices(
        string.ascii_lowercase + string.digits, k=8))
    return f"test_{random_string}@example.com"


def test_simple_workflow():
    """Test basic functionality: projects, documents, codes, annotations"""
    print("🧪 Simple Workflow Test")
    print("=" * 40)
    # 1. Register and login
    print("1. Setting up user...")
    user_data = {
        "email": random_email(),
        "password": "testpass123",
        "full_name": "Test User"
    }

    # Register
    response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
    if response.status_code != 200:
        print(f"❌ Registration failed: {response.text}")
        return False
      # Login
    login_data = {"email": user_data["email"],
                  "password": user_data["password"]}
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"❌ Login failed: {response.text}")
        return False

    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ User logged in")

    # 2. Create a project
    print("2. Creating project...")
    project_data = {"title": "Simple Test Project",
                    "description": "A basic test"}
    response = requests.post(
        f"{BASE_URL}/projects/", json=project_data, headers=headers)
    if response.status_code != 201:
        print(f"❌ Project creation failed: {response.text}")
        return False

    project = response.json()
    project_id = project["id"]
    print(f"✅ Project created: {project['title']}")
    # 3. Upload a document
    print("3. Uploading document...")
    doc_content = """This is a simple test document.
    
It has multiple sentences for testing.
Some are positive and happy.
Others might be negative or sad.
This helps test our coding system."""

    # Create a temporary file-like object
    from io import BytesIO
    file_data = BytesIO(doc_content.encode('utf-8'))

    files = {'file': ('test_document.txt', file_data, 'text/plain')}
    data = {'project_id': project_id, 'name': 'Test Document'}
    response = requests.post(
        f"{BASE_URL}/documents/", files=files, data=data, headers=headers)
    if response.status_code != 200:
        print(f"❌ Document upload failed: {response.text}")
        return False

    document = response.json()
    # Get document segments
    print(f"✅ Document uploaded: {document['name']}")
    response = requests.get(
        f"{BASE_URL}/segments/document/{document['id']}", headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed to get segments: {response.text}")
        return False

    segments = response.json()
    print(f"✅ Found {len(segments)} segments")

    # 4. Create some codes
    print("4. Creating codes...")
    codes = []
    for code_name in ["Positive", "Negative"]:
        code_data = {
            "name": code_name,
            "description": f"{code_name} sentiment",
            "color": "#4CAF50" if code_name == "Positive" else "#F44336",
            "project_id": project_id
        }
        response = requests.post(
            f"{BASE_URL}/codes/", json=code_data, headers=headers)
        if response.status_code in [200, 201]:
            codes.append(response.json())
            print(f"✅ Code created: {code_name}")
        else:
            print(f"❌ Failed to create code: {response.text}")

    # 5. Create annotations
    print("5. Creating annotations...")
    if segments:
        # Create annotation on first segment
        annotation_data = {
            "content": "This is a test annotation",
            "annotation_type": "MEMO",
            "segment_id": segments[0]["id"],
            "project_id": project_id
        }
        response = requests.post(
            f"{BASE_URL}/annotations/", json=annotation_data, headers=headers)
        if response.status_code in [200, 201]:
            print("✅ Annotation created")
        else:
            print(f"❌ Failed to create annotation: {response.text}")

    # 6. Get project overview
    print("6. Getting project overview...")
    response = requests.get(
        f"{BASE_URL}/projects/{project_id}", headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed to get project: {response.text}")
        return False

    project_data = response.json()
    print(project_data)
    print("✅ Project overview retrieved")
    print(f"   - Documents: {len(project_data.get('documents', []))}")
    print(f"   - Codes: {len(project_data.get('codes', []))}")
    print(f"   - Annotations: {len(project_data.get('annotations', []))}")

    print("\n🎉 All tests passed!")
    return True


if __name__ == "__main__":
    success = test_simple_workflow()
    if success:
        print("✅ Simple workflow completed successfully!")
        sys.exit(0)
    else:
        print("❌ Simple workflow failed!")
        sys.exit(1)
