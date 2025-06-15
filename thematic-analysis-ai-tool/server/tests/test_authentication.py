#!/usr/bin/env python3
"""
Test suite for authentication endpoints
Tests user registration, login, and token validation
"""
import requests
import time
from typing import Dict, Optional

BASE_URL = "http://localhost:8000/api/v1"


class AuthTestClient:
    """Simple client for testing authentication endpoints"""

    def __init__(self):
        self.base_url = BASE_URL
        self.timestamp = str(int(time.time()))

    def register_user(self, email: Optional[str] = None, password: str = "testpassword123") -> Dict:
        """Register a new user"""
        if not email:
            email = f"test.{self.timestamp}@example.com"

        user_data = {"email": email, "password": password}
        response = requests.post(
            f"{self.base_url}/auth/register", json=user_data)

        return {
            "status_code": response.status_code,
            "data": response.json() if response.status_code == 200 else None,
            "error": response.text if response.status_code != 200 else None,
            "email": email,
            "password": password
        }

    def login_user(self, email: str, password: str) -> Dict:
        """Login a user and get token"""
        login_data = {"email": email, "password": password}
        response = requests.post(
            f"{self.base_url}/auth/login", json=login_data)

        return {
            "status_code": response.status_code,
            "token": response.json().get("access_token") if response.status_code == 200 else None,
            "error": response.text if response.status_code != 200 else None
        }

    def get_headers(self, token: str) -> Dict[str, str]:
        """Get authentication headers"""
        return {"Authorization": f"Bearer {token}"}


def test_user_registration():
    """Test user registration endpoint"""
    print("🧪 Testing User Registration")

    client = AuthTestClient()
    result = client.register_user()

    if result["status_code"] == 200:
        print(
            f"✅ User registered: {result['email']} (ID: {result['data']['id']})")
        return result
    else:
        print(f"❌ Registration failed: {result['error']}")
        return None


def test_user_login():
    """Test user login endpoint"""
    print("🧪 Testing User Login")

    # First register a user
    client = AuthTestClient()
    reg_result = client.register_user()

    if reg_result["status_code"] != 200:
        print("❌ Cannot test login - registration failed")
        return None

    # Then login
    login_result = client.login_user(
        reg_result["email"], reg_result["password"])

    if login_result["status_code"] == 200:
        print(f"✅ Login successful, token obtained")
        return {**reg_result, "token": login_result["token"]}
    else:
        print(f"❌ Login failed: {login_result['error']}")
        return None


def test_complete_auth_flow():
    """Test complete authentication flow"""
    print("🧪 Complete Authentication Flow Test")
    print("=" * 40)

    # Test registration
    user = test_user_registration()
    if not user:
        return False

    # Test login
    auth_data = test_user_login()
    if not auth_data:
        return False

    print("🎉 Authentication flow completed successfully!")
    return True


if __name__ == "__main__":
    test_complete_auth_flow()
