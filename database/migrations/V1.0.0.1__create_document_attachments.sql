IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TM_DOC_DocumentAttachment')
BEGIN
    CREATE TABLE [dbo].[TM_DOC_DocumentAttachment] (
        [doc_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [doc_entity_type] NVARCHAR(50) NOT NULL,
        [doc_entity_id] INT NOT NULL,
        [doc_file_name] NVARCHAR(255) NOT NULL,
        [doc_file_path] NVARCHAR(2000) NOT NULL,
        [doc_file_size] INT NULL,
        [doc_file_type] NVARCHAR(255) NULL,
        [doc_description] NVARCHAR(1000) NULL,
        [usr_id] INT NULL,
        [doc_uploaded_at] DATETIME NOT NULL CONSTRAINT [DF_TM_DOC_DocumentAttachment_UploadedAt] DEFAULT (GETDATE())
    );

    CREATE INDEX [IX_TM_DOC_DocumentAttachment_Entity]
        ON [dbo].[TM_DOC_DocumentAttachment] ([doc_entity_type], [doc_entity_id]);

    ALTER TABLE [dbo].[TM_DOC_DocumentAttachment]
        ADD CONSTRAINT [FK_TM_DOC_DocumentAttachment_User]
        FOREIGN KEY ([usr_id]) REFERENCES [dbo].[TM_USR_User]([usr_id]);
END
