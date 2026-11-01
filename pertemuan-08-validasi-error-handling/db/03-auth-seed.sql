USE review_kantin;
GO

-- ============================================================
-- Pertemuan 08 - Hands-on 1: akun Owner untuk login MaemBolo
-- ============================================================
-- Hands-on 1 memakai autentikasi dari Pertemuan 05/07:
-- password disimpan sebagai hash bcrypt, bukan plaintext.
--
-- Script ini idempoten: hanya memperbarui hash milik akun
-- tini@kantin.test. Akun dan warungnya sudah dibuat oleh seed
-- Pertemuan 03, jadi script ini TIDAK membuat akun baru.
--
-- Password akun praktikum ini diumumkan di README Hands-on 1.
-- Jangan pakai password tersebut di luar lingkungan praktikum.
-- ============================================================

UPDATE dbo.USERS
SET password_hash = N'$2b$10$uDbObu/Mw0BOJ0MNJo9H4.E3RsRtKnpRHBZ4axJr76K0fSn8qYrAe'
WHERE email = N'tini@kantin.test'
  AND role = N'owner';
GO

-- Verifikasi: hash harus diawali $2b$ dan panjang 60 karakter.
IF NOT EXISTS (
    SELECT 1
    FROM dbo.USERS
    WHERE email = N'tini@kantin.test'
      AND role = N'owner'
      AND password_hash LIKE N'$2b$%'
      AND LEN(password_hash) = 60
)
BEGIN
    THROW 50001, 'Akun owner tini@kantin.test tidak ditemukan atau hash tidak valid. Jalankan seed Pertemuan 03 lebih dulu.', 1;
END
GO

SELECT id, name, email, role, LEFT(password_hash, 7) AS hash_prefix
FROM dbo.USERS
WHERE email = N'tini@kantin.test';
GO
