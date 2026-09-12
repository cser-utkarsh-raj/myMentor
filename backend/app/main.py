import uvicorn
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logger import logger
from app.database.session import engine, get_db
from app.database.base_class import Base
from app.database import base  # noqa
from app.routers import goals, tasks, timer, pdfs, resources, system, ai
from fastapi.responses import JSONResponse

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-powered learning roadmap and progress platform backend.",
    version="1.1.0",
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

# One CORS implementation only. Origins are configurable through ALLOWED_ORIGINS.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept"],
)

# Convert unexpected exceptions into JSON without swallowing CORS middleware.
@app.middleware("http")
async def catch_unhandled_errors(request, call_next):
    try:
        return await call_next(request)
    except Exception as exc:
        logger.exception(f"Unhandled backend exception on {request.url.path}: {exc}")
        return JSONResponse(status_code=500, content={"detail": "Internal server error. Please try again."})

app.include_router(goals.router, prefix=settings.API_V1_STR)
app.include_router(tasks.router, prefix=settings.API_V1_STR)
app.include_router(timer.router, prefix=settings.API_V1_STR)
app.include_router(pdfs.router, prefix=settings.API_V1_STR)
app.include_router(resources.router, prefix=settings.API_V1_STR)
app.include_router(system.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)

@app.get("/health")
@app.get("/api/v1/health")
def health_check(db=Depends(get_db)):
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check database failure: {e}")
        return {"status": "degraded", "database": "failed", "detail": str(e)}

@app.get("/")
def read_root():
    return {"status": "online", "service": settings.PROJECT_NAME, "version": "1.1.0", "documentation": "/docs"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
