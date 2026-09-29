USE review_kantin;
GO

-- Password seed (bcrypt).
-- Seed di pertemuan-03 (db/03-seed.sql) masih memakai placeholder
-- N'hash_admin', N'hash_owner1', dst. Nilai itu BUKAN hash bcrypt, jadi
-- endpoint /auth/login akan selalu gagal membandingkannya.
--
-- Skrip ini mengganti placeholder tersebut dengan hash bcrypt asli.
-- Semua akun di bawah memakai password: 'rahasia123'
--
-- Aman dijalankan berulang kali (idempotent) karena memakai UPDATE,
-- bukan INSERT. Kalau database belum di-seed di pertemuan-03,
-- jalankan dulu db/00..03 di folder pertemuan-03-database-backend-crud.
IF EXISTS (SELECT 1 FROM dbo.USERS)
BEGIN
    -- admin  -> boleh akses semua endpoint (authorize('admin'))
    UPDATE dbo.USERS SET password_hash = N'$2b$10$eYDhA8k96hVOwauOdHcJ/eyLwmLpIXMJcOApklHzRNrAa2yXVweXy'
    WHERE email = N'admin@kantin.test';

    -- owner  -> pemilik warung, belum punya akses endpoint admin
    UPDATE dbo.USERS SET password_hash = N'$2b$10$uDbObu/Mw0BOJ0MNJo9H4.E3RsRtKnpRHBZ4axJr76K0fSn8qYrAe'
    WHERE email = N'tini@kantin.test';

    -- customer -> user biasa, hanya boleh akses endpoint protected
    UPDATE dbo.USERS SET password_hash = N'$2b$10$XayKzWUDvMrQxrSm50SMNeJHtPZxImuhA7uUtk2h3bvD5fVzUfdje'
    WHERE email = N'bagas@student.test';

    -- Verifikasi: kolom password_hash HARUS diawali '$2b$10$'
    SELECT id, email, role, LEFT(password_hash, 7) AS hash_prefix
    FROM dbo.USERS
    WHERE email IN (N'admin@kantin.test', N'tini@kantin.test', N'bagas@student.test');
END
ELSE
BEGIN
    PRINT 'Tabel dbo.USERS belum ada. Jalankan db/02-schema.sql & db/03-seed.sql di pertemuan-03 lebih dulu.';
END
GO