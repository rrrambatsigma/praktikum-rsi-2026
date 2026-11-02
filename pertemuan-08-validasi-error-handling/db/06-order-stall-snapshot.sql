-- ============================================================
-- Pertemuan 08 - Hands-on 2
-- Snapshot warung pada item pesanan.
--
-- Satu order tetap satu struk, tetapi item perlu menyimpan asal
-- warung agar tiket dapat dipisah per warung dan tetap terbaca
-- walau menu aslinya dihapus.
--
-- Script idempoten: aman dijalankan lebih dari sekali.
-- ============================================================

USE review_kantin;
GO

IF OBJECT_ID('dbo.ORDER_ITEMS', 'U') IS NULL
BEGIN
    THROW 50010, 'Tabel ORDER_ITEMS belum ada. Jalankan db/04-orders-schema.sql lebih dulu.', 1;
END
GO

IF COL_LENGTH('dbo.ORDER_ITEMS', 'stall_id') IS NULL
BEGIN
    ALTER TABLE dbo.ORDER_ITEMS ADD stall_id INT NULL;
    PRINT 'Kolom ORDER_ITEMS.stall_id dibuat.';
END
ELSE
BEGIN
    PRINT 'Kolom ORDER_ITEMS.stall_id sudah ada.';
END
GO

IF COL_LENGTH('dbo.ORDER_ITEMS', 'stall_name') IS NULL
BEGIN
    ALTER TABLE dbo.ORDER_ITEMS ADD stall_name NVARCHAR(100) NULL;
    PRINT 'Kolom ORDER_ITEMS.stall_name dibuat.';
END
ELSE
BEGIN
    PRINT 'Kolom ORDER_ITEMS.stall_name sudah ada.';
END
GO

-- Backfill order lama dari relasi menu -> warung.
UPDATE oi
SET
    stall_id = m.stall_id,
    stall_name = s.name
FROM dbo.ORDER_ITEMS oi
INNER JOIN dbo.MENU_ITEMS m ON m.id = oi.menu_id
INNER JOIN dbo.STALLS s ON s.id = m.stall_id
WHERE oi.stall_id IS NULL
   OR oi.stall_name IS NULL;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_ORDER_ITEMS_stall_id'
      AND object_id = OBJECT_ID(N'dbo.ORDER_ITEMS')
)
BEGIN
    CREATE INDEX IX_ORDER_ITEMS_stall_id ON dbo.ORDER_ITEMS (stall_id);
    PRINT 'Index IX_ORDER_ITEMS_stall_id dibuat.';
END
GO

SELECT
    COUNT(*) AS total_item,
    SUM(CASE WHEN stall_id IS NULL THEN 1 ELSE 0 END) AS item_tanpa_warung
FROM dbo.ORDER_ITEMS;
GO

PRINT 'Snapshot warung pada item pesanan siap.';
GO
