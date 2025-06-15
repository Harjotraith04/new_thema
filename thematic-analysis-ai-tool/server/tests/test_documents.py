import requests
import io
import time
import tempfile
import os
from typing import Dict, Optional, List

BASE_URL = "http://localhost:8000/api/v1"


class DocumentTestClient:
    """Simple client for testing document endpoints"""

    def __init__(self, token: str):
        self.base_url = BASE_URL
        self.headers = {"Authorization": f"Bearer {token}"}

    def upload_document(self, project_id: int, content: str, name: str) -> Dict:
        """Upload a single document"""
        files = {"file": (f'{name}.txt', content, 'text/plain')}
        form_data = {
            'project_id': project_id,
            'name': name,
            'description': 'Test document'
        }

        response = requests.post(
            f"{self.base_url}/documents/",
            files=files,
            data=form_data,
            headers=self.headers
        )

        return {
            "status_code": response.status_code,
            "data": response.json() if response.status_code in [200, 201] else None,
            "error": response.text if response.status_code not in [200, 201] else None
        }

    def bulk_upload_documents(self, project_id: int, files_data: List[Dict]) -> Dict:
        """Upload multiple documents at once"""
        temp_files = []
        try:
            files = []
            for file_data in files_data:
                temp_file = tempfile.NamedTemporaryFile(
                    mode='w', suffix='.txt', delete=False, encoding='utf-8'
                )
                temp_file.write(file_data['content'])
                temp_file.close()
                temp_files.append(temp_file.name)

                file_handle = open(temp_file.name, 'rb')
                files.append(('files', (file_data['name'], file_handle, 'text/plain')))

            form_data = {'project_id': project_id}

            response = requests.post(
                f"{self.base_url}/documents/bulk-upload",
                data=form_data,
                files=files,
                headers=self.headers
            )

            for _, (_, file_handle, _) in files:
                file_handle.close()

            return {
                "status_code": response.status_code,
                "data": response.json() if response.status_code in [200, 201] else None,
                "error": response.text if response.status_code not in [200, 201] else None
            }

        finally:
            for temp_file in temp_files:
                try:
                    os.unlink(temp_file)
                except:
                    pass

    def get_document_segments(self, document_id: int) -> Dict:
        """Get segments for a document"""
        response = requests.get(
            f"{self.base_url}/segments/document/{document_id}", headers=self.headers)

        return {
            "status_code": response.status_code,
            "data": response.json() if response.status_code == 200 else None,
            "error": response.text if response.status_code != 200 else None
        }


def test_document_management():
    """Test complete document management flow with single user and project"""
    print("📄 Document Management Tests")
    print("=" * 40)
    
    timestamp = str(int(time.time()))
    
    # 1. Setup user and project once
    print("🔧 Setting up test environment...")
    
    # Register user
    user_data = {
        "username": f"doc_user_{timestamp}",
        "email": f"doctest{timestamp}@example.com",
        "password": "docpassword123"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
    if response.status_code not in [200, 201]:
        print(f"❌ User registration failed: {response.json()}")
        return False
    
    # Login
    login_data = {
        "email": f"doctest{timestamp}@example.com",
        "password": "docpassword123"
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"❌ Login failed: {response.json()}")
        return False
        
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create project
    project_data = {
        "title": "Document Test Project",
        "description": "Testing document management"
    }
    response = requests.post(f"{BASE_URL}/projects/", json=project_data, headers=headers)
    if response.status_code not in [200, 201]:
        print(f"❌ Project creation failed: {response.json()}")
        return False
        
    project_id = response.json()["id"]
    print(f"✅ Setup complete - Project ID: {project_id}")
    
    # Initialize client
    client = DocumentTestClient(token)
    
    # 2. Test single document upload
    print("\n📄 Testing single document upload...")
    test_content = """This is a comprehensive test document for the thematic analysis tool.

The document contains multiple paragraphs and sentences that will be segmented automatically.
Each paragraph should become a separate segment for analysis.

Some text will have positive sentiment and themes.
Other text might have negative sentiment for comparison.
And some parts will be neutral for balanced analysis.

This allows researchers to code different segments with appropriate themes."""

    result = client.upload_document(project_id, test_content, f"Test Document {timestamp}")
    
    if result["status_code"] not in [200, 201]:
        print(f"❌ Document upload failed: {result['error']}")
        return False
        
    document = result["data"]
    document_id = document["id"]
    print(f"✅ Document uploaded: {document['name']} (ID: {document_id})")
    
    # 3. Test document segmentation
    print("\n🔍 Testing document segmentation...")
    segments_result = client.get_document_segments(document_id)
    
    if segments_result["status_code"] != 200:
        print(f"❌ Failed to get segments: {segments_result['error']}")
        return False
        
    segments = segments_result["data"]
    print(f"✅ Found {len(segments)} segments")
    
    # Show first few segments
    for i, segment in enumerate(segments[:3]):
        content_preview = segment["content"][:50] + "..." if len(segment["content"]) > 50 else segment["content"]
        print(f"   Segment {i+1}: {content_preview}")
    
    # 4. Test bulk document upload
    print("\n📚 Testing bulk document upload...")
    
    bulk_files = [
        {
            "name": f"interview_1_{timestamp}.txt",
            "content": """Interview with Participant A

This interview discusses user experience with document management systems.
Key themes include efficiency, collaboration, and user interface design.

Quote: "The bulk upload feature would save us hours of work every week."
"""
        },
        {
            "name": f"survey_data_{timestamp}.txt", 
            "content": """Survey Results Summary

Response Rate: 78% (150 users)
Top Features Requested:
1. Bulk document upload (89%)
2. Advanced search (76%) 
3. Export capabilities (71%)

Conclusion: Bulk upload is the most requested feature.
"""
        },
        {
            "name": f"focus_group_{timestamp}.txt",
            "content": """Focus Group Notes

Date: June 2025
Participants: 8 users

Main Discussion Points:
- Document workflow efficiency
- Collaboration requirements  
- Real-time processing feedback

Key insight: Users want streamlined document handling.
"""
        }
    ]
    
    bulk_result = client.bulk_upload_documents(project_id, bulk_files)
    
    if bulk_result["status_code"] not in [200, 201]:
        print(f"❌ Bulk upload failed: {bulk_result['error']}")
        return False
        
    bulk_data = bulk_result["data"]
    print(f"✅ Bulk upload successful!")
    print(f"   Total files: {bulk_data['total_files']}")
    print(f"   Successful: {bulk_data['total_uploaded']}")
    print(f"   Failed: {bulk_data['total_errors']}")
    
    if bulk_data['uploaded_documents']:
        print("📋 Uploaded files:")
        for upload in bulk_data['uploaded_documents'][:2]:  # Show first 2
            print(f"   • {upload['name']} (ID: {upload['id']})")
    
    # 5. Test segmentation on bulk uploaded documents
    print("\n🔍 Testing segmentation on bulk documents...")
    
    if bulk_data['uploaded_documents']:
        first_bulk_doc = bulk_data['uploaded_documents'][0]
        bulk_segments = client.get_document_segments(first_bulk_doc['id'])
        
        if bulk_segments["status_code"] == 200:
            segments_count = len(bulk_segments["data"])
            print(f"✅ Bulk document segmented into {segments_count} segments")
        else:
            print(f"❌ Failed to get bulk document segments: {bulk_segments['error']}")
            return False
    
    # 6. Final verification - check project has all documents
    print("\n📊 Final verification...")
    response = requests.get(f"{BASE_URL}/projects/{project_id}", headers=headers)
    
    if response.status_code == 200:
        project_data = response.json()
        total_docs = len(project_data.get('documents', []))
        print(f"✅ Project now contains {total_docs} documents")
        
        if total_docs >= 4:  # 1 single + 3 bulk
            print("✅ All document upload tests passed!")
            return True
        else:
            print(f"⚠️ Expected at least 4 documents, found {total_docs}")
            return False
    else:
        print(f"❌ Failed to verify project documents: {response.json()}")
        return False


if __name__ == "__main__":
    print("Document Management API Tests")
    print("Make sure the server is running on http://localhost:8000")
    print()
    
    success = test_document_management()
    
    if success:
        print("\n🎉 All document management tests passed!")
        print("\n📋 Tested Features:")
        print("✅ Single document upload with auto-segmentation")
        print("✅ Bulk document upload")
        print("✅ Document segmentation")
        print("✅ Document retrieval and verification")
    else:
        print("\n❌ Some document tests failed")