"""
Email Templates Package

This package contains email templates for various notifications.
Templates are available in both plain text (.txt) and HTML (.html) formats.

Templates use Jinja2 syntax for variable substitution and control flow:
- Variables: {{ variable_name }}
- Conditionals: {% if condition %}...{% endif %}
- Loops: {% for item in items %}...{% endfor %}
- Filters: {{ value|default('fallback') }}
"""

from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime

try:
    from jinja2 import Environment, FileSystemLoader, select_autoescape
    HAS_JINJA2 = True
except ImportError:
    HAS_JINJA2 = False

# Template directory path
TEMPLATE_DIR = Path(__file__).parent

# Template names as constants
INVOICE_NOTIFICATION = "invoice_notification"


def get_template_path(template_name: str, format: str = "txt") -> Path:
    """
    Get the full path to an email template.

    Args:
        template_name: Name of the template (without extension)
        format: Template format ('txt' or 'html')

    Returns:
        Path to the template file

    Raises:
        FileNotFoundError: If template doesn't exist
    """
    template_path = TEMPLATE_DIR / f"{template_name}.{format}"
    if not template_path.exists():
        raise FileNotFoundError(f"Template not found: {template_path}")
    return template_path


def load_template(template_name: str, format: str = "txt") -> str:
    """
    Load an email template content.

    Args:
        template_name: Name of the template (without extension)
        format: Template format ('txt' or 'html')

    Returns:
        Template content as string
    """
    template_path = get_template_path(template_name, format)
    return template_path.read_text(encoding="utf-8")


def _number_format(value, decimals: int = 2, decimal_sep: str = '.', thousands_sep: str = ',') -> str:
    """Custom Jinja2 filter for number formatting."""
    try:
        number = float(value)
        formatted = f"{number:,.{decimals}f}"
        # Replace separators if different from default
        if thousands_sep != ',' or decimal_sep != '.':
            # First replace comma with placeholder
            formatted = formatted.replace(',', 'THOUSANDS')
            formatted = formatted.replace('.', decimal_sep)
            formatted = formatted.replace('THOUSANDS', thousands_sep)
        return formatted
    except (ValueError, TypeError):
        return str(value)


def _get_jinja_env() -> "Environment":
    """Get or create Jinja2 environment with custom filters."""
    if not HAS_JINJA2:
        raise ImportError(
            "Jinja2 is required for template rendering. "
            "Install it with: pip install jinja2"
        )

    env = Environment(
        loader=FileSystemLoader(str(TEMPLATE_DIR)),
        autoescape=select_autoescape(['html', 'htm', 'xml']),
        trim_blocks=True,
        lstrip_blocks=True,
    )

    # Add custom filters
    env.filters['number_format'] = _number_format

    # Add global variables
    env.globals['current_year'] = datetime.now().year

    return env


def render_template(
    template_name: str,
    format: str = "txt",
    **kwargs
) -> str:
    """
    Load and render an email template with provided variables using Jinja2.

    Args:
        template_name: Name of the template (without extension)
        format: Template format ('txt' or 'html')
        **kwargs: Template variables to substitute

    Returns:
        Rendered template content

    Example:
        html_content = render_template(
            "invoice_notification",
            format="html",
            client_name="John Doe",
            invoice_number="INV-2025-001",
            total_amount=1500.00,
            due_date="15/02/2025"
        )
    """
    if HAS_JINJA2:
        env = _get_jinja_env()
        template_file = f"{template_name}.{format}"
        template = env.get_template(template_file)
        return template.render(**kwargs)
    else:
        # Fallback to simple string replacement for backward compatibility
        template_content = load_template(template_name, format)
        for key, value in kwargs.items():
            # Handle both Jinja2-style and old-style placeholders
            placeholder_jinja = "{{ " + key + " }}"
            placeholder_old = "{" + key + "}"
            str_value = str(value) if value is not None else ""
            template_content = template_content.replace(placeholder_jinja, str_value)
            template_content = template_content.replace(placeholder_old, str_value)
        return template_content


def render_invoice_notification_email(
    client_name: str,
    invoice_number: str,
    invoice_date: str,
    due_date: str,
    total_amount: float,
    currency_symbol: str = "EUR",
    total_ht: Optional[float] = None,
    total_vat: Optional[float] = None,
    total_ttc: Optional[float] = None,
    vat_rate: Optional[float] = None,
    order_reference: Optional[str] = None,
    po_number: Optional[str] = None,
    invoice_url: Optional[str] = None,
    download_url: Optional[str] = None,
    payment_link: Optional[str] = None,
    payment_terms: Optional[str] = None,
    payment_methods: Optional[str] = None,
    show_bank_details: bool = False,
    bank_name: Optional[str] = None,
    account_holder: Optional[str] = None,
    iban: Optional[str] = None,
    bic: Optional[str] = None,
    billing_company: Optional[str] = None,
    billing_contact: Optional[str] = None,
    billing_address: Optional[str] = None,
    billing_postal_code: Optional[str] = None,
    billing_city: Optional[str] = None,
    billing_country: Optional[str] = None,
    company_name: str = "ECOLED",
    company_address: Optional[str] = None,
    company_postal_code: Optional[str] = None,
    company_city: Optional[str] = None,
    company_country: Optional[str] = None,
    company_email: Optional[str] = None,
    company_phone: Optional[str] = None,
    company_vat_number: Optional[str] = None,
    company_siret: Optional[str] = None,
    company_logo_url: Optional[str] = None,
    custom_message: Optional[str] = None,
    days_until_due: Optional[int] = None,
    discount_amount: Optional[float] = None,
    format: str = "html",
) -> str:
    """
    Render an invoice notification email with all necessary context.

    This is a convenience function that handles all the template variables
    for the invoice notification template.

    Args:
        client_name: Name of the client
        invoice_number: Invoice reference number
        invoice_date: Invoice date (formatted string)
        due_date: Payment due date (formatted string)
        total_amount: Total invoice amount
        currency_symbol: Currency symbol or code (default: EUR)
        total_ht: Subtotal before VAT
        total_vat: VAT amount
        total_ttc: Total including VAT
        vat_rate: VAT percentage rate
        order_reference: Related order reference
        po_number: Purchase order number
        invoice_url: URL to view invoice online
        download_url: URL to download invoice PDF
        payment_link: URL for online payment
        payment_terms: Payment terms description
        payment_methods: Accepted payment methods
        show_bank_details: Whether to show bank details
        bank_name: Bank name for transfer
        account_holder: Bank account holder name
        iban: International Bank Account Number
        bic: Bank Identifier Code
        billing_company: Billing company name
        billing_contact: Billing contact person
        billing_address: Billing street address
        billing_postal_code: Billing postal/zip code
        billing_city: Billing city
        billing_country: Billing country
        company_name: Your company name
        company_address: Your company address
        company_postal_code: Your company postal code
        company_city: Your company city
        company_country: Your company country
        company_email: Contact email
        company_phone: Contact phone
        company_vat_number: VAT registration number
        company_siret: SIRET number (French business ID)
        company_logo_url: URL to company logo
        custom_message: Custom message to include
        days_until_due: Number of days until payment is due
        discount_amount: Discount amount applied
        format: Output format ('html' or 'txt')

    Returns:
        Rendered email content as string
    """
    context = {
        "client_name": client_name,
        "invoice_number": invoice_number,
        "invoice_date": invoice_date,
        "due_date": due_date,
        "total_amount": total_amount,
        "currency_symbol": currency_symbol,
        "total_ht": total_ht or total_amount,
        "total_vat": total_vat,
        "total_ttc": total_ttc or total_amount,
        "vat_rate": vat_rate,
        "order_reference": order_reference,
        "po_number": po_number,
        "invoice_url": invoice_url,
        "download_url": download_url,
        "payment_link": payment_link,
        "payment_terms": payment_terms,
        "payment_methods": payment_methods,
        "show_bank_details": show_bank_details,
        "bank_name": bank_name,
        "account_holder": account_holder,
        "iban": iban,
        "bic": bic,
        "billing_company": billing_company,
        "billing_contact": billing_contact,
        "billing_address": billing_address,
        "billing_postal_code": billing_postal_code,
        "billing_city": billing_city,
        "billing_country": billing_country,
        "company_name": company_name,
        "company_address": company_address,
        "company_postal_code": company_postal_code,
        "company_city": company_city,
        "company_country": company_country,
        "company_email": company_email,
        "company_phone": company_phone,
        "company_vat_number": company_vat_number,
        "company_siret": company_siret,
        "company_logo_url": company_logo_url,
        "custom_message": custom_message,
        "days_until_due": days_until_due,
        "discount_amount": discount_amount,
        "current_year": datetime.now().year,
    }

    return render_template(INVOICE_NOTIFICATION, format=format, **context)


def get_invoice_notification_html(**kwargs) -> str:
    """Shortcut to render HTML invoice notification."""
    return render_invoice_notification_email(format="html", **kwargs)


def get_invoice_notification_text(**kwargs) -> str:
    """Shortcut to render plain text invoice notification."""
    return render_invoice_notification_email(format="txt", **kwargs)
