"""
Quote Service.

WARNING: Most Quote methods are DISABLED because their database tables
(TM_QUO_Quote, TM_QUO_QuoteLine) do NOT exist in the database (DEV_ERP_ECOLED).

However, the get_quote_detail() method is ENABLED and uses the CostPlan model
(TM_CPL_Cost_Plan) which is the actual quote/proposal table in the database.

To fully re-enable:
1. Create the database tables TM_QUO_Quote and TM_QUO_QuoteLine
2. Restore the Quote and QuoteLine models in app/models/quote.py
3. Restore the QuoteRepository in app/repositories/quote_repository.py
4. Restore this service's full implementation

Disabled on: 2026-02-01
Reason: Database alignment - quote tables do not exist in production database
"""
from typing import Optional, List, Dict, Any
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.database import get_db

from app.models.costplan import CostPlan
from app.models.client import Client
from app.models.society import Society
from app.models.project import Project
from app.models.payment_mode import PaymentMode
from app.models.payment_term import PaymentTerm
from app.schemas.costplan import QuoteDetailResponse

logger = logging.getLogger(__name__)


# ==========================================================================
# Exception Classes (kept for compatibility)
# ==========================================================================

class QuoteServiceError(Exception):
    """Base exception for quote service errors."""
    pass


class QuoteNotFoundError(QuoteServiceError):
    """Raised when a quote is not found."""
    pass


class QuoteLineNotFoundError(QuoteServiceError):
    """Raised when a quote line is not found."""
    pass


class QuoteConversionError(QuoteServiceError):
    """Raised when quote conversion fails."""
    pass


class QuoteDuplicateError(QuoteServiceError):
    """Raised when quote duplication fails."""
    pass


class QuoteServiceDisabledError(QuoteServiceError):
    """Raised when the quote service is called but is disabled."""
    pass


# ==========================================================================
# Disabled Service Class
# ==========================================================================

class QuoteService:
    """
    DISABLED: Quote Service for managing quotes and quote lines.

    This service is disabled because the Quote and QuoteLine database tables
    do not exist. All methods will raise QuoteServiceDisabledError.
    """
    __disabled__ = True

    def __init__(self, db=None):
        """
        Initialize the disabled quote service.

        Note: Service is disabled - all operations will raise errors.
        """
        self.db = db
        logger.warning(
            "QuoteService instantiated but is DISABLED - "
            "Quote tables do not exist in database"
        )

    def _raise_disabled(self):
        """Raise disabled error with helpful message."""
        raise QuoteServiceDisabledError(
            "QuoteService is disabled - database tables TM_QUO_Quote and "
            "TM_QUO_QuoteLine do not exist. Create the tables first or use "
            "CostPlan (TM_CPL_Cost_Plan) as an alternative."
        )

    async def create_quote(self, *args, **kwargs):
        """DISABLED: Create a new quote."""
        self._raise_disabled()

    async def get_quote(self, quote_id: int):
        """DISABLED: Get a quote by ID."""
        self._raise_disabled()

    async def get_quote_by_reference(self, reference: str):
        """DISABLED: Get a quote by reference."""
        self._raise_disabled()

    async def update_quote(self, quote_id: int, data):
        """DISABLED: Update a quote."""
        self._raise_disabled()

    async def delete_quote(self, quote_id: int):
        """DISABLED: Delete a quote."""
        self._raise_disabled()

    async def search_quotes(self, params):
        """DISABLED: Search quotes."""
        self._raise_disabled()

    async def add_quote_line(self, quote_id: int, data):
        """DISABLED: Add a line to a quote."""
        self._raise_disabled()

    async def update_quote_line(self, line_id: int, data):
        """DISABLED: Update a quote line."""
        self._raise_disabled()

    async def delete_quote_line(self, line_id: int):
        """DISABLED: Delete a quote line."""
        self._raise_disabled()

    async def get_quote_lines(self, quote_id: int):
        """DISABLED: Get all lines for a quote."""
        self._raise_disabled()

    async def get_quote_line(self, line_id: int):
        """DISABLED: Get a specific quote line."""
        self._raise_disabled()

    async def convert_to_order(self, quote_id: int, request, converted_by: Optional[int] = None):
        """DISABLED: Convert a quote to an order."""
        self._raise_disabled()

    async def duplicate_quote(self, quote_id: int, request, created_by: Optional[int] = None):
        """DISABLED: Duplicate an existing quote."""
        self._raise_disabled()

    # ==========================================================================
    # CostPlan-based Quote Methods (ENABLED - uses TM_CPL_Cost_Plan table)
    # ==========================================================================

    async def get_quote_detail(self, quote_id: int) -> Dict[str, Any]:
        """
        Get quote (cost plan) by ID with resolved lookup names.
        Returns a dict suitable for QuoteDetailResponse.

        This method fetches the quote from TM_CPL_Cost_Plan and enriches it
        with resolved names from lookup tables (client, project, society, etc.).

        Args:
            quote_id: The quote ID (cpl_id)

        Returns:
            dict: Quote data with resolved lookup names

        Raises:
            QuoteNotFoundError: If quote is not found
        """
        if not self.db:
            raise QuoteServiceError("Database session not provided")

        # Get the cost plan (quote) using cpl_id
        stmt = select(CostPlan).where(CostPlan.cpl_id == quote_id)
        result = await self.db.execute(stmt)
        quote = result.scalar_one_or_none()

        if not quote:
            raise QuoteNotFoundError(f"Quote with ID {quote_id} not found")

        # Build base response from ORM object
        response_data = QuoteDetailResponse.model_validate(quote).model_dump()

        # Resolve Client lookup
        if quote.cli_id:
            client_stmt = select(Client).where(Client.cli_id == quote.cli_id)
            client_result = await self.db.execute(client_stmt)
            client = client_result.scalar_one_or_none()
            if client:
                response_data["clientName"] = client.cli_company_name
                response_data["clientReference"] = client.cli_ref

        # Resolve Society lookup
        if quote.soc_id:
            society_stmt = select(Society).where(Society.soc_id == quote.soc_id)
            society_result = await self.db.execute(society_stmt)
            society = society_result.scalar_one_or_none()
            if society:
                response_data["societyName"] = society.soc_society_name

        # Resolve Project lookup
        if quote.prj_id:
            project_stmt = select(Project).where(Project.prj_id == quote.prj_id)
            project_result = await self.db.execute(project_stmt)
            project = project_result.scalar_one_or_none()
            if project:
                response_data["projectName"] = project.prj_name
                response_data["projectCode"] = project.prj_code

        # Resolve Payment Mode lookup
        if quote.pmo_id:
            payment_mode_stmt = select(PaymentMode).where(PaymentMode.pmo_id == quote.pmo_id)
            payment_mode_result = await self.db.execute(payment_mode_stmt)
            payment_mode = payment_mode_result.scalar_one_or_none()
            if payment_mode:
                response_data["paymentModeName"] = payment_mode.pmo_designation

        # Resolve Payment Condition (Term) lookup
        if quote.pco_id:
            payment_term_stmt = select(PaymentTerm).where(PaymentTerm.pco_id == quote.pco_id)
            payment_term_result = await self.db.execute(payment_term_stmt)
            payment_term = payment_term_result.scalar_one_or_none()
            if payment_term:
                response_data["paymentConditionName"] = payment_term.pco_designation
                response_data["paymentTermDays"] = payment_term.pco_numday + payment_term.pco_day_additional

        logger.debug(f"Fetched quote detail for cpl_id={quote_id}")
        return response_data


def get_quote_service(db: AsyncSession = Depends(get_db)) -> "QuoteService":
    """Dependency to get QuoteService instance."""
    return QuoteService(db)
