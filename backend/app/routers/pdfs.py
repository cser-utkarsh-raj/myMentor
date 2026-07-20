from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.schemas import PDFResponse
from app.services.pdf_service import PDFService
from app.core.logger import logger
from typing import List

router = APIRouter(prefix="/pdfs", tags=["PDFs"])

@router.post("/", response_model=PDFResponse, status_code=status.HTTP_201_CREATED)
def upload_pdf(
    file: UploadFile = File(...),
    category: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Uploads a PDF document to local storage and registers its metadata.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF documents are allowed."
        )
        
    try:
        pdf = PDFService.upload_pdf(db, file, category)
        return pdf
    except Exception as e:
        logger.error(f"Error in upload_pdf endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload PDF: {e}"
        )

@router.get("/", response_model=List[PDFResponse])
def list_pdfs(db: Session = Depends(get_db)):
    return PDFService.list_pdfs(db)

@router.delete("/{pdf_id}", status_code=status.HTTP_200_OK)
def delete_pdf(pdf_id: int, db: Session = Depends(get_db)):
    success = PDFService.delete_pdf(db, pdf_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PDF file metadata with ID {pdf_id} not found."
        )
    return {"message": "PDF file and metadata successfully deleted."}
