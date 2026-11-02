-- ============================================================
-- Pertemuan 08 - Hands-on 2
-- Akun demo untuk login multi-role.
--
-- Password:
--   admin@kantin.test  -> admin123
--   bagas@student.test -> rahasia123
--
-- Password hanya untuk lingkungan praktikum. Jangan dipakai di produksi.
-- Script idempoten: aman dijalankan lebih dari sekali.
-- ============================================================

USE review_kantin;
GO

UPDATE dbo.USERS
SET password_hash = N'$2b$10$9nAaVoCz0amp7S48sHfSgOPi6FoyWMg.WS9YsL4/J01SoGNwPS9/2'
WHERE email = N'admin@kantin.test'
  AND role = N'admin';
GO

UPDATE dbo.USERS
SET password_hash = N'$2b$10$AuS5gqM6u9F6Sn7Y7OdyjuQOfr3HT/hOl/mJIC4/pPgoPImUUNJ4K'
WHERE email = N'bagas@student.test'
  AND role = N'customer';
GO

IF NOT EXISTS (
    SELECT 1 FROM dbo.USERS
    WHERE email = N'admin@kantin.test'
      AND role = N'admin'
      AND password_hash LIKE N'$2b$%'
      AND LEN(password_hash) = 60
)
BEGIN
    THROW 50002, 'Akun admin@kantin.test tidak ditemukan atau hash tidak valid.', 1;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM dbo.USERS
    WHERE email = N'bagas@student.test'
      AND role = N'customer'
      AND password_hash LIKE N'$2b$%'
      AND LEN(password_hash) = 60
)
BEGIN
    THROW 50003, 'Akun bagas@student.test tidak ditemukan atau hash tidak valid.', 1;
END
GO

PRINT 'Akun demo Hands-on 2 siap.';
GO
