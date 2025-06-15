import requests
import time
from typing import Dict, Optional
from test_authentication import AuthTestClient

BASE_URL = "http://localhost:8000/api/v1"


class ProjectTestClient:
    """Simple client for testing project endpoints"""

    def __init__(self, token: str):
        self.base_url = BASE_URL
        self.headers = {"Authorization": f"Bearer {token}"}
        self.timestamp = str(int(time.time()))

    def create_project(self, title: Optional[str] = None, description: str = "Test project") -> Dict:
        """Create a new project"""
        if not title:
            title = f"Test Project {self.timestamp}"

        project_data = {"title": title, "description": description}
        response = requests.post(
            f"{self.base_url}/projects/", json=project_data, headers=self.headers)

        return {
            "status_code": response.status_code,
            "data": response.json() if response.status_code == 201 else None,
            "error": response.text if response.status_code != 201 else None
        }

    def get_projects(self) -> Dict:
        """Get all projects for the authenticated user"""
        response = requests.get(
            f"{self.base_url}/projects/", headers=self.headers)

        return {
            "status_code": response.status_code,
            "data": response.json() if response.status_code == 200 else None,
            "error": response.text if response.status_code != 200 else None
        }

    def get_project(self, project_id: int) -> Dict:
        """Get a specific project"""
        response = requests.get(
            f"{self.base_url}/projects/{project_id}", headers=self.headers)

        return {
            "status_code": response.status_code,
            "data": response.json() if response.status_code == 200 else None,
            "error": response.text if response.status_code != 200 else None
        }


def setup_authenticated_user():
    """Setup an authenticated user for testing"""
    auth_client = AuthTestClient()

    # Register user
    reg_result = auth_client.register_user()
    if reg_result["status_code"] != 200:
        print(f"❌ Setup failed - registration error: {reg_result['error']}")
        return None

    # Login user
    login_result = auth_client.login_user(
        reg_result["email"], reg_result["password"])
    if login_result["status_code"] != 200:
        print(f"❌ Setup failed - login error: {login_result['error']}")
        return None

    return {
        "user_id": reg_result["data"]["id"],
        "email": reg_result["email"],
        "token": login_result["token"]
    }


def test_project_creation():
    """Test project creation"""
    print("🧪 Testing Project Creation")

    # Setup authenticated user
    user = setup_authenticated_user()
    if not user:
        return None

    # Create project
    client = ProjectTestClient(user["token"])
    result = client.create_project()

    if result["status_code"] == 201:
        project = result["data"]
        print(f"✅ Project created: {project['title']} (ID: {project['id']})")
        return {**user, "project": project}
    else:
        print(f"❌ Project creation failed: {result['error']}")
        return None


def test_project_retrieval():
    """Test project retrieval"""
    print("🧪 Testing Project Retrieval")

    # Create a project first
    project_data = test_project_creation()
    if not project_data:
        return False

    client = ProjectTestClient(project_data["token"])

    # Test get all projects
    all_projects = client.get_projects()
    if all_projects["status_code"] == 200:
        print(f"✅ Retrieved {len(all_projects['data'])} projects")
    else:
        print(f"❌ Failed to get projects: {all_projects['error']}")
        # Test get specific project (now returns comprehensive data)
        return False
    project = client.get_project(project_data["project"]["id"])
    if project["status_code"] == 200:
        project_data_comprehensive = project['data']
        print(
            f"✅ Retrieved specific project: {project_data_comprehensive['title']}")

        # Validate comprehensive data structure
        expected_fields = ['id', 'title', 'owner_id',
                           'documents', 'codes', 'quotes', 'annotations']
        for field in expected_fields:
            if field not in project_data_comprehensive:
                print(f"❌ Missing field in comprehensive response: {field}")
                return False

        print(f"📊 Project comprehensive data:")
        print(
            f"   - Documents: {len(project_data_comprehensive.get('documents', []))}")
        print(
            f"   - Codes: {len(project_data_comprehensive.get('codes', []))}")
        print(
            f"   - Quotes: {len(project_data_comprehensive.get('quotes', []))}")
        print(
            f"   - Annotations: {len(project_data_comprehensive.get('annotations', []))}")

        return True
    else:
        print(f"❌ Failed to get specific project: {project['error']}")
        return False


def test_complete_project_flow():
    """Test complete project management flow"""
    print("🧪 Complete Project Management Test")
    print("=" * 40)

    success = True

    # Test project creation
    if not test_project_creation():
        success = False

    # Test project retrieval
    if not test_project_retrieval():
        success = False

    if success:
        print("🎉 Project management flow completed successfully!")
    else:
        print("❌ Some project tests failed")

    return success


if __name__ == "__main__":
    test_complete_project_flow()
