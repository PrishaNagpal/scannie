from fastapi import FastAPI
from app.api.scans import router as scans_router

app = FastAPI(
    title="Scannie",
    description="Network security scanner with AI triage",
    version="1.0.0"
)

app.include_router(scans_router)

@app.get("/health")
def health_check():
    return {
        "status": "running",
        "message": "Scannie is up"
    }
