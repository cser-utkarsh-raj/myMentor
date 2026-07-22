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
    def extract_text_from_pdf(file_path: str, max_pages: int = 5) -> str:
        """Extract text from the first few pages of a PDF using pypdf."""
        try:
            from pypdf import PdfReader
            reader = PdfReader(file_path)
            text = ""
            pages_to_read = min(max_pages, len(reader.pages))
            for i in range(pages_to_read):
                page_text = reader.pages[i].extract_text()
                if page_text:
                    text += page_text + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"Failed to extract text from PDF {file_path}: {e}")
            return ""

    @staticmethod
    def upload_pdf(db: Session, file: UploadFile, category: str, user_id: str) -> PDF:
        logger.info(f"Uploading file: {file.filename} in category: {category} for user: {user_id}")
        
        # Ensure uploads folder exists
        os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
        
        # Avoid file collision: sanitize or prefix filename
        filename = os.path.basename(file.filename) if file.filename else "document.pdf"
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
            user_id=user_id,
            filename=filename,
            file_path=file_path,
            size_bytes=size_bytes,
            category=category
        )
        db.add(db_pdf)
        db.commit()
        db.refresh(db_pdf)
        
        logger.info(f"PDF uploaded and registered in DB with ID: {db_pdf.id}")

        # Extract text automatically after upload
        try:
            extracted = PDFService.extract_text_from_pdf(file_path)
            if extracted:
                db_pdf.extracted_text = extracted
                db_pdf.extraction_status = "success"
                logger.info(f"Text extracted successfully from {filename} ({len(extracted)} chars)")
            else:
                db_pdf.extraction_status = "empty"
                logger.info(f"No text could be extracted from {filename} (image-based or empty PDF)")
            db.commit()
            db.refresh(db_pdf)
        except Exception as e:
            logger.error(f"Text extraction failed for {filename}: {e}")
            db_pdf.extraction_status = "failed"
            db.commit()
            db.refresh(db_pdf)

        return db_pdf

    @staticmethod
    def list_pdfs(db: Session, user_id: str) -> List[PDF]:
        logger.info(f"Listing all registered PDFs for user: {user_id}")
        return db.query(PDF).filter(PDF.user_id == user_id).order_by(PDF.upload_date.desc()).all()

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

    @staticmethod
    def get_pdf_context_for_user(db: Session, user_id: str, max_pdfs: int = 3, max_chars_per_pdf: int = 2000) -> str:
        """Build a text context string from the user's uploaded PDFs for AI consumption."""
        try:
            pdfs = db.query(PDF).filter(
                PDF.user_id == user_id,
                PDF.is_archived == False,
                PDF.extraction_status == "success"
            ).order_by(PDF.upload_date.desc()).limit(max_pdfs).all()

            if not pdfs:
                return ""

            context_parts = []
            for pdf in pdfs:
                if pdf.extracted_text:
                    excerpt = pdf.extracted_text[:max_chars_per_pdf]
                    context_parts.append(f"--- Uploaded PDF: {pdf.filename} ---\n{excerpt}")

            return "\n\n".join(context_parts)
        except Exception as e:
            logger.error(f"Error building PDF context: {e}")
            return ""
