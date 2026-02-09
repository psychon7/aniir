-- ============================================================================
-- MIGRATION V1.0.0.10: Create Task Table for Calendar/Tasks Feature
-- ============================================================================
-- Description:
--   - Create TM_TSK_Task table for calendar events, tasks, meetings,
--     reminders, deadlines linked to business entities
--   - Add CHECK constraints for type, priority, status enums
--   - Add FK constraints to users, clients, suppliers, projects, etc.
--   - Add performance indexes for common query patterns
-- Date: 2026-02-09
-- ============================================================================

-- ==========================================================================
-- 1) Create TM_TSK_Task table
-- ==========================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TM_TSK_Task')
BEGIN
    CREATE TABLE [dbo].[TM_TSK_Task] (
        [tsk_id]            INT IDENTITY(1,1) NOT NULL,
        [tsk_ref]           NVARCHAR(50)      NULL,
        [tsk_title]         NVARCHAR(500)     NOT NULL,
        [tsk_description]   NTEXT             NULL,
        [tsk_type]          NVARCHAR(50)      NOT NULL DEFAULT 'task',
        [tsk_priority]      NVARCHAR(20)      NULL     DEFAULT 'medium',
        [tsk_status]        NVARCHAR(20)      NOT NULL DEFAULT 'pending',
        [tsk_d_start]       DATETIME          NULL,
        [tsk_d_end]         DATETIME          NULL,
        [tsk_d_due]         DATETIME          NULL,
        [tsk_is_all_day]    BIT               NOT NULL DEFAULT 0,
        [usr_id]            INT               NULL,
        [usr_creator_id]    INT               NOT NULL,
        [cli_id]            INT               NULL,
        [sup_id]            INT               NULL,
        [prj_id]            INT               NULL,
        [cpl_id]            INT               NULL,
        [cod_id]            INT               NULL,
        [cin_id]            INT               NULL,
        [soc_id]            INT               NOT NULL,
        [tsk_d_creation]    DATETIME          NOT NULL DEFAULT GETDATE(),
        [tsk_d_update]      DATETIME          NOT NULL DEFAULT GETDATE(),
        [tsk_completed_at]  DATETIME          NULL,
        [tsk_isactive]      BIT               NOT NULL DEFAULT 1,
        [tsk_notes]         NTEXT             NULL,
        [tsk_location]      NVARCHAR(500)     NULL,
        [tsk_color]         NVARCHAR(20)      NULL,

        CONSTRAINT [PK_TM_TSK_Task] PRIMARY KEY CLUSTERED ([tsk_id]),

        -- Type enum
        CONSTRAINT [CK_TSK_type] CHECK ([tsk_type] IN (
            'task', 'meeting', 'call', 'reminder', 'deadline', 'event'
        )),

        -- Priority enum
        CONSTRAINT [CK_TSK_priority] CHECK ([tsk_priority] IS NULL OR [tsk_priority] IN (
            'low', 'medium', 'high', 'urgent'
        )),

        -- Status enum
        CONSTRAINT [CK_TSK_status] CHECK ([tsk_status] IN (
            'pending', 'in_progress', 'completed', 'canceled'
        ))
    );
    PRINT 'Created table TM_TSK_Task';
END
ELSE
BEGIN
    PRINT 'Table TM_TSK_Task already exists - skipping';
END
GO

-- ==========================================================================
-- 2) Foreign key constraints
-- ==========================================================================

-- FK: assigned user
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_TSK_usr_id')
BEGIN
    ALTER TABLE [dbo].[TM_TSK_Task]
        ADD CONSTRAINT [FK_TSK_usr_id]
        FOREIGN KEY ([usr_id]) REFERENCES [dbo].[TM_USR_User]([usr_id]);
    PRINT 'Added FK_TSK_usr_id';
END
GO

-- FK: creator user
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_TSK_usr_creator_id')
BEGIN
    ALTER TABLE [dbo].[TM_TSK_Task]
        ADD CONSTRAINT [FK_TSK_usr_creator_id]
        FOREIGN KEY ([usr_creator_id]) REFERENCES [dbo].[TM_USR_User]([usr_id]);
    PRINT 'Added FK_TSK_usr_creator_id';
END
GO

-- FK: client
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_TSK_cli_id')
BEGIN
    ALTER TABLE [dbo].[TM_TSK_Task]
        ADD CONSTRAINT [FK_TSK_cli_id]
        FOREIGN KEY ([cli_id]) REFERENCES [dbo].[TM_CLI_CLient]([cli_id]);
    PRINT 'Added FK_TSK_cli_id';
END
GO

-- FK: supplier
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_TSK_sup_id')
BEGIN
    ALTER TABLE [dbo].[TM_TSK_Task]
        ADD CONSTRAINT [FK_TSK_sup_id]
        FOREIGN KEY ([sup_id]) REFERENCES [dbo].[TM_SUP_Supplier]([sup_id]);
    PRINT 'Added FK_TSK_sup_id';
END
GO

-- FK: project
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_TSK_prj_id')
BEGIN
    ALTER TABLE [dbo].[TM_TSK_Task]
        ADD CONSTRAINT [FK_TSK_prj_id]
        FOREIGN KEY ([prj_id]) REFERENCES [dbo].[TM_PRJ_Project]([prj_id]);
    PRINT 'Added FK_TSK_prj_id';
END
GO

-- FK: quote (cost plan)
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_TSK_cpl_id')
BEGIN
    ALTER TABLE [dbo].[TM_TSK_Task]
        ADD CONSTRAINT [FK_TSK_cpl_id]
        FOREIGN KEY ([cpl_id]) REFERENCES [dbo].[TM_CPL_Cost_Plan]([cpl_id]);
    PRINT 'Added FK_TSK_cpl_id';
END
GO

-- FK: order
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_TSK_cod_id')
BEGIN
    ALTER TABLE [dbo].[TM_TSK_Task]
        ADD CONSTRAINT [FK_TSK_cod_id]
        FOREIGN KEY ([cod_id]) REFERENCES [dbo].[TM_COD_Client_Order]([cod_id]);
    PRINT 'Added FK_TSK_cod_id';
END
GO

-- FK: invoice
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_TSK_cin_id')
BEGIN
    ALTER TABLE [dbo].[TM_TSK_Task]
        ADD CONSTRAINT [FK_TSK_cin_id]
        FOREIGN KEY ([cin_id]) REFERENCES [dbo].[TM_CIN_Client_Invoice]([cin_id]);
    PRINT 'Added FK_TSK_cin_id';
END
GO

-- FK: society
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_TSK_soc_id')
BEGIN
    ALTER TABLE [dbo].[TM_TSK_Task]
        ADD CONSTRAINT [FK_TSK_soc_id]
        FOREIGN KEY ([soc_id]) REFERENCES [dbo].[TR_SOC_Society]([soc_id]);
    PRINT 'Added FK_TSK_soc_id';
END
GO

-- ==========================================================================
-- 3) Indexes for common query patterns
-- ==========================================================================

-- Date range queries (calendar view)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TSK_date_range')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TSK_date_range]
        ON [dbo].[TM_TSK_Task] ([tsk_d_start], [tsk_d_end])
        INCLUDE ([tsk_title], [tsk_type], [tsk_status], [tsk_is_all_day], [tsk_color]);
    PRINT 'Created IX_TSK_date_range';
END
GO

-- Due date + status (overdue queries)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TSK_due_status')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TSK_due_status]
        ON [dbo].[TM_TSK_Task] ([tsk_d_due], [tsk_status])
        WHERE [tsk_isactive] = 1;
    PRINT 'Created IX_TSK_due_status';
END
GO

-- User + status (my tasks)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TSK_user_status')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TSK_user_status]
        ON [dbo].[TM_TSK_Task] ([usr_id], [tsk_status])
        WHERE [tsk_isactive] = 1;
    PRINT 'Created IX_TSK_user_status';
END
GO

-- Society + status (company-wide views)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TSK_society_status')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TSK_society_status]
        ON [dbo].[TM_TSK_Task] ([soc_id], [tsk_status])
        WHERE [tsk_isactive] = 1;
    PRINT 'Created IX_TSK_society_status';
END
GO

-- Client tasks
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TSK_client')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TSK_client]
        ON [dbo].[TM_TSK_Task] ([cli_id])
        WHERE [cli_id] IS NOT NULL AND [tsk_isactive] = 1;
    PRINT 'Created IX_TSK_client';
END
GO

-- Project tasks
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TSK_project')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TSK_project]
        ON [dbo].[TM_TSK_Task] ([prj_id])
        WHERE [prj_id] IS NOT NULL AND [tsk_isactive] = 1;
    PRINT 'Created IX_TSK_project';
END
GO

-- ==========================================================================
-- 4) Record migration
-- ==========================================================================
IF NOT EXISTS (SELECT 1 FROM [dbo].[_MigrationHistory] WHERE [version] = 'V1.0.0.10')
BEGIN
    INSERT INTO [dbo].[_MigrationHistory] ([version], [description], [filename], [execution_time_ms], [success])
    VALUES ('V1.0.0.10', 'Create TM_TSK_Task table for calendar/tasks feature', 'V1.0.0.10__create_task_table.sql', 0, 1);
    PRINT 'Recorded migration V1.0.0.10';
END
GO

PRINT '=== Migration V1.0.0.10 complete ===';
GO
