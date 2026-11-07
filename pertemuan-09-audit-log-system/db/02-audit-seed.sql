-- ============================================================
-- Pertemuan 09 - Hands-on 1
-- Seed akun admin untuk menguji halaman riwayat audit.
--
-- Password: admin123
-- Script idempoten: hanya memperbarui hash akun demo admin.
-- Akun dibuat oleh seed Pertemuan 03/08, jadi script ini tidak
-- membuat akun baru. Jangan pakai password ini di produksi.
-- ============================================================

USE review_kantin;
GO

UPDATE dbo.USERS
SET password_hash = N'$2b$10$9nAaVoCz0amp7S48sHfSgOPi6FoyWMg.WS9YsL4/J01SoGNwPS9/2'
WHERE email = N'admin@kantin.test'
  AND role = N'admin';
GO

IF NOT EXISTS (
    SELECT 1 FROM dbo.USERS
    WHERE email = N'admin@kantin.test'
      AND role = N'admin'
      AND password_hash LIKE N'$2b$%'
      AND LEN(password_hash) = 60
)
BEGIN
    THROW 50009, 'Akun admin@kantin.test tidak ditemukan atau hash tidak valid. Jalankan seed Pertemuan 03/08 lebih dulu.', 1;
END
GO

SELECT id, name, email, role, LEFT(password_hash, 7) AS hash_prefix
FROM dbo.USERS
WHERE email = N'admin@kantin.test';
GO

PRINT 'Akun admin untuk uji audit siap.';
GO
