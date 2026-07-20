import os
import shutil
from sqlalchemy.orm import Session
from fastapi import UploadFile
from app.models.models import PDF
from app.core.config import settings
from app.core.logger import logger
from typing import List, Optional

class PDFService:
    @staticmethod
    def upload_pdf(db: Session, file: UploadFile, category: str) -> PDF:
        logger.info(f"Uploading file: {file.filename} in category: {category}")
        
        # Ensure uploads folder exists
        os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
        
        # Avoid file collision: sanitize or prefix filename
        filename = file.filename
        file_path = os.path.join(settings.UPLOAD_FOLDER, filename)
        
        # If exists, append index
        base, extension = os.path.splitext(filename)
        counter = 1
        while os.path.exists(file_path):
            filename = f"{base}_{counter}{extension}"
            file_path = os.path.join(settings.UPLOAD_FOLDER, filename)
            counter += 1
            
        # Write to disk
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            logger.info(f"File written to disk successfully: {file_path}")
        except Exception as e:
            logger.error(f"Failed to write file to disk: {e}")
            raise e
            
        # Get file size
        size_bytes = os.path.getsize(file_path)
        
        # Create database entry
        db_pdf = PDF(
            filename=filename,
            file_path=file_path,
            size_bytes=size_bytes,
            category=category
        )
        db.add(db_pdf)
        db.commit()
        db.refresh(db_pdf)
        
        logger.info(f"PDF uploaded and registered in DB with ID: {db_pdf.id}")
        return db_pdf

    @staticmethod
    def list_pdfs(db: Session) -> List[PDF]:
        logger.info("Listing all registered PDFs.")
        return db.query(PDF).order_by(PDF.upload_date.desc()).all()

    @staticmethod
    def get_pdf(db: Session, pdf_id: int) -> Optional[PDF]:
        return db.query(PDF).filter(PDF.id == pdf_id).first()

    @staticmethod
    def delete_pdf(db: Session, pdf_id: int) -> bool:
        logger.info(f"Deleting PDF ID: {pdf_id}")
        db_pdf = db.query(PDF).filter(PDF.id == pdf_id).first()
        if not db_pdf:
            logger.warning(f"PDF ID {pdf_id} not found for deletion.")
            return False
            
        # Remove file from disk
        if os.path.exists(db_pdf.file_path):
            try:
                os.remove(db_pdf.file_path)
                logger.info(f"Removed file from disk: {db_pdf.file_path}")
            except Exception as e:
                logger.error(f"Failed to remove file from disk: {e}")
        else:
            logger.warning(f"File {db_pdf.file_path} did not exist on disk during DB deletion.")
            
        db.delete(db_pdf)
        db.commit()
        logger.info(f"PDF metadata record removed from database.")
        return True

    @staticmethod
    def toggle_archive(db: Session, pdf_id: int) -> Optional[PDF]:
        db_pdf = db.query(PDF).filter(PDF.id == pdf_id).first()
        if not db_pdf:
            return None
        db_pdf.is_archived = not db_pdf.is_archived
        db.commit()
        db.refresh(db_pdf)
        return db_pdf

    @staticmethod
    def update_tags(db: Session, pdf_id: int, tags: str) -> Optional[PDF]:
        db_pdf = db.query(PDF).filter(PDF.id == pdf_id).first()
        if not db_pdf:
            return None
        db_pdf.tags = tags
        db.commit()
        db.refresh(db_pdf)
        return db_pdf
