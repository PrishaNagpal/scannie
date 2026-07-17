from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.scans import router as scans_router
from app.api.auth import router as auth_router

app = FastAPI(
    title="Scannie",
    description="Network security scanner with AI triage",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(auth_router)
app.include_router(scans_router)

@app.get("/health")
def health_check():
    return {
        "status": "running",
        "message": "Scannie is up"
    }
