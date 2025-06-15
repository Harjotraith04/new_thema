from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, users, projects, documents, quotes, codes, annotations, document_segments, code_quote_assignments, ai_services

app = FastAPI(title="Thematic Analysis AI Tool", version="1.0.0")

# Configure CORS - allow ngrok domains and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000",
                   "http://127.0.0.1:3000",
                   "https://e551-2402-e280-3d24-2a3-1b98-eb30-5dc8-ad68.ngrok-free.app",
                   # Allow all ngrok URLs for development
                   "https://*.ngrok-free.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(
    projects.router, prefix="/api/v1/projects", tags=["Projects"])
app.include_router(
    documents.router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(document_segments.router,
                   prefix="/api/v1/segments", tags=["Document Segments"])
app.include_router(quotes.router, prefix="/api/v1/quotes", tags=["Quotes"])
app.include_router(codes.router, prefix="/api/v1/codes", tags=["Codes"])
app.include_router(annotations.router,
                   prefix="/api/v1/annotations", tags=["Annotations"])
app.include_router(code_quote_assignments.router,
                   prefix="/api/v1/code-assignments", tags=["Code Quote Assignments"])
# AI coding endpoint
app.include_router(ai_services.router, prefix="/api/v1/ai",
                   tags=["AI Services"])


@app.get("/")
def read_root():
    return {"message": "Thematic Analysis AI Tool API", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", reload=True)
