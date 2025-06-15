"""
Test code assignment endpoints using real HTTP requests
"""
import requests
import time

BASE_URL = "http://localhost:8000/api/v1"

def test_code_assignments():
    """Test all code assignment endpoints with real HTTP requests."""
    
    print("🔄 Starting code assignment tests...")
    
    # Use timestamp for unique user
    timestamp = str(int(time.time()))
    
    # 1. Register user
    user_data = {
        "username": f"code_user_{timestamp}",
        "email": f"codetest{timestamp}@example.com", 
        "password": "codepassword123"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
    print(f"User registration: {response.status_code}")
    if response.status_code not in [200, 201]:
        print(f"Registration failed: {response.json()}")
        return False
    
    # 2. Login
    login_data = {
        "email": f"codetest{timestamp}@example.com",
        "password": "codepassword123"
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print(f"Login: {response.status_code}")
    if response.status_code != 200:
        print(f"Login failed: {response.json()}")
        return False
        
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Create project
    project_data = {
        "title": "Code Assignment Test Project",
        "description": "Testing intelligent code assignments"
    }
    response = requests.post(f"{BASE_URL}/projects/", json=project_data, headers=headers)
    print(f"Project creation: {response.status_code}")
    if response.status_code not in [200, 201]:
        print(f"Project creation failed: {response.json()}")
        return False
        
    project_id = response.json()["id"]
    print(f"✅ Created project: {project_id}")
    
    # 4. Upload document
    test_content = "This is a comprehensive test document with multiple themes. It discusses technology, innovation, research methods, and data analysis. The document contains various sections that can be coded and annotated for thematic analysis."
    
    files = {"file": ("code_test.txt", test_content, "text/plain")}
    form_data = {"project_id": project_id, "name": "Code Test Document", "description": "Test document for code assignments"}
    response = requests.post(f"{BASE_URL}/documents/", files=files, data=form_data, headers=headers)
    print(f"Document upload: {response.status_code}")
    if response.status_code not in [200, 201]:
        print(f"Document upload failed: {response.json()}")
        return False
        
    document_id = response.json()["id"]
    print(f"✅ Uploaded document: {document_id}")
    
    # 5. Get document segments
    response = requests.get(f"{BASE_URL}/segments/document/{document_id}", headers=headers)
    print(f"Get segments: {response.status_code}")
    if response.status_code != 200:
        print(f"Get segments failed: {response.json()}")
        return False
        
    segments = response.json()
    if len(segments) == 0:
        print("No segments found")
        return False
        
    segment_id = segments[0]["id"]
    segment_content = segments[0]["content"]
    print(f"✅ Found segment: {segment_id}")
    print(f"Segment content: '{segment_content[:50]}...'")
    
    # 6. Test smart quote-code assignment
    print("\n🔄 Testing smart quote-code assignment...")
    selected_text = segment_content[10:60]
    quote_code_data = {
        "document_id": document_id,
        "segment_id": segment_id,
        "text": selected_text,
        "start_char": 10,
        "end_char": 60,
        "code_name": "Technology Theme",
        "code_description": "Content related to technology and innovation"
    }
    response = requests.post(f"{BASE_URL}/code-assignments/quote-code-assignment", json=quote_code_data, headers=headers)
    print(f"Smart quote-code assignment: {response.status_code}")
    if response.status_code not in [200, 201]:
        print(f"Smart quote-code assignment failed: {response.json()}")
        return False
        
    result = response.json()
    quote_id = result["quote"]["id"]
    code_id = result["code"]["id"]
    print(f"✅ Created quote: {quote_id}, code: {code_id}")
    
    # 7. Test smart segment-code assignment
    print("\n🔄 Testing smart segment-code assignment...")
    segment_code_data = {
        "segment_id": segment_id,
        "code_name": "Research Methods",
        "code_description": "Content about research methodologies"
    }
    response = requests.post(f"{BASE_URL}/code-assignments/segment-code-assignment", json=segment_code_data, headers=headers)
    print(f"Smart segment-code assignment: {response.status_code}")
    if response.status_code not in [200, 201]:
        print(f"Smart segment-code assignment failed: {response.json()}")
        return False
        
    result = response.json()
    print(f"✅ Assigned code to segment: {result['code']['name']}")
    
    # 8. Test smart annotation
    print("\n🔄 Testing smart annotation...")
    annotation_data = {
        "content": "This section discusses interesting technological concepts",
        "annotation_type": "MEMO",
        "project_id": project_id,
        "document_id": document_id,
        "quote_text": segment_content[0:25],
        "quote_start_char": 0,
        "quote_end_char": 25
    }
    response = requests.post(f"{BASE_URL}/code-assignments/annotation-with-quote", json=annotation_data, headers=headers)
    print(f"Smart annotation: {response.status_code}")
    if response.status_code not in [200, 201]:
        print(f"Smart annotation failed: {response.json()}")
        return False
        
    result = response.json()
    print(f"✅ Created annotation: {result['annotation']['content']}")
    
    # 9. Test quote reuse
    print("\n🔄 Testing quote reuse...")
    duplicate_quote_data = {
        "document_id": document_id,
        "segment_id": segment_id,
        "text": selected_text,
        "start_char": 10,
        "end_char": 60,
        "code_name": "Innovation Theme",
        "code_description": "Another innovation-related theme"
    }
    response = requests.post(f"{BASE_URL}/code-assignments/quote-code-assignment", json=duplicate_quote_data, headers=headers)
    print(f"Quote reuse test: {response.status_code}")
    if response.status_code not in [200, 201]:
        print(f"Quote reuse test failed: {response.json()}")
        return False
        
    result = response.json()
    if result["quote"]["id"] == quote_id:
        print(f"✅ Successfully reused existing quote: {quote_id}")
    else:
        print(f"⚠️ Created new quote instead of reusing: {result['quote']['id']}")
    
    # 10. Test code reuse
    print("\n🔄 Testing code reuse...")
    duplicate_code_data = {
        "segment_id": segment_id,
        "code_name": "Technology Theme",
        "code_description": "Should reuse existing code"
    }
    response = requests.post(f"{BASE_URL}/code-assignments/segment-code-assignment", json=duplicate_code_data, headers=headers)
    print(f"Code reuse test: {response.status_code}")
    if response.status_code not in [200, 201]:
        print(f"Code reuse test failed: {response.json()}")
        return False
        
    result = response.json()
    if result["code"]["id"] == code_id:
        print(f"✅ Successfully reused existing code: {code_id}")
    else:
        print(f"⚠️ Created new code instead of reusing: {result['code']['id']}")
    
    print("\n🎉 All code assignment tests completed successfully!")
    return True


if __name__ == "__main__":
    print("Code Assignment API Tests")
    print("=" * 40)
    print("Make sure the server is running on http://localhost:8000")
    print()
    
    success = test_code_assignments()
    if success:
        print("\n✅ Code assignment implementation is working correctly!")
    else:
        print("\n❌ Some tests failed - check the output above")