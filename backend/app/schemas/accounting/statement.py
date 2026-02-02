"""
Accounting Statement Schemas
"""
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


class StatementType(str, Enum):
    """Types of financial statements"""
    BALANCE_SHEET = "BALANCE_SHEET"
    INCOME_STATEMENT = "INCOME_STATEMENT"
    TRIAL_BALANCE = "TRIAL_BALANCE"
    GENERAL_LEDGER = "GENERAL_LEDGER"
    CASH_FLOW = "CASH_FLOW"


class StatementPeriod(str, Enum):
    """Predefined periods for statements"""
    CURRENT_MONTH = "CURRENT_MONTH"
    PREVIOUS_MONTH = "PREVIOUS_MONTH"
    CURRENT_QUARTER = "CURRENT_QUARTER"
    PREVIOUS_QUARTER = "PREVIOUS_QUARTER"
    CURRENT_YEAR = "CURRENT_YEAR"
    PREVIOUS_YEAR = "PREVIOUS_YEAR"
    CUSTOM = "CUSTOM"


class StatementGenerateRequest(BaseModel):
    """Request schema for generating a statement"""
    statement_type: StatementType = Field(..., description="Type of statement to generate")
    society_id: int = Field(..., description="Society/Company ID")
    period: Optional[StatementPeriod] = Field(StatementPeriod.CURRENT_MONTH, description="Predefined period")
    start_date: Optional[date] = Field(None, description="Custom start date (required if period is CUSTOM)")
    end_date: Optional[date] = Field(None, description="Custom end date (required if period is CUSTOM)")
    include_zero_balances: bool = Field(False, description="Include accounts with zero balance")
    compare_previous_period: bool = Field(False, description="Include comparison with previous period")
    
    class Config:
        json_schema_extra = {
            "example": {
                "statement_type": "BALANCE_SHEET",
                "society_id": 1,
                "period": "CURRENT_MONTH",
                "include_zero_balances": False,
                "compare_previous_period": True
            }
        }


class AccountLineItem(BaseModel):
    """Single account line in a statement"""
    account_id: int
    account_code: str
    account_name: str
    account_type: str
    debit: Decimal = Decimal("0.00")
    credit: Decimal = Decimal("0.00")
    balance: Decimal = Decimal("0.00")
    previous_balance: Optional[Decimal] = None
    variance: Optional[Decimal] = None
    variance_percentage: Optional[Decimal] = None


class AccountGroupSummary(BaseModel):
    """Summary for a group of accounts"""
    group_name: str
    group_code: str
    accounts: List[AccountLineItem] = []
    total_debit: Decimal = Decimal("0.00")
    total_credit: Decimal = Decimal("0.00")
    total_balance: Decimal = Decimal("0.00")
    previous_total: Optional[Decimal] = None


class BalanceSheetSection(BaseModel):
    """Section of a balance sheet (Assets, Liabilities, Equity)"""
    section_name: str
    groups: List[AccountGroupSummary] = []
    section_total: Decimal = Decimal("0.00")
    previous_section_total: Optional[Decimal] = None


class BalanceSheetData(BaseModel):
    """Balance sheet specific data"""
    assets: BalanceSheetSection
    liabilities: BalanceSheetSection
    equity: BalanceSheetSection
    total_assets: Decimal = Decimal("0.00")
    total_liabilities_equity: Decimal = Decimal("0.00")
    is_balanced: bool = True


class IncomeStatementData(BaseModel):
    """Income statement specific data"""
    revenue: AccountGroupSummary
    cost_of_goods_sold: AccountGroupSummary
    gross_profit: Decimal = Decimal("0.00")
    operating_expenses: AccountGroupSummary
    operating_income: Decimal = Decimal("0.00")
    other_income: AccountGroupSummary
    other_expenses: AccountGroupSummary
    net_income_before_tax: Decimal = Decimal("0.00")
    tax_expense: Decimal = Decimal("0.00")
    net_income: Decimal = Decimal("0.00")
    previous_net_income: Optional[Decimal] = None


class TrialBalanceData(BaseModel):
    """Trial balance specific data"""
    accounts: List[AccountLineItem] = []
    total_debit: Decimal = Decimal("0.00")
    total_credit: Decimal = Decimal("0.00")
    is_balanced: bool = True
    difference: Decimal = Decimal("0.00")


class GeneralLedgerEntry(BaseModel):
    """Single entry in general ledger"""
    entry_date: date
    journal_entry_id: int
    journal_entry_reference: str
    description: Optional[str]
    debit: Decimal = Decimal("0.00")
    credit: Decimal = Decimal("0.00")
    running_balance: Decimal = Decimal("0.00")


class GeneralLedgerAccount(BaseModel):
    """General ledger for a single account"""
    account_id: int
    account_code: str
    account_name: str
    opening_balance: Decimal = Decimal("0.00")
    entries: List[GeneralLedgerEntry] = []
    closing_balance: Decimal = Decimal("0.00")
    total_debit: Decimal = Decimal("0.00")
    total_credit: Decimal = Decimal("0.00")


class GeneralLedgerData(BaseModel):
    """General ledger specific data"""
    accounts: List[GeneralLedgerAccount] = []


class StatementMetadata(BaseModel):
    """Metadata about the generated statement"""
    statement_type: StatementType
    society_id: int
    society_name: str
    period_start: date
    period_end: date
    generated_at: datetime
    generated_by: Optional[str] = None
    currency_code: str = "EUR"
    currency_symbol: str = "€"


class StatementGenerateResponse(BaseModel):
    """Response schema for generated statement"""
    success: bool = True
    metadata: StatementMetadata
    balance_sheet: Optional[BalanceSheetData] = None
    income_statement: Optional[IncomeStatementData] = None
    trial_balance: Optional[TrialBalanceData] = None
    general_ledger: Optional[GeneralLedgerData] = None
    warnings: List[str] = []
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "metadata": {
                    "statement_type": "BALANCE_SHEET",
                    "society_id": 1,
                    "society_name": "ECOLED EUROPE",
                    "period_start": "2024-01-01",
                    "period_end": "2024-01-31",
                    "generated_at": "2024-01-31T12:00:00",
                    "currency_code": "EUR",
                    "currency_symbol": "€"
                },
                "warnings": []
            }
        }
