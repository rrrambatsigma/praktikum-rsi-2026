/* =====================================================================
   00-setup-sql-auth.sql
   Tujuan   : mengaktifkan SQL Authentication (mixed mode) dan membuat
              login admin, agar bisa membuat login aplikasi (praktikum_user).
   Jalankan : di database "master", SEBAGAI sysadmin (Windows Authentication).
   Catatan  : mengubah LoginMode membutuhkan RESTART service SQL Server.
   ===================================================================== */

USE master;
GO

-- 1) Cek apakah instance masih Windows-only.
--    1 = SQL Authentication mati, 0 = mixed mode aktif.
SELECT
    SERVERPROPERTY('IsIntegratedSecurityOnly') AS windows_only,
    SERVERPROPERTY('InstanceName')             AS instance_name;
GO

-- 2) Aktifkan mixed mode (SQL Server + Windows Authentication).
--    LoginMode: 1 = Windows only, 2 = Mixed.
--    Path registry di bawah berlaku untuk DEFAULT instance (localhost).
--    Untuk named instance (mis. .\SQLEXPRESS), aktifkan lewat SSMS:
--    Server Properties -> Security -> "SQL Server and Windows Authentication mode".
EXEC xp_instance_regwrite
     N'HKEY_LOCAL_MACHINE',
     N'Software\Microsoft\MSSQLServer\MSSQLServer',
     N'LoginMode',
     REG_DWORD,
     2;
GO

-- 3) Buat login admin (sysadmin).
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'rsi_admin')
BEGIN
    CREATE LOGIN rsi_admin
        WITH PASSWORD = N'RsiAdmin#2026',
             DEFAULT_DATABASE = master;
END
GO

ALTER SERVER ROLE sysadmin ADD MEMBER rsi_admin;
GO

-- 4) Verifikasi.
SELECT name, type_desc, is_disabled
FROM sys.server_principals
WHERE name = N'rsi_admin';
GO
