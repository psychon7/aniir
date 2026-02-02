"""PDF Generation API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Literal
import io

from app.api.deps import get_db, get_current_user
from app.services.pdf_service import PDFService
from app.schemas.pdf import PDFGenerateResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/generate/{document_type}/{document_id}", response_model=PDFGenerateResponse)
async def generate_pdf(
    document_type: Literal["invoice", "quote", "order"],
    document_id: int,
    save_to_storage: bool = True,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Generate PDF for a document and optionally save to storage.
    
    Returns the storage URL if saved, or indicates PDF is ready for download.
    """
    try:
        pdf_service = PDFService(db)
        
        # Get document data based on type
        if document_type == "invoice":
            document_data = pdf_service.get_invoice_data(document_id)
        elif document_type == "quote":
            document_data = pdf_service.get_quote_data(document_id)
        elif document_type == "order":
            document_data = pdf_service.get_order_data(document_id)
        else:
            raise HTTPException(status_code=400, detail=f"Invalid document type: {document_type}")
        
        # Generate PDF
        pdf_bytes, storage_url = pdf_service.generate_pdf(
            document_type=document_type,
            document_data=document_data,
            save_to_storage=save_to_storage,
        )
        
        return PDFGenerateResponse(
            success=True,
            message="PDF generated successfully",
            storage_url=storage_url,
            filename=f"{document_data['reference']}.pdf",
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating PDF: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating PDF")


@router.get("/download/{document_type}/{document_id}")
async def download_pdf(
    document_type: Literal["invoice", "quote", "order"],
    document_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Generate and download PDF directly.
    
    Returns the PDF file as a streaming response.
    """
    try:
        pdf_service = PDFService(db)
        
        # Get document data based on type
        if document_type == "invoice":
            document_data = pdf_service.get_invoice_data(document_id)
        elif document_type == "quote":
            document_data = pdf_service.get_quote_data(document_id)
        elif document_type == "order":
            document_data = pdf_service.get_order_data(document_id)
        else:
            raise HTTPException(status_code=400, detail=f"Invalid document type: {document_type}")
        
        # Generate PDF without saving to storage
        pdf_bytes, _ = pdf_service.generate_pdf(
            document_type=document_type,
            document_data=document_data,
            save_to_storage=False,
        )
        
        filename = f"{document_data['reference']}.pdf"
        
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Length": str(len(pdf_bytes)),
            }
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error downloading PDF: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating PDF")
