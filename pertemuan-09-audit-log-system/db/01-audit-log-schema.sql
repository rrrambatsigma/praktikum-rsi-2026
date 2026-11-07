-- ============================================================
-- Pertemuan 09 - Hands-on 1
-- Skema dan index untuk riwayat audit.
--
-- Tabel dbo.AUDIT_LOGS sudah dibuat oleh Pertemuan 03. Script ini
-- idempoten: aman dijalankan berulang dan tidak menghapus data.
-- Index mempercepat halaman riwayat yang selalu diurutkan terbaru
-- lebih dulu dan sering difilter berdasarkan aksi/tanggal.
-- ============================================================

USE review_kantin;
GO

SET XACT_ABORT ON;
GO

IF OBJECT_ID('dbo.AUDIT_LOGS', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AUDIT_LOGS (
        id           INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_AUDIT_LOGS PRIMARY KEY,
        user_id      INT NOT NULL,
        action       NVARCHAR(50) NOT NULL,
        target_table NVARCHAR(50) NOT NULL,
        target_id    INT NOT NULL,
        metadata     NVARCHAR(MAX) NULL,
        created_at   DATETIME2(0) NOT NULL CONSTRAINT DF_AUDIT_LOGS_created_at DEFAULT SYSDATETIME(),
        CONSTRAINT FK_AUDIT_LOGS_USERS FOREIGN KEY (user_id)
            REFERENCES dbo.USERS (id)
    );
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_AUDIT_LOGS_created_at'
      AND object_id = OBJECT_ID(N'dbo.AUDIT_LOGS')
)
BEGIN
    CREATE INDEX IX_AUDIT_LOGS_created_at
        ON dbo.AUDIT_LOGS (created_at DESC, id DESC);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_AUDIT_LOGS_user_created'
      AND object_id = OBJECT_ID(N'dbo.AUDIT_LOGS')
)
BEGIN
    CREATE INDEX IX_AUDIT_LOGS_user_created
        ON dbo.AUDIT_LOGS (user_id, created_at DESC);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_AUDIT_LOGS_action_target_created'
      AND object_id = OBJECT_ID(N'dbo.AUDIT_LOGS')
)
BEGIN
    CREATE INDEX IX_AUDIT_LOGS_action_target_created
        ON dbo.AUDIT_LOGS (action, target_table, created_at DESC);
END
GO

SELECT name AS index_name
FROM sys.indexes
WHERE object_id = OBJECT_ID(N'dbo.AUDIT_LOGS')
  AND name LIKE N'IX_AUDIT_LOGS%'
ORDER BY name;
GO

PRINT 'Skema dan index audit siap.';
GO
