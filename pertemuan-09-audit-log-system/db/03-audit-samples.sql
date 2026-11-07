-- ============================================================
-- Pertemuan 09 - Hands-on 1 (opsional)
-- Contoh query untuk memeriksa isi riwayat audit langsung dari SQL.
-- Tidak mengubah data. Gunakan setelah login / CRUD menu / order.
-- ============================================================

USE review_kantin;
GO

-- 20 aktivitas terbaru beserta pelakunya.
SELECT TOP (20)
    a.id,
    a.created_at,
    u.name  AS user_name,
    u.role  AS user_role,
    a.action,
    a.target_table,
    a.target_id,
    a.metadata
FROM dbo.AUDIT_LOGS a
INNER JOIN dbo.USERS u ON u.id = a.user_id
ORDER BY a.created_at DESC, a.id DESC;
GO

-- Jumlah aktivitas per aksi.
SELECT action, COUNT(*) AS total
FROM dbo.AUDIT_LOGS
GROUP BY action
ORDER BY total DESC, action;
GO
