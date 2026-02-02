-- =============================================
-- Payment Allocation Table and Invoice Payment Tracking
-- Version: 1.0.0.4
-- Description: Creates TM_PAY_Allocation table for tracking 
--              payment allocations to invoices and adds 
--              payment tracking columns to invoice table
-- =============================================

USE [ERP2025]
GO

PRINT 'Starting Payment Allocation schema creation...'
GO

-- =============================================
-- PART 1: Add Payment Tracking Columns to Invoice Table
-- =============================================

-- Add AmountPaid column to track total payments received
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('TM_INV_ClientInvoice') 
    AND name = 'inv_amount_paid'
)
BEGIN
    ALTER TABLE TM_INV_ClientInvoice
    ADD inv_amount_paid DECIMAL(18,4) NOT NULL DEFAULT 0
    
    PRINT 'Added inv_amount_paid column to TM_INV_ClientInvoice'
END
ELSE
BEGIN
    PRINT 'Column inv_amount_paid already exists in TM_INV_ClientInvoice'
END
GO

-- Add AmountDue column (computed or stored for performance)
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('TM_INV_ClientInvoice') 
    AND name = 'inv_amount_due'
)
BEGIN
    ALTER TABLE TM_INV_ClientInvoice
    ADD inv_amount_due AS (inv_total_ttc - inv_amount_paid) PERSISTED
    
    PRINT 'Added inv_amount_due computed column to TM_INV_ClientInvoice'
END
ELSE
BEGIN
    PRINT 'Column inv_amount_due already exists in TM_INV_ClientInvoice'
END
GO

-- Add PaymentStatus column (UNPAID, PARTIAL, PAID, OVERPAID)
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('TM_INV_ClientInvoice') 
    AND name = 'inv_payment_status'
)
BEGIN
    ALTER TABLE TM_INV_ClientInvoice
    ADD inv_payment_status NVARCHAR(20) NOT NULL DEFAULT 'UNPAID'
    
    PRINT 'Added inv_payment_status column to TM_INV_ClientInvoice'
END
ELSE
BEGIN
    PRINT 'Column inv_payment_status already exists in TM_INV_ClientInvoice'
END
GO

-- Add LastPaymentDate column
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('TM_INV_ClientInvoice') 
    AND name = 'inv_last_payment_date'
)
BEGIN
    ALTER TABLE TM_INV_ClientInvoice
    ADD inv_last_payment_date DATETIME NULL
    
    PRINT 'Added inv_last_payment_date column to TM_INV_ClientInvoice'
END
ELSE
BEGIN
    PRINT 'Column inv_last_payment_date already exists in TM_INV_ClientInvoice'
END
GO

-- Add check constraint for payment status values
IF NOT EXISTS (
    SELECT * FROM sys.check_constraints 
    WHERE name = 'CK_INV_PaymentStatus'
)
BEGIN
    ALTER TABLE TM_INV_ClientInvoice
    ADD CONSTRAINT CK_INV_PaymentStatus 
    CHECK (inv_payment_status IN ('UNPAID', 'PARTIAL', 'PAID', 'OVERPAID'))
    
    PRINT 'Added CK_INV_PaymentStatus constraint'
END
GO

-- =============================================
-- PART 2: Create Payment Allocation Table
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TM_PAY_Allocation')
BEGIN
    CREATE TABLE TM_PAY_Allocation (
        -- Primary Key
        pal_id INT PRIMARY KEY IDENTITY(1,1),
        
        -- Reference (auto-generated: PAL-0001, PAL-0002, etc.)
        pal_reference NVARCHAR(20) NOT NULL,
        
        -- Link to Payment
        pal_payment_id INT NOT NULL,
        
        -- Link to Invoice
        pal_invoice_id INT NOT NULL,
        
        -- Allocation Details
        pal_amount DECIMAL(18,4) NOT NULL,
        pal_allocation_date DATETIME NOT NULL DEFAULT GETDATE(),
        
        -- Optional notes
        pal_notes NVARCHAR(500) NULL,
        
        -- Audit Fields
        pal_created_at DATETIME NOT NULL DEFAULT GETDATE(),
        pal_created_by INT NULL,
        pal_updated_at DATETIME NULL,
        pal_updated_by INT NULL,
        
        -- Soft Delete
        pal_is_deleted BIT NOT NULL DEFAULT 0,
        pal_deleted_at DATETIME NULL,
        pal_deleted_by INT NULL,
        
        -- Foreign Keys
        CONSTRAINT FK_PAY_Allocation_Payment 
            FOREIGN KEY (pal_payment_id) 
            REFERENCES TM_PAY_ClientPayment(pay_id),
        
        CONSTRAINT FK_PAY_Allocation_Invoice 
            FOREIGN KEY (pal_invoice_id) 
            REFERENCES TM_INV_ClientInvoice(inv_id),
        
        -- Ensure positive allocation amount
        CONSTRAINT CK_PAY_Allocation_Amount 
            CHECK (pal_amount > 0)
    )
    
    PRINT 'Created TM_PAY_Allocation table'
END
ELSE
BEGIN
    PRINT 'Table TM_PAY_Allocation already exists'
END
GO

-- =============================================
-- PART 3: Create Indexes
-- =============================================

-- Unique index on reference
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'UX_PAY_Allocation_Reference' 
    AND object_id = OBJECT_ID('TM_PAY_Allocation')
)
BEGIN
    CREATE UNIQUE INDEX UX_PAY_Allocation_Reference 
    ON TM_PAY_Allocation(pal_reference)
    WHERE pal_is_deleted = 0
    
    PRINT 'Created UX_PAY_Allocation_Reference index'
END
GO

-- Index on payment_id for fast lookup
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'IX_PAY_Allocation_PaymentId' 
    AND object_id = OBJECT_ID('TM_PAY_Allocation')
)
BEGIN
    CREATE INDEX IX_PAY_Allocation_PaymentId 
    ON TM_PAY_Allocation(pal_payment_id)
    WHERE pal_is_deleted = 0
    
    PRINT 'Created IX_PAY_Allocation_PaymentId index'
END
GO

-- Index on invoice_id for fast lookup
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'IX_PAY_Allocation_InvoiceId' 
    AND object_id = OBJECT_ID('TM_PAY_Allocation')
)
BEGIN
    CREATE INDEX IX_PAY_Allocation_InvoiceId 
    ON TM_PAY_Allocation(pal_invoice_id)
    WHERE pal_is_deleted = 0
    
    PRINT 'Created IX_PAY_Allocation_InvoiceId index'
END
GO

-- Composite index for payment + invoice (prevent duplicate allocations)
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'IX_PAY_Allocation_Payment_Invoice' 
    AND object_id = OBJECT_ID('TM_PAY_Allocation')
)
BEGIN
    CREATE INDEX IX_PAY_Allocation_Payment_Invoice 
    ON TM_PAY_Allocation(pal_payment_id, pal_invoice_id)
    WHERE pal_is_deleted = 0
    
    PRINT 'Created IX_PAY_Allocation_Payment_Invoice index'
END
GO

-- Index on allocation date for reporting
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'IX_PAY_Allocation_Date' 
    AND object_id = OBJECT_ID('TM_PAY_Allocation')
)
BEGIN
    CREATE INDEX IX_PAY_Allocation_Date 
    ON TM_PAY_Allocation(pal_allocation_date)
    WHERE pal_is_deleted = 0
    
    PRINT 'Created IX_PAY_Allocation_Date index'
END
GO

-- Index on invoice payment status for filtering
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'IX_INV_ClientInvoice_PaymentStatus' 
    AND object_id = OBJECT_ID('TM_INV_ClientInvoice')
)
BEGIN
    CREATE INDEX IX_INV_ClientInvoice_PaymentStatus 
    ON TM_INV_ClientInvoice(inv_payment_status)
    
    PRINT 'Created IX_INV_ClientInvoice_PaymentStatus index'
END
GO

-- =============================================
-- PART 4: Create Trigger to Update Invoice Payment Status
-- =============================================

IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_PAY_Allocation_UpdateInvoice')
BEGIN
    DROP TRIGGER TR_PAY_Allocation_UpdateInvoice
    PRINT 'Dropped existing TR_PAY_Allocation_UpdateInvoice trigger'
END
GO

CREATE TRIGGER TR_PAY_Allocation_UpdateInvoice
ON TM_PAY_Allocation
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get affected invoice IDs from both inserted and deleted
    DECLARE @AffectedInvoices TABLE (InvoiceId INT)
    
    INSERT INTO @AffectedInvoices (InvoiceId)
    SELECT DISTINCT pal_invoice_id FROM inserted
    UNION
    SELECT DISTINCT pal_invoice_id FROM deleted
    
    -- Update each affected invoice
    UPDATE inv
    SET 
        inv_amount_paid = ISNULL((
            SELECT SUM(pal_amount) 
            FROM TM_PAY_Allocation 
            WHERE pal_invoice_id = inv.inv_id 
            AND pal_is_deleted = 0
        ), 0),
        inv_last_payment_date = (
            SELECT MAX(pal_allocation_date) 
            FROM TM_PAY_Allocation 
            WHERE pal_invoice_id = inv.inv_id 
            AND pal_is_deleted = 0
        ),
        inv_payment_status = CASE
            WHEN ISNULL((
                SELECT SUM(pal_amount) 
                FROM TM_PAY_Allocation 
                WHERE pal_invoice_id = inv.inv_id 
                AND pal_is_deleted = 0
            ), 0) = 0 THEN 'UNPAID'
            WHEN ISNULL((
                SELECT SUM(pal_amount) 
                FROM TM_PAY_Allocation 
                WHERE pal_invoice_id = inv.inv_id 
                AND pal_is_deleted = 0
            ), 0) < inv.inv_total_ttc THEN 'PARTIAL'
            WHEN ISNULL((
                SELECT SUM(pal_amount) 
                FROM TM_PAY_Allocation 
                WHERE pal_invoice_id = inv.inv_id 
                AND pal_is_deleted = 0
            ), 0) = inv.inv_total_ttc THEN 'PAID'
            ELSE 'OVERPAID'
        END
    FROM TM_INV_ClientInvoice inv
    WHERE inv.inv_id IN (SELECT InvoiceId FROM @AffectedInvoices)
END
GO

PRINT 'Created TR_PAY_Allocation_UpdateInvoice trigger'
GO

-- =============================================
-- PART 5: Create Helper View for Payment Allocations
-- =============================================

IF EXISTS (SELECT * FROM sys.views WHERE name = 'VW_PAY_AllocationDetails')
BEGIN
    DROP VIEW VW_PAY_AllocationDetails
    PRINT 'Dropped existing VW_PAY_AllocationDetails view'
END
GO

CREATE VIEW VW_PAY_AllocationDetails
AS
SELECT 
    pal.pal_id,
    pal.pal_reference,
    pal.pal_payment_id,
    pay.pay_reference AS payment_reference,
    pay.pay_amount AS payment_total_amount,
    pal.pal_invoice_id,
    inv.inv_reference AS invoice_reference,
    inv.inv_total_ttc AS invoice_total,
    inv.inv_amount_paid AS invoice_amount_paid,
    inv.inv_amount_due AS invoice_amount_due,
    inv.inv_payment_status AS invoice_payment_status,
    pal.pal_amount AS allocation_amount,
    pal.pal_allocation_date,
    pal.pal_notes,
    cli.cli_id AS client_id,
    cli.cli_name AS client_name,
    cli.cli_reference AS client_reference,
    pal.pal_created_at,
    pal.pal_created_by
FROM TM_PAY_Allocation pal
INNER JOIN TM_PAY_ClientPayment pay ON pal.pal_payment_id = pay.pay_id
INNER JOIN TM_INV_ClientInvoice inv ON pal.pal_invoice_id = inv.inv_id
INNER JOIN TM_CLI_Client cli ON pay.pay_client_id = cli.cli_id
WHERE pal.pal_is_deleted = 0
GO

PRINT 'Created VW_PAY_AllocationDetails view'
GO

-- =============================================
-- PART 6: Create Stored Procedure for Reference Generation
-- =============================================

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'SP_PAY_GenerateAllocationReference')
BEGIN
    DROP PROCEDURE SP_PAY_GenerateAllocationReference
    PRINT 'Dropped existing SP_PAY_GenerateAllocationReference procedure'
END
GO

CREATE PROCEDURE SP_PAY_GenerateAllocationReference
    @Reference NVARCHAR(20) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @LastNum INT = 0
    DECLARE @LastRef NVARCHAR(20)
    
    -- Get the last reference
    SELECT TOP 1 @LastRef = pal_reference
    FROM TM_PAY_Allocation
    ORDER BY pal_id DESC
    
    -- Extract number and increment
    IF @LastRef IS NOT NULL
    BEGIN
        SET @LastNum = CAST(SUBSTRING(@LastRef, 5, LEN(@LastRef) - 4) AS INT)
    END
    
    SET @Reference = 'PAL-' + RIGHT('0000' + CAST(@LastNum + 1 AS NVARCHAR), 4)
END
GO

PRINT 'Created SP_PAY_GenerateAllocationReference procedure'
GO

-- =============================================
-- PART 7: Create Stored Procedure for Allocating Payment
-- =============================================

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'SP_PAY_AllocatePayment')
BEGIN
    DROP PROCEDURE SP_PAY_AllocatePayment
    PRINT 'Dropped existing SP_PAY_AllocatePayment procedure'
END
GO

CREATE PROCEDURE SP_PAY_AllocatePayment
    @PaymentId INT,
    @InvoiceId INT,
    @Amount DECIMAL(18,4),
    @Notes NVARCHAR(500) = NULL,
    @CreatedBy INT = NULL,
    @AllocationId INT OUTPUT,
    @ErrorMessage NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION
        
        -- Validate payment exists and has unallocated amount
        DECLARE @PaymentAmount DECIMAL(18,4)
        DECLARE @AllocatedAmount DECIMAL(18,4)
        DECLARE @PaymentClientId INT
        
        SELECT 
            @PaymentAmount = pay_amount,
            @PaymentClientId = pay_client_id
        FROM TM_PAY_ClientPayment
        WHERE pay_id = @PaymentId
        
        IF @PaymentAmount IS NULL
        BEGIN
            SET @ErrorMessage = 'Payment not found'
            ROLLBACK TRANSACTION
            RETURN -1
        END
        
        SELECT @AllocatedAmount = ISNULL(SUM(pal_amount), 0)
        FROM TM_PAY_Allocation
        WHERE pal_payment_id = @PaymentId
        AND pal_is_deleted = 0
        
        IF (@AllocatedAmount + @Amount) > @PaymentAmount
        BEGIN
            SET @ErrorMessage = 'Allocation amount exceeds unallocated payment amount'
            ROLLBACK TRANSACTION
            RETURN -2
        END
        
        -- Validate invoice exists and belongs to same client
        DECLARE @InvoiceClientId INT
        DECLARE @InvoiceAmountDue DECIMAL(18,4)
        
        SELECT 
            @InvoiceClientId = inv_client_id,
            @InvoiceAmountDue = inv_amount_due
        FROM TM_INV_ClientInvoice
        WHERE inv_id = @InvoiceId
        
        IF @InvoiceClientId IS NULL
        BEGIN
            SET @ErrorMessage = 'Invoice not found'
            ROLLBACK TRANSACTION
            RETURN -3
        END
        
        IF @InvoiceClientId <> @PaymentClientId
        BEGIN
            SET @ErrorMessage = 'Invoice does not belong to the same client as the payment'
            ROLLBACK TRANSACTION
            RETURN -4
        END
        
        -- Generate reference
        DECLARE @Reference NVARCHAR(20)
        EXEC SP_PAY_GenerateAllocationReference @Reference OUTPUT
        
        -- Insert allocation
        INSERT INTO TM_PAY_Allocation (
            pal_reference,
            pal_payment_id,
            pal_invoice_id,
            pal_amount,
            pal_allocation_date,
            pal_notes,
            pal_created_by
        )
        VALUES (
            @Reference,
            @PaymentId,
            @InvoiceId,
            @Amount,
            GETDATE(),
            @Notes,
            @CreatedBy
        )
        
        SET @AllocationId = SCOPE_IDENTITY()
        SET @ErrorMessage = NULL
        
        COMMIT TRANSACTION
        RETURN 0
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION
            
        SET @ErrorMessage = ERROR_MESSAGE()
        SET @AllocationId = NULL
        RETURN -99
    END CATCH
END
GO

PRINT 'Created SP_PAY_AllocatePayment procedure'
GO

-- =============================================
-- PART 8: Update Existing Invoices (Set Default Values)
-- =============================================

-- Update any existing invoices that don't have payment tracking values
UPDATE TM_INV_ClientInvoice
SET inv_payment_status = 'UNPAID'
WHERE inv_payment_status IS NULL
GO

PRINT 'Updated existing invoices with default payment status'
GO

-- =============================================
-- Completion Message
-- =============================================

PRINT ''
PRINT '============================================='
PRINT 'Payment Allocation schema creation completed!'
PRINT '============================================='
PRINT 'Created/Modified:'
PRINT '  - TM_INV_ClientInvoice: Added payment tracking columns'
PRINT '  - TM_PAY_Allocation: New table for payment allocations'
PRINT '  - Indexes for performance optimization'
PRINT '  - TR_PAY_Allocation_UpdateInvoice: Auto-update trigger'
PRINT '  - VW_PAY_AllocationDetails: Helper view'
PRINT '  - SP_PAY_GenerateAllocationReference: Reference generator'
PRINT '  - SP_PAY_AllocatePayment: Allocation procedure'
PRINT '============================================='
GO
