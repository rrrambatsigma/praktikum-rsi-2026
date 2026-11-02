-- ============================================================
-- Pertemuan 08 - Hands-on 1
-- Migrasi aditif untuk mendukung kategori dan deskripsi menu.
--
-- Jalankan setelah schema Pertemuan 03 sudah ada.
-- Script ini idempoten: aman dijalankan lebih dari sekali.
-- ============================================================

USE review_kantin;
GO

IF OBJECT_ID('dbo.MENU_ITEMS', 'U') IS NULL
BEGIN
    THROW 50001, 'Tabel dbo.MENU_ITEMS belum ada. Jalankan schema Pertemuan 03 terlebih dahulu.', 1;
END
GO

-- ---------------------------------------------------------------- CATEGORY
IF COL_LENGTH('dbo.MENU_ITEMS', 'category') IS NULL
BEGIN
    ALTER TABLE dbo.MENU_ITEMS
    ADD category NVARCHAR(20) NULL;

    PRINT 'Kolom category ditambahkan.';
END
ELSE
BEGIN
    PRINT 'Kolom category sudah ada.';
END
GO

-- ------------------------------------------------------------- DESCRIPTION
IF COL_LENGTH('dbo.MENU_ITEMS', 'description') IS NULL
BEGIN
    ALTER TABLE dbo.MENU_ITEMS
    ADD description NVARCHAR(255) NULL;

    PRINT 'Kolom description ditambahkan.';
END
ELSE
BEGIN
    PRINT 'Kolom description sudah ada.';
END
GO

-- ---------------------------------------------------------------- CHECK
-- NULL tetap diizinkan agar kode Pertemuan 02-07 yang belum mengirim
-- category tidak langsung rusak. Hands-on 08 selalu mengisi category.
IF OBJECT_ID('dbo.CK_MENU_ITEMS_category', 'C') IS NULL
BEGIN
    ALTER TABLE dbo.MENU_ITEMS
    ADD CONSTRAINT CK_MENU_ITEMS_category
    CHECK (category IN (N'makanan', N'minuman', N'camilan') OR category IS NULL);

    PRINT 'Constraint CK_MENU_ITEMS_category ditambahkan.';
END
ELSE
BEGIN
    PRINT 'Constraint CK_MENU_ITEMS_category sudah ada.';
END
GO

PRINT 'Schema Pertemuan 08 Hands-on 1 selesai.';
GO
