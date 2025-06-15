from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str

    GITHUB_CLIENT_ID: str
    GITHUB_CLIENT_SECRET: str

    PROJECT_NAME: str = "Thematic Analysis Tool"
    BACKEND_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:3000"

    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str
    UPLOAD_FOLDER: str = "TA_documents"

    GOOGLE_API_KEY: str

    class Config:
        env_file = ".env"
        
    def __init__(self) -> None:
        super().__init__()


settings = Settings()
