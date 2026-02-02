"""
Drive Module Models - DISABLED.

WARNING: Tables TM_DRV_File and TM_DRV_Folder do NOT exist in the database (DEV_ERP_ECOLED).

These models have been converted to disabled placeholders to prevent SQLAlchemy errors.

To re-enable: Create the database tables, then restore the SQLAlchemy model definitions.
Original model definitions can be found in version control history.

Disabled on: 2026-02-01
Reason: Database alignment - tables do not exist in production database
"""


class DriveFile:
    """
    DISABLED: Table TM_DRV_File does not exist in the database.

    This was a model for storing file metadata and associations.
    """
    __disabled__ = True
    __tablename__ = "TM_DRV_File"  # For reference only

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "DriveFile model is disabled - table TM_DRV_File does not exist. "
            "Create the Drive module tables first."
        )


class DriveFolder:
    """
    DISABLED: Table TM_DRV_Folder does not exist in the database.

    This was a model for organizing files into folders.
    """
    __disabled__ = True
    __tablename__ = "TM_DRV_Folder"  # For reference only

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "DriveFolder model is disabled - table TM_DRV_Folder does not exist. "
            "Create the Drive module tables first."
        )
