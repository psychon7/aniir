from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List
import logging

from app.database import get_db
from app.schemas.pdf import (
    PDFStatusResponse,
    PDFGenerateResponse,
    PDFViewUrlResponse,
    BatchPDFStatusRequest,
    DocumentType,
)
from app.services.pdf_service import PDFService
from app.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


def get_pdf_service(db: Session = Depends(get_db)) -> PDFService:
    return PDFService(db)


# Quote PDF endpoints
@router.get("/quotes/{quote_id}/pdf/status", response_model=PDFStatusResponse)
async def get_quote_pdf_status(
    quote_id: int,
    pdf_service: PDFService = Depends(get_pdf_service),
):
    """Get PDF status for a quote"""
    return pdf_service.get_pdf_status("quote", quote_id)


@router.post("/quotes/{quote_id}/pdf/generate", response_model=PDFGenerateResponse)
async def generate_quote_pdf(
    quote_id: int,
    pdf_service: PDFService = Depends(get_pdf_service),
):
    """Generate PDF for a quote"""
    return await pdf_service.generate_pdf("quote", quote_id)


@router.get("/quotes/{quote_id}/pdf/download")
async def download_quote_pdf(
    quote_id: int,
    pdf_service: PDFService = Depends(get_pdf_service),
):
    """Download PDF for a quote"""
    pdf_content, filename = await pdf_service.get_pdf_content("quote", quote_id)
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/quotes/{quote_id}/pdf/view-url", response_model=PDFViewUrlResponse)
async def get_quote_pdf_view_url(
    quote_id: int,
    pdf_service: PDFService = Depends(get_pdf_service),
):
    """Get presigned URL for viewing quote PDF"""
    return pdf_service.get_view_url("quote", quote_id)


@router.post("/quotes/pdf/batch-status", response_model=List[PDFStatusResponse])
async def get_quotes_batch_pdf_status(
    request: BatchPDFStatusRequest,
    pdf_service: PDFService = Depends(get_pdf_service),
):
    """Get PDF status for multiple quotes"""
    return pdf_service.get_batch_pdf_status("quote", request.document_ids)


# Order PDF endpoints
@router.get("/orders/{order_id}/pdf/status", response_model=PDFStatusResponse)
async def get_order_pdf_status(
    order_id: int,
    pdf_service: PDFService = Depends(get_pdf_service),
):
    """Get PDF status for an order"""
    return pdf_service.get_pdf_status("order", order_id)


@router.post("/orders/{order_id}/pdf/generate", response_model=PDFGenerateResponse)
async def generate_order_pdf(
    order_id: int,
    pdf_service: PDFService = Depends(get_pdf_service),
):
    """Generate PDF for an order"""
    return await pdf_service.generate_pdf("order", order_id)


@router.get("/orders/{order_id}/pdf/download")
async def download_order_pdf(
    order_id: int,
    pdf_service: PDFService = Depends(get_pdf_service),
):
    """Download PDF for an order"""
    pdf_content, filename = await pdf_service.get_pdf_content("order", order_id)
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/orders/{order_id}/pdf/view-url", response_model=PDFViewUrlResponse)
async def get_order_pdf_view_url(
    order_id: int,
    pdf_service: PDFService = Depends(get_pdf_service),
):
    """Get presigned URL for viewing order PDF"""
    return pdf_service.get_view_url("order", order_id)


@router.post("/orders/pdf/batch-status", response_model=List[PDFStatusResponse])
async def get_orders_batch_pdf_status(
    request: BatchPDFStatusRequest,
    pdf_service: PDFService = Depends(get_pdf_service),
):
    """Get PDF status for multiple orders"""
    return pdf_service.get_batch_pdf_status("order", request.document_ids)


# Invoice PDF endpoints
@router.get("/invoices/{invoice_id}/pdf/status", response_model=PDFStatusResponse)
async def get_invoice_pdf_status(
    invoice_id: int,
    pdf_service: PDFService = Depends(get_pdf_service),
):
    """Get PDF status for an invoice"""
    return pdf_service.get_pdf_status("invoice", invoice_id)


@router.post("/invoices/{invoice_id}/pdf/generate", response_model=PDFGenerateResponse)
async def generate_invoice_pdf(
    invoice_id: int,
    pdf_service: PDFService = Depends(get_pdf_service),
):
    """Generate PDF for an invoice"""
    return await pdf_service.generate_pdf("invoice", invoice_id)


@router.get("/invoices/{invoice_id}/pdf/download")
async def download_invoice_pdf(
    invoice_id: int,
    pdf_service: PDFService = Depends(get_pdf_service),
):
    """Download PDF for an invoice"""
    pdf_content, filename = await pdf_service.get_pdf_content("invoice", invoice_id)
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/invoices/{invoice_id}/pdf/view-url", response_model=PDFViewUrlResponse)
async def get_invoice_pdf_view_url(
    invoice_id: int,
    pdf_service: PDFService = Depends(get_pdf_service),
):
    """Get presigned URL for viewing invoice PDF"""
    return pdf_service.get_view_url("invoice", invoice_id)


@router.post("/invoices/pdf/batch-status", response_model=List[PDFStatusResponse])
async def get_invoices_batch_pdf_status(
    request: BatchPDFStatusRequest,
    pdf_service: PDFService = Depends(get_pdf_service),
):
    """Get PDF status for multiple invoices"""
    return pdf_service.get_batch_pdf_status("invoice", request.document_ids)
