"""
Document Attachment Model - DISABLED.

WARNING: Table TM_DOC_DocumentAttachment does NOT exist in the database (DEV_ERP_ECOLED).

The database has TI_DOC_Document (image/media table) but not TM_DOC_DocumentAttachment.

This model has been converted to a disabled placeholder to prevent SQLAlchemy errors.

To re-enable: Create the database table, then restore the SQLAlchemy model definition.
Original model definition can be found in version control history.

Disabled on: 2026-02-01
Reason: Database alignment - table does not exist in production database
"""


class DocumentAttachment:
    """
    DISABLED: Table TM_DOC_DocumentAttachment does not exist in the database.

    This was a model for linking documents to entities (invoices, quotes, orders).

    Note: The database has TI_DOC_Document for images/media, but not this attachment table.
    """
    __disabled__ = True
    __tablename__ = "TM_DOC_DocumentAttachment"  # For reference only

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "DocumentAttachment model is disabled - table TM_DOC_DocumentAttachment does not exist. "
            "Consider using TI_DOC_Document instead or create the attachment table."
        )
