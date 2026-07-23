from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.schemas import PDFResponse
from app.services.pdf_service import PDFService
from app.core.logger import logger
from app.api.dependencies import get_current_user
from typing import List

router = APIRouter(prefix="/pdfs", tags=["PDFs"])

@router.post("/", response_model=PDFResponse, status_code=status.HTTP_201_CREATED)
def upload_pdf(
    file: UploadFile = File(...),
    category: str = Form(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Uploads a PDF document to local storage and registers its metadata.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF documents are allowed."
        )
    if file.content_type and file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF documents are accepted."
        )
        
    try:
        pdf = PDFService.upload_pdf(db, file, category, user_id=current_user["id"])
        return pdf
    except Exception as e:
        logger.error(f"Error in upload_pdf endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload PDF: {e}"
        )

@router.get("/", response_model=List[PDFResponse])
def list_pdfs(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return PDFService.list_pdfs(db, user_id=current_user["id"])

@router.delete("/{pdf_id}", status_code=status.HTTP_200_OK)
def delete_pdf(pdf_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    pdf = PDFService.get_pdf(db, pdf_id)
    if not pdf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PDF file metadata with ID {pdf_id} not found."
        )
    if pdf.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this PDF."
        )
    PDFService.delete_pdf(db, pdf_id)
    return {"message": "PDF file and metadata successfully deleted."}

@router.put("/{pdf_id}/archive", response_model=PDFResponse)
def toggle_archive_pdf(pdf_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    pdf = PDFService.get_pdf(db, pdf_id)
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")
    if pdf.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this PDF."
        )
    return PDFService.toggle_archive(db, pdf_id)

@router.put("/{pdf_id}/tags", response_model=PDFResponse)
def update_pdf_tags(pdf_id: int, tags: str = Form(...), db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    pdf = PDFService.get_pdf(db, pdf_id)
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")
    if pdf.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this PDF."
        )
    return PDFService.update_tags(db, pdf_id, tags)


@router.post("/{pdf_id}/generate-roadmap")
def generate_pdf_roadmap(
    pdf_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Generates a personalized daily roadmap using the content of this specific PDF
    to override the user's active goal tracks.
    """
    pdf = PDFService.get_pdf(db, pdf_id)
    if not pdf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PDF with ID {pdf_id} not found."
        )
    if pdf.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this PDF."
        )
    if pdf.extraction_status != "success" or not pdf.extracted_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PDF text extraction is still pending or has failed. Cannot generate roadmap."
        )
        
    from app.services.goal_service import GoalService
    from app.services.roadmap_service import RoadmapService
    
    goal = GoalService.get_active_goal(db, user_id=current_user["id"])
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active goal found. Please create a learning goal first before mapping it to a PDF."
        )
        
    success = RoadmapService.generate_roadmap_from_pdf_content(db, goal, pdf.extracted_text)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI failed to generate a learning roadmap from the PDF content."
        )
        
    return {"message": "Roadmap successfully generated from PDF content!", "goal_id": goal.id}
