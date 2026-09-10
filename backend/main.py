import uvicorn
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.seed_data import seed_database
from api.routes import router
from api.telemetry_streamer import telemetry_streamer

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and seed telemetry on startup
    print("Initializing AWSense database and seed telemetry...")
    seed_database()
    print("AWSense database initialized successfully.")
    
    # Start continuous live telemetry streaming task
    stream_task = asyncio.create_task(telemetry_streamer())
    print("Live AWS telemetry stream started.")
    
    yield
    
    stream_task.cancel()
    try:
        await stream_task
    except asyncio.CancelledError:
        pass
    print("Shutting down AWSense backend...")

app = FastAPI(
    title="AWSense — Intelligent Weather Station Data Reliability Platform",
    description="SIH26073: AI/ML Based Intelligent Anomaly Detection and Sensor Health Platform for Automatic Weather Stations",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# API routes
app.include_router(router, prefix="/api")

# Determine path to built frontend
possible_dist_dirs = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "dist")),
    os.path.abspath("frontend/dist"),
    os.path.abspath("dist")
]

frontend_dist = next((d for d in possible_dist_dirs if os.path.exists(d)), None)

if frontend_dist:
    print(f"Serving frontend from: {frontend_dist}")
    
    # Mount assets folder if exists
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # Serve SPA pages and static files
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api") or full_path in ["docs", "openapi.json", "redoc"]:
            return None
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "project": "AWSense",
            "tagline": "Intelligent Weather Station Data Reliability & Sensor Health Platform",
            "problem_statement": "SIH26073",
            "status": "OPERATIONAL",
            "docs_url": "/docs",
            "api_prefix": "/api"
        }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=False)
