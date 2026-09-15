# setup-database.ps1
# Menyiapkan SQL Server untuk Praktikum RSI 2026 (Pertemuan 03).
# JALANKAN SEBAGAI ADMINISTRATOR (butuh ubah registry + restart service).
#
#   powershell -ExecutionPolicy Bypass -File .\setup-database.ps1
#
# Default instance: MSSQLSERVER, server "localhost", port 1433.
# Untuk named instance, ubah $Instance / $Server / $ServiceName di bawah.

$ErrorActionPreference = 'Stop'

$Server      = 'localhost'
$ServiceName = 'MSSQLSERVER'

$here = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host '== 1/4 Aktifkan mixed mode + buat login admin (rsi_admin) =='
sqlcmd -S $Server -E -C -i (Join-Path $here '00-setup-sql-auth.sql')

Write-Host '== 2/4 Aktifkan TCP/IP port 1433 =='
sqlcmd -S $Server -E -C -Q "EXEC xp_instance_regwrite N'HKEY_LOCAL_MACHINE', N'Software\Microsoft\MSSQLServer\MSSQLServer\SuperSocketNetLib\Tcp', N'Enabled', REG_DWORD, 1; EXEC xp_instance_regwrite N'HKEY_LOCAL_MACHINE', N'Software\Microsoft\MSSQLServer\MSSQLServer\SuperSocketNetLib\Tcp\IPAll', N'TcpPort', REG_SZ, N'1433';"

Write-Host '== 3/4 Buat database review_kantin + user praktikum_user =='
sqlcmd -S $Server -E -C -i (Join-Path $here '01-create-database.sql')

Write-Host "== 4/4 Restart service $ServiceName =="
Restart-Service -Name $ServiceName -Force

Write-Host ''
Write-Host 'Selesai. Uji:'
Write-Host "  sqlcmd -S $Server -U praktikum_user -P `"Praktikum2026!`" -d review_kantin -C -Q `"SELECT DB_NAME() AS db;`""
