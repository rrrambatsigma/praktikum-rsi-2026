-- ============================================================
-- Pertemuan 08 - Hands-on 1
-- Seed kategori dan contoh menu camilan.
--
-- Jalankan setelah 01-menu-schema.sql.
-- Script ini idempoten: aman dijalankan lebih dari sekali.
-- ============================================================

USE review_kantin;
GO

-- ------------------------------------------------- BACKFILL KATEGORI LAMA
UPDATE m
SET m.category =
    CASE
        WHEN s.category = N'Minuman' THEN N'minuman'
        ELSE N'makanan'
    END
FROM dbo.MENU_ITEMS m
INNER JOIN dbo.STALLS s ON s.id = m.stall_id
WHERE m.category IS NULL;
GO

DECLARE @missing_category INT = (
    SELECT COUNT(*) FROM dbo.MENU_ITEMS WHERE category IS NULL
);
PRINT CONCAT('Menu dengan kategori kosong setelah backfill: ', @missing_category);
GO

-- ------------------------------------------------------ WARUNG CAMILAN
-- Satu warung khusus camilan supaya contoh data masuk akal.
-- Pemiliknya harus eksplisit Bu Tini, bukan "owner pertama" yang kebetulan
-- punya id terkecil. Kalau tidak, uji RBAC bisa memakai warung milik orang lain.
IF NOT EXISTS (SELECT 1 FROM dbo.STALLS WHERE name = N'Gorengan Bu Tini')
BEGIN
    INSERT INTO dbo.STALLS (owner_id, name, category, location, description)
    SELECT
        id,
        N'Gorengan Bu Tini',
        N'Camilan',
        N'Kantin FK',
        N'Gorengan dan camilan rumahan.'
    FROM dbo.USERS
    WHERE email = N'tini@kantin.test'
      AND role = N'owner';
END
GO

-- Perbaiki data lama bila seed versi sebelumnya menempelkan warung ini
-- ke owner yang salah.
UPDATE s
SET s.owner_id = u.id
FROM dbo.STALLS s
CROSS JOIN dbo.USERS u
WHERE s.name = N'Gorengan Bu Tini'
  AND u.email = N'tini@kantin.test'
  AND u.role = N'owner'
  AND s.owner_id <> u.id;
GO

-- ------------------------------------------------------ CONTOH CAMILAN
-- Tambah menu camilan hanya jika nama dan warungnya belum ada.
DECLARE @camilan_stall INT = (
    SELECT id FROM dbo.STALLS WHERE name = N'Gorengan Bu Tini'
);

INSERT INTO dbo.MENU_ITEMS (stall_id, name, category, price, description, is_available)
SELECT @camilan_stall, v.name, v.category, v.price, v.description, v.is_available
FROM (VALUES
    (N'Pisang Goreng',       N'camilan', 5000, N'Pisang goreng hangat dengan topping gula halus.', 1),
    (N'Risoles Mayo',        N'camilan', 6000, N'Risoles isi ayam dan sayur dengan saus mayo.',    1),
    (N'Tahu Bakso',          N'camilan', 7000, N'Tahu bakso gurih, cocok untuk camilan sore.',     1),
    (N'Cireng Bumbu Rujak',  N'camilan', 5000, N'Cireng renyah dengan bumbu rujak. Sedang habis.', 0)
) AS v (name, category, price, description, is_available)
WHERE @camilan_stall IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM dbo.MENU_ITEMS m
    WHERE m.name = v.name
);
GO

-- Rapikan bila seed versi sebelumnya menaruh camilan di warung lain.
DECLARE @camilan_stall_fix INT = (
    SELECT id FROM dbo.STALLS WHERE name = N'Gorengan Bu Tini'
);

UPDATE dbo.MENU_ITEMS
SET stall_id = @camilan_stall_fix
WHERE category = N'camilan'
  AND stall_id <> @camilan_stall_fix
  AND name IN (
      N'Pisang Goreng',
      N'Risoles Mayo',
      N'Tahu Bakso',
      N'Cireng Bumbu Rujak'
  )
  AND @camilan_stall_fix IS NOT NULL;
GO

-- Hapus duplikat seed (nama sama di warung camilan), sisakan id terkecil.
DECLARE @camilan_stall_dedupe INT = (
    SELECT id FROM dbo.STALLS WHERE name = N'Gorengan Bu Tini'
);

DELETE m
FROM dbo.MENU_ITEMS m
INNER JOIN (
    SELECT MIN(id) AS keep_id, name
    FROM dbo.MENU_ITEMS
    WHERE category = N'camilan'
      AND name IN (
          N'Pisang Goreng',
          N'Risoles Mayo',
          N'Tahu Bakso',
          N'Cireng Bumbu Rujak'
      )
    GROUP BY name
    HAVING COUNT(*) > 1
) d ON d.name = m.name
WHERE m.category = N'camilan'
  AND m.stall_id = @camilan_stall_dedupe
  AND m.id <> d.keep_id;
GO

PRINT 'Seed Pertemuan 08 Hands-on 1 selesai.';
GO

SELECT
    category,
    COUNT(*) AS jumlah,
    SUM(CASE WHEN is_available = 1 THEN 1 ELSE 0 END) AS tersedia
FROM dbo.MENU_ITEMS
GROUP BY category
ORDER BY category;
GO
