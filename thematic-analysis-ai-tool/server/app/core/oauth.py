import requests
from urllib.parse import urlencode
from app.core.config import settings

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v1/userinfo"

GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USERINFO_URL = "https://api.github.com/user"

GOOGLE_REDIRECT_URI = f"{settings.BACKEND_URL}/api/v1/auth/auth/callback"
GITHUB_REDIRECT_URI = f"{settings.BACKEND_URL}/api/v1/auth/auth/github/callback"


def get_google_redirect_url():
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent"
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


def exchange_code_for_token(code):
    data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code"
    }
    response = requests.post(GOOGLE_TOKEN_URL, data=data)
    response.raise_for_status()
    token_data = response.json()
    if "access_token" not in token_data:
        raise ValueError("No access token in response")
    return token_data["access_token"]


def get_google_user_info(token):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(GOOGLE_USERINFO_URL, headers=headers)
    response.raise_for_status() 
    return response.json()


def get_github_redirect_url():
    params = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "redirect_uri": GITHUB_REDIRECT_URI,
        "scope": "user:email",
        "state": "random_state_string"
    }
    return f"{GITHUB_AUTH_URL}?{urlencode(params)}"


def exchange_github_code_for_token(code):
    data = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "client_secret": settings.GITHUB_CLIENT_SECRET,
        "code": code,
        "redirect_uri": GITHUB_REDIRECT_URI
    }
    headers = {"Accept": "application/json"}
    response = requests.post(GITHUB_TOKEN_URL, data=data, headers=headers)
    response.raise_for_status()
    token_data = response.json()
    if "access_token" not in token_data:
        raise ValueError("No access token in response")
    return token_data["access_token"]


def get_github_user_info(token):
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    response = requests.get(GITHUB_USERINFO_URL, headers=headers)
    response.raise_for_status()
    user_data = response.json()

    if not user_data.get("email"):
        email_response = requests.get(
            f"{GITHUB_USERINFO_URL}/emails", headers=headers)
        if email_response.status_code == 200:
            emails = email_response.json()
            primary_email = next(
                (email["email"] for email in emails if email["primary"]), None)
            if primary_email:
                user_data["email"] = primary_email

    return user_data
