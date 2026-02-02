"""Accounting API endpoints."""
from datetime import date
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.services.accounting_service import AccountingService
from app.schemas.accounting import ReceivablesAgingResponse

router = APIRouter(prefix="/api/v1/accounting", tags=["accounting"])


@router.get(
    "/receivables-aging",
    response_model=ReceivablesAgingResponse,
    summary="Get Receivables Aging Report",
    description="""
    Generate a receivables aging report showing outstanding invoices grouped by aging buckets.
    
    **Aging Buckets:**
    - Current: Not yet due
    - 1-30 days: 1 to 30 days overdue
    - 31-60 days: 31 to 60 days overdue
    - 61-90 days: 61 to 90 days overdue
    - 90+ days: More than 90 days overdue
    
    **Response includes:**
    - Summary with totals and percentages
    - Breakdown by client
    - Optional invoice-level details
    """
)
async def get_receivables_aging(
    as_of_date: Optional[date] = Query(
        None,
        description="Report as of date (default: today)"
    ),
    society_id: Optional[int] = Query(
        None,
        description="Filter by society ID"
    ),
    client_id: Optional[int] = Query(
        None,
        description="Filter by specific client ID"
    ),
    min_amount: Optional[Decimal] = Query(
        None,
        ge=0,
        description="Minimum outstanding amount to include"
    ),
    include_invoices: bool = Query(
        False,
        description="Include invoice-level details in response"
    ),
    currency_id: Optional[int] = Query(
        None,
        description="Filter by currency ID"
    ),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> ReceivablesAgingResponse:
    """
    Get receivables aging report.
    
    This endpoint provides a comprehensive view of accounts receivable,
    organized by aging buckets to help identify overdue payments and
    potential collection issues.
    
    **Permissions required:** Authenticated user with accounting access
    
    **Use cases:**
    - Monthly AR aging review
    - Credit risk assessment
    - Collection prioritization
    - Cash flow forecasting
    """
    try:
        service = AccountingService(db)
        
        return service.get_receivables_aging(
            as_of_date=as_of_date,
            society_id=society_id,
            client_id=client_id,
            min_amount=min_amount,
            include_invoices=include_invoices,
            currency_id=currency_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating receivables aging report: {str(e)}"
        )


@router.get(
    "/receivables-aging/export",
    summary="Export Receivables Aging Report",
    description="Export the receivables aging report in CSV format"
)
async def export_receivables_aging(
    as_of_date: Optional[date] = Query(None),
    society_id: Optional[int] = Query(None),
    client_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Export receivables aging report as CSV.
    
    Returns a downloadable CSV file with aging data.
    """
    from fastapi.responses import StreamingResponse
    import csv
    import io
    
    try:
        service = AccountingService(db)
        
        report = service.get_receivables_aging(
            as_of_date=as_of_date,
            society_id=society_id,
            client_id=client_id,
            include_invoices=True
        )
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            "Client Reference",
            "Client Name",
            "Current",
            "1-30 Days",
            "31-60 Days",
            "61-90 Days",
            "90+ Days",
            "Total Outstanding",
            "Invoice Count",
            "Credit Limit",
            "Credit Utilization %"
        ])
        
        # Write client data
        for client in report.by_client:
            writer.writerow([
                client.client_reference,
                client.client_name,
                str(client.current),
                str(client.days_1_30),
                str(client.days_31_60),
                str(client.days_61_90),
                str(client.days_over_90),
                str(client.total_outstanding),
                client.invoice_count,
                str(client.credit_limit) if client.credit_limit else "",
                str(client.credit_utilization) if client.credit_utilization else ""
            ])
        
        # Write summary row
        writer.writerow([])
        writer.writerow(["SUMMARY"])
        writer.writerow(["Total Receivables", str(report.summary.total_receivables)])
        writer.writerow(["Total Overdue", str(report.summary.total_overdue)])
        writer.writerow(["Overdue %", str(report.summary.overdue_percentage)])
        
        output.seek(0)
        
        filename = f"receivables_aging_{report.summary.as_of_date.isoformat()}.csv"
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error exporting receivables aging report: {str(e)}"
        )
