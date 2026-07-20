from fastapi import APIRouter
from app.services.resource_service import ResourceService
from typing import Dict, List, Any

router = APIRouter(prefix="/resources", tags=["Resources"])

@router.get("/")
def get_all_resources():
    """
    Returns the built-in catalog of question resources (Must 75, Blind 75, SQL 25, etc.).
    """
    return ResourceService.get_all_resources()
