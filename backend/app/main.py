from fastapi import FastAPI

app = FastAPI(
    title="Scannie",
    description="Network security scanner with AI triage",
    version="1.0.0"
)

@app.get("/health")
def health_check():
    return {
        "status": "running",
        "message": "Scannie is up"
    }