"""
Invoice Email Template Helpers

Provides helper functions for rendering invoice notification emails.
These helpers work with the Jinja2-based templates.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Dict, Any, Union

from . import render_template, render_invoice_notification_email, INVOICE_NOTIFICATION


def format_currency(amount: Union[Decimal, float, int], currency: str = "EUR") -> str:
    """
    Format a decimal amount as currency string.

    Args:
        amount: The amount to format
        currency: Currency code (not used in output, for reference)

    Returns:
        Formatted amount string with thousands separator
    """
    try:
        return f"{float(amount):,.2f}"
    except (ValueError, TypeError):
        return str(amount)


def format_date(d: Union[date, datetime, str], format_str: str = "%d/%m/%Y") -> str:
    """
    Format a date for display.

    Args:
        d: Date object or string to format
        format_str: Output format string

    Returns:
        Formatted date string
    """
    if isinstance(d, str):
        return d
    if isinstance(d, (date, datetime)):
        return d.strftime(format_str)
    return str(d)


def calculate_days_until_due(due_date: Union[date, datetime]) -> int:
    """
    Calculate the number of days until a due date.

    Args:
        due_date: The payment due date

    Returns:
        Number of days until due (negative if overdue)
    """
    if isinstance(due_date, datetime):
        due_date = due_date.date()
    today = date.today()
    delta = due_date - today
    return delta.days


def render_invoice_notification(
    # Invoice details
    invoice_reference: str,
    invoice_date: Union[date, datetime, str],
    due_date: Union[date, datetime, str],
    total_ht: Union[Decimal, float],
    total_vat: Union[Decimal, float],
    total_ttc: Union[Decimal, float],
    currency: str = "EUR",

    # Client details
    client_name: str = "",
    billing_company: str = "",
    billing_address: str = "",
    billing_postal_code: str = "",
    billing_city: str = "",
    billing_country: str = "",

    # Payment details
    payment_terms: str = "",
    payment_mode: str = "",

    # Company details
    company_name: str = "ECOLED",
    company_address: str = "",
    company_postal_code: str = "",
    company_city: str = "",
    company_country: str = "",
    company_email: str = "",
    company_phone: str = "",
    company_vat_number: str = "",
    company_siret: str = "",

    # Optional fields
    order_reference: Optional[str] = None,
    po_number: Optional[str] = None,
    invoice_url: Optional[str] = None,
    download_url: Optional[str] = None,
    payment_link: Optional[str] = None,
    bank_name: Optional[str] = None,
    account_holder: Optional[str] = None,
    iban: Optional[str] = None,
    bic: Optional[str] = None,
    company_logo_url: Optional[str] = None,
    custom_message: Optional[str] = None,
    vat_rate: Optional[float] = None,
    discount_amount: Optional[float] = None,

    # Format
    format: str = "html"
) -> str:
    """
    Render an invoice notification email.

    This is a compatibility wrapper that calls the new Jinja2-based
    render_invoice_notification_email function.

    Args:
        invoice_reference: Invoice reference number
        invoice_date: Invoice creation date
        due_date: Payment due date
        total_ht: Subtotal before VAT
        total_vat: VAT amount
        total_ttc: Total including VAT
        currency: Currency code
        client_name: Client name
        billing_company: Billing company name
        billing_address: Billing street address
        billing_postal_code: Billing postal code
        billing_city: Billing city
        billing_country: Billing country
        payment_terms: Payment terms description
        payment_mode: Payment method
        company_name: Your company name
        company_address: Your company address
        company_postal_code: Your company postal code
        company_city: Your company city
        company_country: Your company country
        company_email: Contact email
        company_phone: Contact phone
        company_vat_number: VAT registration number
        company_siret: SIRET number
        order_reference: Related order reference
        po_number: Purchase order number
        invoice_url: URL to view invoice online
        download_url: URL to download PDF
        payment_link: URL for online payment
        bank_name: Bank name for transfers
        account_holder: Bank account holder
        iban: IBAN number
        bic: BIC/SWIFT code
        company_logo_url: URL to company logo
        custom_message: Custom message to include
        vat_rate: VAT percentage rate
        discount_amount: Discount applied
        format: Output format ('txt' or 'html')

    Returns:
        Rendered email content
    """
    # Format dates
    formatted_invoice_date = format_date(invoice_date)
    formatted_due_date = format_date(due_date)

    # Calculate days until due
    days_until_due = None
    if isinstance(due_date, (date, datetime)):
        days_until_due = calculate_days_until_due(due_date)

    # Determine if bank details should be shown
    show_bank_details = any([bank_name, iban, bic])

    # Build payment methods string from payment_mode
    payment_methods = payment_mode if payment_mode else None

    return render_invoice_notification_email(
        client_name=client_name,
        invoice_number=invoice_reference,
        invoice_date=formatted_invoice_date,
        due_date=formatted_due_date,
        total_amount=float(total_ttc),
        currency_symbol=currency,
        total_ht=float(total_ht) if total_ht else None,
        total_vat=float(total_vat) if total_vat else None,
        total_ttc=float(total_ttc) if total_ttc else None,
        vat_rate=vat_rate,
        order_reference=order_reference,
        po_number=po_number,
        invoice_url=invoice_url,
        download_url=download_url,
        payment_link=payment_link,
        payment_terms=payment_terms,
        payment_methods=payment_methods,
        show_bank_details=show_bank_details,
        bank_name=bank_name,
        account_holder=account_holder,
        iban=iban,
        bic=bic,
        billing_company=billing_company,
        billing_address=billing_address,
        billing_postal_code=billing_postal_code,
        billing_city=billing_city,
        billing_country=billing_country,
        company_name=company_name,
        company_address=company_address,
        company_postal_code=company_postal_code,
        company_city=company_city,
        company_country=company_country,
        company_email=company_email,
        company_phone=company_phone,
        company_vat_number=company_vat_number,
        company_siret=company_siret,
        company_logo_url=company_logo_url,
        custom_message=custom_message,
        days_until_due=days_until_due,
        discount_amount=discount_amount,
        format=format,
    )


def create_invoice_email_context(
    invoice: Any,
    client: Any,
    order: Any = None,
    society: Any = None,
    payment_term: Any = None,
    payment_mode: Any = None,
    currency: Any = None,
    base_url: str = ""
) -> Dict[str, Any]:
    """
    Create email context from ORM objects.

    This helper extracts all necessary fields from SQLAlchemy models
    to create the template context.

    Args:
        invoice: TM_INV_ClientInvoice instance
        client: TM_CLI_Client instance
        order: TM_ORD_ClientOrder instance (optional)
        society: TR_SOC_Society instance
        payment_term: TR_PAY_PaymentTerm instance
        payment_mode: TR_PAY_PaymentMode instance
        currency: TR_CUR_Currency instance
        base_url: Base URL for invoice links

    Returns:
        Dictionary with all template variables
    """
    # Calculate days until due
    days_until_due = None
    if hasattr(invoice, 'inv_due_date') and invoice.inv_due_date:
        due = invoice.inv_due_date
        if isinstance(due, datetime):
            due = due.date()
        days_until_due = (due - date.today()).days

    # Get currency code
    currency_code = "EUR"
    if currency and hasattr(currency, 'cur_code'):
        currency_code = currency.cur_code

    # Build invoice URL
    invoice_ref = invoice.inv_reference if hasattr(invoice, 'inv_reference') else str(invoice.id)
    invoice_url = f"{base_url}/invoices/{invoice_ref}" if base_url else None
    download_url = f"{base_url}/invoices/{invoice_ref}/pdf" if base_url else None

    return {
        # Invoice
        "invoice_number": invoice_ref,
        "invoice_date": format_date(invoice.inv_date) if hasattr(invoice, 'inv_date') else "",
        "due_date": format_date(invoice.inv_due_date) if hasattr(invoice, 'inv_due_date') else "",
        "order_reference": order.ord_reference if order and hasattr(order, 'ord_reference') else None,
        "total_amount": float(invoice.inv_total_ttc) if hasattr(invoice, 'inv_total_ttc') else 0,
        "total_ht": float(invoice.inv_total_ht) if hasattr(invoice, 'inv_total_ht') else None,
        "total_vat": float(invoice.inv_total_vat) if hasattr(invoice, 'inv_total_vat') else None,
        "total_ttc": float(invoice.inv_total_ttc) if hasattr(invoice, 'inv_total_ttc') else None,
        "currency_symbol": currency_code,
        "days_until_due": days_until_due,

        # Client
        "client_name": client.cli_name if hasattr(client, 'cli_name') else "",
        "billing_company": client.cli_name if hasattr(client, 'cli_name') else "",
        "billing_address": getattr(client, 'cli_billing_address', None) or getattr(client, 'cli_address', "") or "",
        "billing_postal_code": getattr(client, 'cli_billing_postal_code', None) or getattr(client, 'cli_postal_code', "") or "",
        "billing_city": getattr(client, 'cli_billing_city', None) or getattr(client, 'cli_city', "") or "",
        "billing_country": getattr(client, 'cli_country', "France"),

        # Payment
        "payment_terms": payment_term.pay_name if payment_term and hasattr(payment_term, 'pay_name') else "Net 30",
        "payment_methods": payment_mode.pam_name if payment_mode and hasattr(payment_mode, 'pam_name') else "Bank Transfer",

        # Company
        "company_name": society.soc_name if society and hasattr(society, 'soc_name') else "ECOLED",
        "company_address": society.soc_address if society and hasattr(society, 'soc_address') else "",
        "company_postal_code": society.soc_postal_code if society and hasattr(society, 'soc_postal_code') else "",
        "company_city": society.soc_city if society and hasattr(society, 'soc_city') else "",
        "company_country": "France",
        "company_email": society.soc_email if society and hasattr(society, 'soc_email') else "",
        "company_phone": society.soc_phone if society and hasattr(society, 'soc_phone') else "",
        "company_vat_number": society.soc_vat_number if society and hasattr(society, 'soc_vat_number') else "",
        "company_siret": society.soc_siret if society and hasattr(society, 'soc_siret') else "",

        # URLs
        "invoice_url": invoice_url,
        "download_url": download_url,

        # Bank details (would come from society or payment config)
        "show_bank_details": False,
        "bank_name": getattr(society, 'soc_bank_name', None) if society else None,
        "iban": getattr(society, 'soc_iban', None) if society else None,
        "bic": getattr(society, 'soc_bic', None) if society else None,
    }


def render_invoice_notification_from_models(
    invoice: Any,
    client: Any,
    order: Any = None,
    society: Any = None,
    payment_term: Any = None,
    payment_mode: Any = None,
    currency: Any = None,
    base_url: str = "",
    format: str = "html"
) -> str:
    """
    Render invoice notification directly from ORM models.

    This is a convenience function that combines create_invoice_email_context
    and render_invoice_notification_email.

    Args:
        invoice: TM_INV_ClientInvoice instance
        client: TM_CLI_Client instance
        order: TM_ORD_ClientOrder instance (optional)
        society: TR_SOC_Society instance
        payment_term: TR_PAY_PaymentTerm instance
        payment_mode: TR_PAY_PaymentMode instance
        currency: TR_CUR_Currency instance
        base_url: Base URL for invoice links
        format: Output format ('html' or 'txt')

    Returns:
        Rendered email content
    """
    context = create_invoice_email_context(
        invoice=invoice,
        client=client,
        order=order,
        society=society,
        payment_term=payment_term,
        payment_mode=payment_mode,
        currency=currency,
        base_url=base_url,
    )

    return render_invoice_notification_email(format=format, **context)
