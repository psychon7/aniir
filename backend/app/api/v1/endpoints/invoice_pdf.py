"""
Invoice PDF Generation API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import io

from app.api.deps import get_db, get_current_user
from app.services.invoice_pdf_service import InvoicePDFService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class PDFGenerateResponse(BaseModel):
    """Response model for PDF generation."""
    success: bool
    message: str
    download_url: Optional[str] = None
    storage_path: Optional[str] = None


class PDFDownloadURLResponse(BaseModel):
    """Response model for PDF download URL."""
    download_url: str
    expires_in: int


@router.post("/{invoice_id}/pdf/generate", response_model=PDFGenerateResponse)
async def generate_invoice_pdf(
    invoice_id: int,
    store: bool = True,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user)  # Uncomment when auth is ready
):
    """
    Generate a PDF for the specified invoice.
    
    Args:
        invoice_id: ID of the invoice
        store: Whether to store the PDF in storage (default: True)
        
    Returns:
        PDFGenerateResponse with success status and download URL
    """
    try:
        pdf_service = InvoicePDFService(db)
        
        if store:
            pdf_content, storage_path = pdf_service.generate_and_store_pdf(invoice_id)
            download_url = pdf_service.get_download_url(invoice_id)
            
            return PDFGenerateResponse(
                success=True,
                message=f"PDF generated and stored successfully",
                download_url=download_url,
                storage_path=storage_path
            )
        else:
            # Just generate without storing
            pdf_content = pdf_service.generate_pdf(invoice_id)
            return PDFGenerateResponse(
                success=True,
                message="PDF generated successfully (not stored)"
            )
            
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating PDF for invoice {invoice_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")


@router.get("/{invoice_id}/pdf/download")
async def download_invoice_pdf(
    invoice_id: int,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user)  # Uncomment when auth is ready
):
    """
    Download the PDF for the specified invoice.
    
    Generates the PDF on-the-fly if not already stored.
    
    Args:
        invoice_id: ID of the invoice
        
    Returns:
        PDF file as streaming response
    """
    try:
        pdf_service = InvoicePDFService(db)
        
        # Generate PDF (will use cached version if available in future)
        pdf_content = pdf_service.generate_pdf(invoice_id)
        
        # Get invoice reference for filename
        invoice = pdf_service._get_invoice_with_relations(invoice_id)
        filename = f"{invoice.inv_reference}.pdf" if invoice else f"invoice-{invoice_id}.pdf"
        
        # Return as streaming response
        return StreamingResponse(
            io.BytesIO(pdf_content),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Length": str(len(pdf_content))
            }
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error downloading PDF for invoice {invoice_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to download PDF: {str(e)}")


@router.get("/{invoice_id}/pdf/preview")
async def preview_invoice_pdf(
    invoice_id: int,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user)  # Uncomment when auth is ready
):
    """
    Preview the PDF for the specified invoice (inline display).
    
    Args:
        invoice_id: ID of the invoice
        
    Returns:
        PDF file for inline display
    """
    try:
        pdf_service = InvoicePDFService(db)
        pdf_content = pdf_service.generate_pdf(invoice_id)
        
        invoice = pdf_service._get_invoice_with_relations(invoice_id)
        filename = f"{invoice.inv_reference}.pdf" if invoice else f"invoice-{invoice_id}.pdf"
        
        return StreamingResponse(
            io.BytesIO(pdf_content),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="{filename}"',
                "Content-Length": str(len(pdf_content))
            }
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error previewing PDF for invoice {invoice_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to preview PDF: {str(e)}")


@router.get("/{invoice_id}/pdf/url", response_model=PDFDownloadURLResponse)
async def get_invoice_pdf_url(
    invoice_id: int,
    expiration: int = 3600,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user)  # Uncomment when auth is ready
):
    """
    Get a presigned download URL for the invoice PDF.
    
    Args:
        invoice_id: ID of the invoice
        expiration: URL expiration time in seconds (default: 1 hour)
        
    Returns:
        PDFDownloadURLResponse with download URL
    """
    try:
        pdf_service = InvoicePDFService(db)
        
        # Ensure PDF exists in storage
        pdf_service.generate_and_store_pdf(invoice_id)
        
        download_url = pdf_service.get_download_url(invoice_id, expiration)
        
        if not download_url:
            raise HTTPException(status_code=404, detail="PDF not found in storage")
        
        return PDFDownloadURLResponse(
            download_url=download_url,
            expires_in=expiration
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting PDF URL for invoice {invoice_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get PDF URL: {str(e)}")
