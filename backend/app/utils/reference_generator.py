"""
Reference code generation utility.

Pattern: PREFIX + YYMM + 3-digit sequence
Example: SOD2602001 (Supplier Order, Feb 2026, sequence 001)

This utility generates unique reference codes for various entities
following a consistent naming convention across the ERP system.
"""
from datetime import datetime
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from typing import Optional, Type, Any


# ==========================================================================
# Entity Prefix Mapping
# ==========================================================================

ENTITY_PREFIXES = {
    'client': 'CLI',
    'supplier': 'SUP',
    'product': 'PRD',
    'project': 'PRJ',
    'quote': 'CPL',
    'order': 'COD',
    'delivery': 'DFO',
    'invoice': 'CIN',
    'supplier_order': 'SOD',
    'supplier_invoice': 'SIN',
    'purchase_intent': 'PIN',
}


# ==========================================================================
# Reference Generator Functions
# ==========================================================================

def generate_reference(
    db: Session,
    entity_type: str,
    model_class: Type[Any],
    ref_column: str,
    date: Optional[datetime] = None
) -> str:
    """
    Generate unique reference code for an entity.

    The reference format is: PREFIX + YYMM + 3-digit sequence
    Example: SOD2602001 (Supplier Order, Feb 2026, sequence 001)

    Args:
        db: Database session
        entity_type: Type of entity (from ENTITY_PREFIXES keys)
        model_class: SQLAlchemy model class
        ref_column: Name of the reference column in the model
        date: Date for the reference (defaults to now)

    Returns:
        Reference code string like 'SOD2602001'

    Raises:
        ValueError: If entity_type is not valid

    Example:
        >>> from app.models.order import SupplierOrder
        >>> ref = generate_reference(
        ...     db=session,
        ...     entity_type='supplier_order',
        ...     model_class=SupplierOrder,
        ...     ref_column='sod_ref'
        ... )
        >>> print(ref)  # 'SOD2602001'
    """
    if date is None:
        date = datetime.now()

    # Get prefix for entity type
    prefix = ENTITY_PREFIXES.get(entity_type)
    if prefix is None:
        # Default to first 3 letters of entity type, uppercase
        prefix = entity_type[:3].upper() if entity_type else 'REF'

    # Format: YYMM (2-digit year + 2-digit month)
    yymm = date.strftime("%y%m")
    full_prefix = f"{prefix}{yymm}"

    # Get max reference for this prefix in the current month
    ref_attr = getattr(model_class, ref_column)
    stmt = select(func.max(ref_attr)).where(
        ref_attr.like(f"{full_prefix}%")
    )
    result = db.execute(stmt)
    max_ref = result.scalar()

    if max_ref:
        try:
            # Extract sequence number and increment
            seq_str = max_ref[len(full_prefix):]
            num = int(seq_str) + 1
        except (ValueError, IndexError):
            # If parsing fails, start from 1
            num = 1
    else:
        num = 1

    # Format: PREFIX + YYMM + 3-digit sequence (padded with zeros)
    return f"{full_prefix}{num:03d}"


def generate_reference_with_prefix(
    db: Session,
    prefix: str,
    model_class: Type[Any],
    ref_column: str,
    date: Optional[datetime] = None
) -> str:
    """
    Generate unique reference code with a custom prefix.

    Similar to generate_reference but allows specifying any prefix
    instead of using the entity type mapping.

    Args:
        db: Database session
        prefix: Custom prefix (e.g., 'ORD', 'INV')
        model_class: SQLAlchemy model class
        ref_column: Name of the reference column in the model
        date: Date for the reference (defaults to now)

    Returns:
        Reference code string like 'ORD2602001'

    Example:
        >>> ref = generate_reference_with_prefix(
        ...     db=session,
        ...     prefix='ORD',
        ...     model_class=Order,
        ...     ref_column='ord_ref'
        ... )
        >>> print(ref)  # 'ORD2602001'
    """
    if date is None:
        date = datetime.now()

    # Format: YYMM (2-digit year + 2-digit month)
    yymm = date.strftime("%y%m")
    full_prefix = f"{prefix}{yymm}"

    # Get max reference for this prefix in the current month
    ref_attr = getattr(model_class, ref_column)
    stmt = select(func.max(ref_attr)).where(
        ref_attr.like(f"{full_prefix}%")
    )
    result = db.execute(stmt)
    max_ref = result.scalar()

    if max_ref:
        try:
            # Extract sequence number and increment
            seq_str = max_ref[len(full_prefix):]
            num = int(seq_str) + 1
        except (ValueError, IndexError):
            num = 1
    else:
        num = 1

    return f"{full_prefix}{num:03d}"


def get_next_sequence(
    db: Session,
    model_class: Type[Any],
    ref_column: str,
    prefix: str
) -> int:
    """
    Get the next sequence number for a given prefix.

    Useful for preview or validation purposes without
    generating a complete reference.

    Args:
        db: Database session
        model_class: SQLAlchemy model class
        ref_column: Name of the reference column in the model
        prefix: Full prefix including YYMM (e.g., 'SOD2602')

    Returns:
        Next available sequence number
    """
    ref_attr = getattr(model_class, ref_column)
    stmt = select(func.max(ref_attr)).where(
        ref_attr.like(f"{prefix}%")
    )
    result = db.execute(stmt)
    max_ref = result.scalar()

    if max_ref:
        try:
            seq_str = max_ref[len(prefix):]
            return int(seq_str) + 1
        except (ValueError, IndexError):
            return 1
    return 1


def validate_reference_format(reference: str, entity_type: str) -> bool:
    """
    Validate that a reference code follows the expected format.

    Args:
        reference: Reference code to validate
        entity_type: Type of entity (from ENTITY_PREFIXES keys)

    Returns:
        True if valid, False otherwise

    Example:
        >>> validate_reference_format('SOD2602001', 'supplier_order')
        True
        >>> validate_reference_format('INVALID', 'supplier_order')
        False
    """
    prefix = ENTITY_PREFIXES.get(entity_type)
    if prefix is None:
        return False

    if not reference.startswith(prefix):
        return False

    # Check length: PREFIX(3) + YYMM(4) + SEQ(3+) = 10+
    if len(reference) < 10:
        return False

    # Check that YYMM portion is numeric
    yymm = reference[len(prefix):len(prefix)+4]
    if not yymm.isdigit():
        return False

    # Check that sequence portion is numeric
    seq = reference[len(prefix)+4:]
    if not seq.isdigit():
        return False

    return True


def parse_reference(reference: str) -> dict:
    """
    Parse a reference code into its components.

    Args:
        reference: Reference code to parse

    Returns:
        Dictionary with keys: prefix, year, month, sequence, entity_type

    Example:
        >>> parse_reference('SOD2602001')
        {'prefix': 'SOD', 'year': 26, 'month': 2, 'sequence': 1, 'entity_type': 'supplier_order'}
    """
    if len(reference) < 10:
        raise ValueError(f"Invalid reference format: {reference}")

    prefix = reference[:3]
    yymm = reference[3:7]
    seq = reference[7:]

    # Find entity type from prefix
    entity_type = None
    for etype, eprefix in ENTITY_PREFIXES.items():
        if eprefix == prefix:
            entity_type = etype
            break

    return {
        'prefix': prefix,
        'year': int(yymm[:2]),
        'month': int(yymm[2:]),
        'sequence': int(seq),
        'entity_type': entity_type,
    }
