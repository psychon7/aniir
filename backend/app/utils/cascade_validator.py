"""
Cascade validation utility.

Checks for related records before allowing delete operations.
This prevents orphan records and maintains referential integrity
even when database foreign keys don't have ON DELETE CASCADE.

Usage:
    can_delete, blocking = validate_delete(db, 'client', client_id)
    if not can_delete:
        raise BusinessError(f"Cannot delete: has {', '.join(blocking)}")
"""
from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import Tuple, List, Dict, Any


# ==========================================================================
# Entity Dependencies Configuration
# ==========================================================================

# Define dependencies for each entity type
# Format: (table_name, fk_column, display_name_plural)
ENTITY_DEPENDENCIES: Dict[str, List[Tuple[str, str, str]]] = {
    'client': [
        ('TM_PRJ_Project', 'cli_id', 'projects'),
        ('TM_CPL_Cost_Plan', 'cli_id', 'quotes'),
        ('TM_COD_Client_Order', 'cli_id', 'orders'),
        ('TM_DFO_Delivery_Form', 'cli_id', 'deliveries'),
        ('TM_CIN_Client_Invoice', 'cli_id', 'invoices'),
        ('TM_CCT_Client_Contact', 'cli_id', 'contacts'),
    ],
    'supplier': [
        ('TM_SOD_Supplier_Order', 'sup_id', 'supplier orders'),
        ('TM_SIN_Supplier_Invoice', 'sup_id', 'supplier invoices'),
        ('TM_SPD_Supplier_Product', 'sup_id', 'supplier products'),
        ('TM_SCT_Supplier_Contact', 'sup_id', 'contacts'),
    ],
    'product': [
        ('TM_CLN_CostPlan_Lines', 'prd_id', 'quote lines'),
        ('TM_COL_ClientOrder_Lines', 'prd_id', 'order lines'),
        ('TM_SOL_SupplierOrder_Lines', 'prd_id', 'supplier order lines'),
        ('TM_DFL_DeliveryForm_Lines', 'prd_id', 'delivery lines'),
        ('TM_CIL_ClientInvoice_Lines', 'prd_id', 'invoice lines'),
        ('TM_INV_Inventory', 'prd_id', 'inventory records'),
    ],
    'project': [
        ('TM_CPL_Cost_Plan', 'prj_id', 'quotes'),
        ('TM_COD_Client_Order', 'prj_id', 'orders'),
    ],
    'quote': [
        ('TM_CLN_CostPlan_Lines', 'cpl_id', 'quote lines'),
        ('TM_COD_Client_Order', 'cpl_id', 'orders'),
    ],
    'order': [
        ('TM_COL_ClientOrder_Lines', 'cod_id', 'order lines'),
        ('TM_DFO_Delivery_Form', 'cod_id', 'deliveries'),
        ('TM_CIN_Client_Invoice', 'cod_id', 'invoices'),
    ],
    'delivery': [
        ('TM_DFL_DeliveryForm_Lines', 'dfo_id', 'delivery lines'),
        ('TM_CIN_Client_Invoice', 'dfo_id', 'invoices'),
    ],
    'invoice': [
        ('TM_CIL_ClientInvoice_Lines', 'cin_id', 'invoice lines'),
        ('TM_CPY_Client_Payment', 'cin_id', 'payments'),
    ],
    'user': [
        ('TM_CLI_CLient', 'usr_created_by', 'clients created'),
        ('TM_PRJ_Project', 'usr_id', 'projects'),
        ('TM_CPL_Cost_Plan', 'usr_id', 'quotes'),
        ('TM_COD_Client_Order', 'usr_id', 'orders'),
    ],
    'warehouse': [
        ('TM_INV_Inventory', 'whs_id', 'inventory records'),
    ],
    'category': [
        ('TM_CAT_Category', 'cat_parent_cat_id', 'child categories'),
        ('TM_PRD_Product', 'cat_id', 'products'),
    ],
}


# ==========================================================================
# Validation Functions
# ==========================================================================

def validate_delete(
    db: Session,
    entity_type: str,
    entity_id: int
) -> Tuple[bool, List[str]]:
    """
    Check if entity can be safely deleted.

    Validates that no dependent records exist that would be orphaned
    if the entity is deleted.

    Args:
        db: Database session
        entity_type: Type of entity being deleted (e.g., 'client', 'supplier')
        entity_id: ID of the entity to check

    Returns:
        Tuple of (can_delete: bool, blocking_entities: List[str])
        - can_delete: True if no blocking dependencies exist
        - blocking_entities: List of strings describing what's blocking
          (e.g., ["3 orders", "2 invoices"])

    Example:
        >>> can_delete, blocking = validate_delete(db, 'client', 123)
        >>> if not can_delete:
        ...     print(f"Cannot delete: {', '.join(blocking)}")
        Cannot delete: 3 orders, 2 invoices
    """
    dependencies = ENTITY_DEPENDENCIES.get(entity_type, [])
    blocking: List[str] = []

    for table_name, fk_column, display_name in dependencies:
        count = _count_dependencies(db, table_name, fk_column, entity_id)
        if count > 0:
            blocking.append(f"{count} {display_name}")

    can_delete = len(blocking) == 0
    return can_delete, blocking


def validate_delete_with_details(
    db: Session,
    entity_type: str,
    entity_id: int
) -> Dict[str, Any]:
    """
    Check if entity can be safely deleted with detailed info.

    Similar to validate_delete but returns more detailed information
    about each dependency.

    Args:
        db: Database session
        entity_type: Type of entity being deleted
        entity_id: ID of the entity to check

    Returns:
        Dictionary with:
        - can_delete: bool
        - total_blocking: int (total number of blocking records)
        - dependencies: List of dicts with table, column, count, display_name

    Example:
        >>> result = validate_delete_with_details(db, 'client', 123)
        >>> print(result)
        {
            'can_delete': False,
            'total_blocking': 5,
            'dependencies': [
                {'table': 'TM_COD_Client_Order', 'column': 'cli_id', 'count': 3, 'display_name': 'orders'},
                {'table': 'TM_CIN_Client_Invoice', 'column': 'cli_id', 'count': 2, 'display_name': 'invoices'}
            ]
        }
    """
    dependencies = ENTITY_DEPENDENCIES.get(entity_type, [])
    blocking_details: List[Dict[str, Any]] = []
    total_blocking = 0

    for table_name, fk_column, display_name in dependencies:
        count = _count_dependencies(db, table_name, fk_column, entity_id)
        if count > 0:
            blocking_details.append({
                'table': table_name,
                'column': fk_column,
                'count': count,
                'display_name': display_name,
            })
            total_blocking += count

    return {
        'can_delete': len(blocking_details) == 0,
        'total_blocking': total_blocking,
        'dependencies': blocking_details,
    }


def get_dependent_ids(
    db: Session,
    table_name: str,
    fk_column: str,
    entity_id: int,
    limit: int = 100
) -> List[int]:
    """
    Get IDs of dependent records.

    Useful for cascading operations or displaying what would be affected.

    Args:
        db: Database session
        table_name: Name of the dependent table
        fk_column: Foreign key column name
        entity_id: ID of the parent entity
        limit: Maximum number of IDs to return (default 100)

    Returns:
        List of dependent record IDs
    """
    # Determine the primary key column (typically table prefix + _id)
    prefix = table_name.split('_')[1].lower()
    pk_column = f"{prefix}_id"

    query = text(f"""
        SELECT TOP :limit {pk_column}
        FROM {table_name}
        WHERE {fk_column} = :entity_id
    """)

    result = db.execute(query, {"entity_id": entity_id, "limit": limit})
    return [row[0] for row in result.fetchall()]


def _count_dependencies(
    db: Session,
    table_name: str,
    fk_column: str,
    entity_id: int
) -> int:
    """
    Count dependent records in a table.

    Internal helper function to count records that reference
    the given entity.

    Args:
        db: Database session
        table_name: Name of the table to check
        fk_column: Foreign key column name
        entity_id: ID of the entity being checked

    Returns:
        Number of dependent records
    """
    try:
        # Use raw SQL to check for dependencies
        # This is safe because table_name and fk_column come from
        # our controlled ENTITY_DEPENDENCIES configuration
        query = text(f"""
            SELECT COUNT(*)
            FROM {table_name}
            WHERE {fk_column} = :entity_id
        """)
        result = db.execute(query, {"entity_id": entity_id})
        count = result.scalar()
        return count or 0
    except Exception:
        # If table doesn't exist or query fails, assume no dependencies
        # This handles cases where optional tables may not exist
        return 0


def get_supported_entity_types() -> List[str]:
    """
    Get list of entity types that support cascade validation.

    Returns:
        List of supported entity type strings
    """
    return list(ENTITY_DEPENDENCIES.keys())


def add_custom_dependency(
    entity_type: str,
    table_name: str,
    fk_column: str,
    display_name: str
) -> None:
    """
    Add a custom dependency check at runtime.

    Useful for extending the default dependency configuration
    without modifying the source code.

    Args:
        entity_type: Type of entity to add dependency for
        table_name: Name of the dependent table
        fk_column: Foreign key column name
        display_name: Human-readable name for the dependency

    Example:
        >>> add_custom_dependency(
        ...     'client',
        ...     'TM_CUSTOM_Table',
        ...     'cli_id',
        ...     'custom records'
        ... )
    """
    if entity_type not in ENTITY_DEPENDENCIES:
        ENTITY_DEPENDENCIES[entity_type] = []

    ENTITY_DEPENDENCIES[entity_type].append(
        (table_name, fk_column, display_name)
    )
