# Hands-on 1 - Audit Log System

Hands-on Pertemuan 09. Fokusnya adalah **mencatat aktivitas penting ke tabel audit secara atomik**, lalu menampilkannya sebagai riwayat yang hanya bisa dibaca admin.

Fitur bisnis dari Pertemuan 08 tidak diubah perilakunya. Yang ditambahkan adalah lapisan audit: setiap login, perubahan menu, pembuatan pesanan, dan perubahan status pesanan meninggalkan jejak yang tidak bisa dihapus dari aplikasi.

## Tujuan Pembelajaran

1. Memahami perbedaan audit trail, application log, dan error log.
2. Menentukan data minimum yang layak dicatat: **siapa, melakukan apa, pada objek apa, kapan**.
3. Menulis audit di dalam **transaksi yang sama** dengan mutasi bisnis.
4. Memastikan kegagalan audit membatalkan mutasi bisnis (all-or-nothing).
5. Membedakan audit wajib (mutasi data) dan audit best-effort (login).
6. Membuat endpoint riwayat audit dengan filter, pagination, dan pembatasan role.
7. Menjaga audit tetap append-only: tidak ada endpoint ubah/hapus.
8. Tidak mencatat data sensitif seperti password, token, atau cookie.

## Ruang Lingkup

### Core yang diimplementasikan

| Area | Perilaku |
|---|---|
| Login | Mencatat `LOGIN` setelah kredensial valid. Gagal menulis audit tidak menggagalkan login. |
| CRUD menu | Create/update/delete menu mencatat `CREATE_MENU`, `UPDATE_MENU`, `DELETE_MENU` beserta snapshot data. |
| Checkout | Pembuatan pesanan mencatat `CREATE_ORDER` beserta kode order, total, jumlah item, dan ringkasan item. |
| Status pesanan | Admin yang memproses status mencatat `UPDATE_ORDER_STATUS` dengan status sebelum/sesudah. |
| Atomik | Mutasi bisnis + audit berada dalam satu transaksi. Audit gagal berarti mutasi di-rollback. |
| Riwayat | `GET /api/audit-logs` hanya untuk admin, mendukung filter aksi, target, rentang tanggal, dan pagination. |
| Append-only | Tidak ada endpoint update/delete audit. Riwayat hanya bisa dibaca. |
| Snapshot | Metadata menyimpan kondisi `before`/`after` secukupnya agar perubahan bisa dipertanggungjawabkan. |
| Privasi | Metadata tidak berisi password, token, cookie, atau data sensitif lain. |

### Optional yang tidak termasuk core

- Export CSV/Excel.
- Retensi otomatis dan arsip audit.
- Pencarian teks bebas pada metadata.
- Notifikasi real-time saat ada aktivitas mencurigakan.
- Audit untuk register, logout, dan percobaan login gagal.
- Perbandingan diff visual antar versi data.

## Prasyarat

- Node.js >= 22.18 dan npm.
- SQL Server aktif di `localhost:1433`.
- Database `review_kantin` dari Pertemuan 03.
- Skema dan seed Pertemuan 08 sudah dijalankan.
- PowerShell (contoh perintah memakai PowerShell).

## Mulai Cepat

Dari root repository `E:\praktikum-rsi-2026`:

```powershell
# 1. Jalankan skema/seed Pertemuan 08 lebih dulu (jika belum).
sqlcmd -S localhost -E -C -b -i "pertemuan-08-validasi-error-handling\db\01-menu-schema.sql"
sqlcmd -S localhost -E -C -b -i "pertemuan-08-validasi-error-handling\db\02-menu-seed.sql"
sqlcmd -S localhost -E -C -b -i "pertemuan-08-validasi-error-handling\db\03-auth-seed.sql"
sqlcmd -S localhost -E -C -b -i "pertemuan-08-validasi-error-handling\db\04-orders-schema.sql"
sqlcmd -S localhost -E -C -b -i "pertemuan-08-validasi-error-handling\db\05-demo-accounts.sql"
sqlcmd -S localhost -E -C -b -i "pertemuan-08-validasi-error-handling\db\06-order-stall-snapshot.sql"

# 2. Skema index audit + akun admin untuk pengujian.
sqlcmd -S localhost -E -C -b -i "pertemuan-09-audit-log-system\db\01-audit-log-schema.sql"
sqlcmd -S localhost -E -C -b -i "pertemuan-09-audit-log-system\db\02-audit-seed.sql"

# 3. Backend (terminal 1)
cd pertemuan-09-audit-log-system\hands-on-1-audit-log\backend
Copy-Item .env.example .env
notepad .env                 # sesuaikan DB_USER, DB_PASSWORD, JWT_SECRET
npm install
npm run dev                  # http://localhost:3002

# 4. Frontend (terminal 2)
cd ..\frontend
Copy-Item .env.example .env
npm install
npm run dev                  # http://localhost:5174
```

`dbo.AUDIT_LOGS` sudah dibuat oleh skema Pertemuan 03. Script `01-audit-log-schema.sql` memastikan tabel ada dan menambahkan index yang dibutuhkan halaman riwayat. Script tersebut idempoten dan tidak menghapus data.

## Akun Demo

| Role | Email | Password | Halaman awal |
|---|---|---|---|
| Admin | `admin@kantin.test` | `admin123` | `/admin/orders` |
| Owner | `tini@kantin.test` | `rahasia123` | `/dashboard` |
| Customer | `bagas@student.test` | `rahasia123` | `/` |

Password hanya untuk lingkungan praktikum. Jangan dipakai di luar praktikum.

## Alur Demo

### 1. Login menghasilkan audit

1. Masuk sebagai owner atau customer.
2. Backend menulis `LOGIN` pada `USERS` dengan metadata `{ "role": "owner" }`.
3. Login tetap berhasil walaupun penulisan audit gagal. Audit login bersifat best-effort karena kegagalan mencatat tidak boleh mengunci pengguna.

### 2. Owner mengubah menu

1. Masuk sebagai owner, lalu tambah/ubah/hapus menu di dashboard.
2. `CREATE_MENU` menyimpan snapshot `after`.
3. `UPDATE_MENU` menyimpan `before`, `after`, dan daftar `changed`.
4. `DELETE_MENU` menyimpan snapshot `before` agar data yang hilang tetap bisa ditelusuri.
5. Jika insert audit gagal, perubahan menu ikut dibatalkan karena satu transaksi.

### 3. Customer checkout

1. Masuk sebagai customer, tambahkan menu, lalu checkout.
2. `CREATE_ORDER` menyimpan `orderCode`, `total`, `itemCount`, `status`, dan ringkasan item.
3. Harga dan total tetap dihitung server seperti Pertemuan 08.

### 4. Admin memproses pesanan

1. Masuk sebagai admin, buka menu **Pesanan**.
2. Selesaikan atau batalkan pesanan `confirmed`.
3. `UPDATE_ORDER_STATUS` menyimpan `before` dan `after`, misalnya `confirmed` -> `completed`.

### 5. Admin melihat riwayat audit

1. Buka menu **Audit** (`/admin/audit-logs`).
2. Filter berdasarkan aksi, target, atau rentang tanggal.
3. Gunakan pagination untuk melihat catatan lama.
4. Klik **Lihat** untuk membaca metadata JSON lengkap.
5. Role selain admin ditolak backend (`403 FORBIDDEN`) dan diarahkan frontend ke `/forbidden`.

## Konvensi Aksi Audit

| Aksi | Target | Metadata |
|---|---|---|
| `LOGIN` | `USERS` | `{ role }` |
| `CREATE_MENU` | `MENU_ITEMS` | `{ after }` |
| `UPDATE_MENU` | `MENU_ITEMS` | `{ before, after, changed }` |
| `DELETE_MENU` | `MENU_ITEMS` | `{ before }` |
| `CREATE_ORDER` | `ORDERS` | `{ orderCode, total, itemCount, status, items }` |
| `UPDATE_ORDER_STATUS` | `ORDERS` | `{ orderCode, before, after }` |

`target_id` adalah primary key objek yang terdampak. Untuk `LOGIN`, `target_id` berisi id user yang login.

## Ringkasan API

| Method | Path | Akses | Sukses | Fungsi |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | Publik | `200` | Login + audit `LOGIN` |
| `POST` | `/api/menu` | Owner | `201` | Tambah menu + audit |
| `PUT` | `/api/menu/:id` | Owner + pemilik | `200` | Ubah menu + audit |
| `DELETE` | `/api/menu/:id` | Owner + pemilik | `204` | Hapus menu + audit |
| `POST` | `/api/orders` | Customer | `201` | Buat pesanan + audit |
| `PATCH` | `/api/orders/:id/status` | Admin | `200` | Ubah status + audit |
| `GET` | `/api/audit-logs` | Admin | `200` | Riwayat audit + filter + pagination |

Endpoint lain dari Pertemuan 08 tetap sama.

### Query `GET /api/audit-logs`

| Parameter | Tipe | Default | Keterangan |
|---|---|---|---|
| `page` | integer >= 1 | `1` | Halaman yang diminta |
| `pageSize` | integer 1-100 | `20` | Jumlah baris per halaman |
| `action` | string | - | Filter aksi, mis. `LOGIN` |
| `targetTable` | string | - | Filter target, mis. `ORDERS` |
| `from` | `YYYY-MM-DD` | - | Tanggal awal (inklusif) |
| `to` | `YYYY-MM-DD` | - | Tanggal akhir (inklusif) |

Contoh respons:

```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": 12,
        "userId": 1,
        "userName": "Admin Kantin",
        "userEmail": "admin@kantin.test",
        "action": "UPDATE_ORDER_STATUS",
        "targetTable": "ORDERS",
        "targetId": 5,
        "metadata": {
          "orderCode": "ORD-20261108-AB12CD34",
          "before": "confirmed",
          "after": "completed"
        },
        "createdAt": "2026-11-08T10:15:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

Parameter tidak valid ditolak `400 VALIDATION_ERROR` dengan detail field.

## Arsitektur Audit

### Backend

| File | Peran |
|---|---|
| `src/db/transaction.ts` | `withTransaction()`: satu transaksi untuk mutasi + audit |
| `src/db/request.ts` | Membuat `sql.Request` dari transaksi atau pool |
| `src/repositories/auditLogRepository.ts` | Insert audit dan query riwayat + filter + pagination |
| `src/services/auditLogService.ts` | `record()`, `recordLogin()` best-effort, dan `list()` |
| `src/controllers/auditLogController.ts` | Validasi query dan kirim respons |
| `src/routes/auditLogRouter.ts` | `authenticate` + `authorize('admin')` |
| `src/services/menuService.ts` | Mutasi menu + audit dalam satu transaksi |
| `src/services/orderService.ts` | Pesanan/status + audit dalam satu transaksi |
| `src/services/authService.ts` | Audit login setelah kredensial valid |

Alur mutasi menu:

```text
MenuService
  -> withTransaction
       -> MenuRepository.create/update/delete (request dari transaksi)
       -> AuditLogService.record            (request dari transaksi)
     -> commit
```

Jika salah satu langkah melempar error, `withTransaction` melakukan rollback. Tidak ada kondisi mutasi tersimpan tetapi audit hilang.

### Frontend

| File | Peran |
|---|---|
| `src/types/auditLog.ts` | Tipe audit, filter, dan pagination |
| `src/lib/api.ts` | `getAuditLogs()` memanggil endpoint admin |
| `src/lib/audit.ts` | Label aksi/target, warna badge, dan format metadata |
| `src/pages/AuditLogPage.tsx` | Filter, tabel, pagination, dan modal detail |
| `src/App.tsx` | Route `/admin/audit-logs` di dalam `ProtectedRoute` admin |
| `src/components/AppHeader.tsx` | Menu **Audit** khusus admin |

## Verifikasi Manual

Jalankan `db/03-audit-samples.sql` untuk melihat isi tabel:

```powershell
sqlcmd -S localhost -E -C -b -i "pertemuan-09-audit-log-system\db\03-audit-samples.sql"
```

Yang perlu terlihat:

1. Setiap login menambah baris `LOGIN`.
2. Tambah menu menambah `CREATE_MENU`; ubah menu menambah `UPDATE_MENU` dengan `before`/`after`; hapus menu menambah `DELETE_MENU` dengan `before`.
3. Checkout menambah `CREATE_ORDER` dengan `orderCode` dan total yang sama dengan respons API.
4. Perubahan status menambah `UPDATE_ORDER_STATUS` dengan status sebelum/sesudah.
5. `GET /api/audit-logs` sebagai owner/customer menghasilkan `403`.
6. Filter tanggal `from` lebih besar dari `to` menghasilkan `400`.

## Catatan Keamanan

- Riwayat audit hanya untuk admin, baik di frontend maupun backend.
- Audit bersifat append-only: tidak ada endpoint update/delete.
- Jangan mencatat password, token, cookie, atau isi header otorisasi.
- Metadata adalah JSON; tetap perlakukan sebagai data tidak tepercaya saat ditampilkan.
- Audit bukan pengganti backup. Retensi dan arsip di luar scope hands-on ini.

## Troubleshooting

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| Login berhasil tetapi riwayat kosong | `AUDIT_LOGS` belum ada / insert gagal | Jalankan `01-audit-log-schema.sql`, cek log backend |
| `403` saat buka `/admin/audit-logs` | Login bukan admin | Masuk dengan `admin@kantin.test` |
| `400` pada filter tanggal | Format bukan `YYYY-MM-DD` | Gunakan input date atau format yang benar |
| Halaman kosong setelah filter | Tidak ada data pada rentang tersebut | Reset filter |
| Perubahan menu gagal total | Insert audit gagal (mis. FK user) | Periksa `user_id` dan log backend; transaksi memang di-rollback |
| Data audit lama tidak muncul | `pageSize`/`page` salah | Kembali ke halaman 1 atau kurangi filter |
