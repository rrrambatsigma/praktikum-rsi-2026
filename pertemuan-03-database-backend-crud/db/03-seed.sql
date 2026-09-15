/* =====================================================================
   03-seed.sql
   Data awal (seed) untuk database review_kantin.
   Idempotent: dilewati bila tabel sudah berisi data.
   Jalankan setelah 02-schema.sql.
   ===================================================================== */

USE review_kantin;
GO

-- ================================================================ USERS
IF NOT EXISTS (SELECT 1 FROM dbo.USERS)
BEGIN
    SET IDENTITY_INSERT dbo.USERS ON;
    INSERT INTO dbo.USERS (id, name, email, password_hash, role) VALUES
        (1, N'Admin Kantin', N'admin@kantin.test',    N'hash_admin',  N'admin'),
        (2, N'Bu Tini',      N'tini@kantin.test',     N'hash_owner1', N'owner'),
        (3, N'Pak Slamet',   N'slamet@kantin.test',   N'hash_owner2', N'owner'),
        (4, N'Makmur',       N'makmur@kantin.test',   N'hash_owner3', N'owner'),
        (5, N'Prayuda',      N'prayuda@student.test', N'hash_cust1',  N'customer'),
        (6, N'Rexy',         N'rexy@student.test',    N'hash_cust2',  N'customer'),
        (7, N'Rambat',       N'rambat@student.test',  N'hash_cust3',  N'customer'),
        (8, N'Trisha',       N'trisha@student.test',  N'hash_cust4',  N'customer');
    SET IDENTITY_INSERT dbo.USERS OFF;
    DBCC CHECKIDENT ('dbo.USERS', RESEED, 8) WITH NO_INFOMSGS;
    PRINT 'Seed USERS selesai.';
END
GO

-- =============================================================== STALLS
IF NOT EXISTS (SELECT 1 FROM dbo.STALLS)
BEGIN
    SET IDENTITY_INSERT dbo.STALLS ON;
    INSERT INTO dbo.STALLS (id, owner_id, name, category, location, description, avg_rating, review_count) VALUES
        (1,  2, N'Kwetiau Goreng',                N'Nasi',    N'Kantin Alif FKIP',   N'Kwetiau goreng spesial',        4.50, 2),
        (2,  2, N'Nasi Goreng Spesial',           N'Nasi',    N'Kantin Alif FKIP',   N'Nasi goreng dengan telur',      4.00, 1),
        (3,  3, N'Bakso Pasca',                   N'Bakso',   N'Kantin Bakso Pasca', N'Bakso urat jumbo',              4.67, 3),
        (4,  3, N'Mie Ayam Pak Slamet',           N'Mie',     N'Kantin Bakso Pasca', N'Mie ayam pangsit',              4.00, 1),
        (5,  4, N'Es Teh Makmur',                 N'Minuman', N'Kantin FK',          N'Aneka es teh',                  4.50, 2),
        (6,  4, N'Jus Buah Segar',                N'Minuman', N'Kantin FK',          N'Jus tanpa gula tambahan',       5.00, 1),
        (7,  2, N'Paket Chicken Steak Hot Plate', N'Western', N'Kantin FK',          N'Steak ayam hot plate',          4.50, 2),
        (8,  3, N'Sate Ayam Madura',              N'Sate',    N'Kantin FEB',         N'Sate ayam bumbu kacang',        4.00, 1),
        (9,  4, N'Soto Ayam Lamongan',            N'Soto',    N'Kantin FEB',         N'Soto ayam kuah bening',         4.50, 2),
        (10, 2, N'Nasi Uduk Betawi',              N'Nasi',    N'Kantin Alif FKIP',   N'Nasi uduk + lauk',              4.00, 1);
    SET IDENTITY_INSERT dbo.STALLS OFF;
    DBCC CHECKIDENT ('dbo.STALLS', RESEED, 10) WITH NO_INFOMSGS;
    PRINT 'Seed STALLS selesai.';
END
GO

-- =========================================================== MENU_ITEMS
IF NOT EXISTS (SELECT 1 FROM dbo.MENU_ITEMS)
BEGIN
    SET IDENTITY_INSERT dbo.MENU_ITEMS ON;
    INSERT INTO dbo.MENU_ITEMS (id, stall_id, name, price, is_available) VALUES
        (1,  1, N'Kwetiau Goreng Spesial', 15000, 1),
        (2,  1, N'Kwetiau Kuah',           13000, 1),
        (3,  2, N'Nasi Goreng Spesial',    14000, 1),
        (4,  2, N'Nasi Goreng Telur',      12000, 1),
        (5,  3, N'Bakso Urat Jumbo',       18000, 1),
        (6,  3, N'Bakso Beranak',          25000, 1),
        (7,  4, N'Mie Ayam Original',      12000, 1),
        (8,  4, N'Mie Ayam Pangsit',       15000, 1),
        (9,  5, N'Es Teh Manis',            4000, 1),
        (10, 5, N'Es Teh Jumbo',            6000, 1),
        (11, 6, N'Jus Alpukat',            12000, 1),
        (12, 6, N'Jus Mangga',             10000, 1),
        (13, 7, N'Chicken Steak Hot Plate',25000, 1),
        (14, 7, N'Chicken Katsu',          22000, 1),
        (15, 8, N'Sate Ayam 10 Tusuk',     20000, 1),
        (16, 8, N'Sate Kambing 10 Tusuk',  30000, 1),
        (17, 9, N'Soto Ayam',              13000, 1),
        (18, 9, N'Soto Ayam + Nasi',       16000, 1),
        (19, 10, N'Nasi Uduk Komplit',     15000, 1),
        (20, 10, N'Nasi Uduk Ayam',        17000, 1);
    SET IDENTITY_INSERT dbo.MENU_ITEMS OFF;
    DBCC CHECKIDENT ('dbo.MENU_ITEMS', RESEED, 20) WITH NO_INFOMSGS;
    PRINT 'Seed MENU_ITEMS selesai.';
END
GO

-- ============================================================== REVIEWS
IF NOT EXISTS (SELECT 1 FROM dbo.REVIEWS)
BEGIN
    SET IDENTITY_INSERT dbo.REVIEWS ON;
    INSERT INTO dbo.REVIEWS (id, stall_id, user_id, rating, comment) VALUES
        (1,  1,  5, 5, N'Enak!'),
        (2,  1,  6, 4, N'Oke'),
        (3,  2,  5, 4, N'Lumayan'),
        (4,  3,  5, 5, N'Baksonya mantap'),
        (5,  3,  6, 5, N'Jumbo!'),
        (6,  3,  7, 4, N'Enak'),
        (7,  4,  6, 4, N'Standar'),
        (8,  5,  7, 5, N'Segar'),
        (9,  5,  8, 4, N'Murah'),
        (10, 6,  8, 5, N'Mantap'),
        (11, 7,  5, 5, N'Porsi besar'),
        (12, 7,  7, 4, N'Oke'),
        (13, 8,  6, 4, N'Enak'),
        (14, 9,  5, 5, N'Kuahnya enak'),
        (15, 9,  8, 4, N'Lumayan'),
        (16, 10, 7, 4, N'Oke');
    SET IDENTITY_INSERT dbo.REVIEWS OFF;
    DBCC CHECKIDENT ('dbo.REVIEWS', RESEED, 16) WITH NO_INFOMSGS;
    PRINT 'Seed REVIEWS selesai.';
END
GO

PRINT 'Seed selesai.';
GO

SELECT 'USERS' AS tabel, COUNT(*) AS jumlah FROM dbo.USERS
UNION ALL SELECT 'STALLS', COUNT(*) FROM dbo.STALLS
UNION ALL SELECT 'MENU_ITEMS', COUNT(*) FROM dbo.MENU_ITEMS
UNION ALL SELECT 'REVIEWS', COUNT(*) FROM dbo.REVIEWS;
GO
