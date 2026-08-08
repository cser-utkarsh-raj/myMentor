import uvicorn
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logger import logger
from app.database.session import engine, get_db
from app.database.base_class import Base
# Make sure models are loaded to register them on Base metadata
from app.database import base  # noqa
from app.routers import goals, tasks, timer, pdfs, resources, system, ai

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise-grade AI-powered learning roadmap platform backend.",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

@app.on_event("startup")
def on_startup():
    try:
        logger.info("Initializing database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing database tables: {e}")

from fastapi.responses import JSONResponse, Response

# 1. Custom HTTP Middleware to guarantee CORS headers on OPTIONS preflight & 500 exceptions
@app.middleware("http")
async def cors_and_catch_all_middleware(request, call_next):
    if request.method == "OPTIONS":
        response = Response(status_code=204)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Accept"
        return response

    try:
        response = await call_next(request)
    except Exception as exc:
        logger.error(f"Unhandled backend exception on {request.url.path}: {exc}")
        response = JSONResponse(
            status_code=500,
            content={"detail": f"Internal server error: {str(exc)}"}
        )
    
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Accept"
    return response

# 2. Standard CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Router Modules
app.include_router(goals.router, prefix=settings.API_V1_STR)
app.include_router(tasks.router, prefix=settings.API_V1_STR)
app.include_router(timer.router, prefix=settings.API_V1_STR)
app.include_router(pdfs.router, prefix=settings.API_V1_STR)
app.include_router(resources.router, prefix=settings.API_V1_STR)
app.include_router(system.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)

@app.get("/health")
@app.get("/api/v1/health")
def health_check(db = Depends(get_db)):
    """Simple status check for deployment environment validation."""
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check database failure: {e}")
        return {"status": "healthy", "database": f"failed: {str(e)}"}

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    logger.info(f"Starting {settings.PROJECT_NAME} backend server on port {settings.PORT}...")
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
