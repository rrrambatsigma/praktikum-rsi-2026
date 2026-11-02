> **Branch starter.** Backend sudah lengkap. Lengkapi bagian frontend yang ditandai `TODO` pada kedua hands-on. Daftar file ada di README masing-masing hands-on.

# Pertemuan 08 - Validasi Form & Error Handling

Materi praktikum Rekayasa Sistem Informasi 2026 tentang validasi form dan penanganan error API pada aplikasi **Maem Bolo** (katalog kantin kampus).

Pertemuan ini berfokus pada satu prinsip: **validasi frontend adalah untuk pengalaman pengguna, validasi backend adalah untuk integritas data**. Keduanya harus ada dan tidak boleh saling menggantikan.

## Peta Materi

| Hands-on | Topik | Port | Status |
|---|---|---|---|
| Hands-on 1 | Login Owner, validasi form, ownership check, Fetch API | Backend `3001`, frontend `5173` | Tersedia |
| Hands-on 2 | Register customer, RBAC, CRUD owner, checkout, admin read-only, Axios, centralized error | Backend `3002`, frontend `5174` | Tersedia |

Hands-on 1 adalah fondasi. Hands-on 2 dibangun di folder terpisah dan **tidak mengubah source Hands-on 1**.

## Tujuan Pembelajaran

1. Membuat form React yang dikendalikan state dan tervalidasi.
2. Memisahkan aturan validasi dari komponen UI.
3. Menampilkan error per field dan error umum secara jelas.
4. Mengirim request dengan Fetch API dan Axios, lalu menangani status HTTP.
5. Memvalidasi ulang payload di backend menggunakan `zod`.
6. Menyimpan data ke SQL Server dengan query parameterized.
7. Membedakan error validasi, autentikasi, otorisasi, error bisnis, dan error server.
8. Menerapkan autentikasi cookie httpOnly dan otorisasi berbasis role.
9. Menerapkan object-level authorization: owner hanya boleh mengubah warung/menu miliknya.
10. Membuat checkout dengan total yang dihitung server dan transaksi database.
11. Menormalisasi error API ke satu kontrak yang memuat `requestId`.
12. Menerapkan least privilege: admin hanya membaca order pada fitur inti.

## Prasyarat

- Node.js >= 22.18 dan npm.
- SQL Server aktif di `localhost:1433`.
- Database `review_kantin` sudah dibuat melalui Pertemuan 03.
- PowerShell (contoh perintah memakai PowerShell).

## Mulai Cepat

Dari root repository `E:\praktikum-rsi-2026`:

```powershell
# 1. Migrasi + seed (aditif dan idempoten)
sqlcmd -S localhost -E -C -b -i "pertemuan-08-validasi-error-handling\db\01-menu-schema.sql"
sqlcmd -S localhost -E -C -b -i "pertemuan-08-validasi-error-handling\db\02-menu-seed.sql"
sqlcmd -S localhost -E -C -b -i "pertemuan-08-validasi-error-handling\db\03-auth-seed.sql"
sqlcmd -S localhost -E -C -b -i "pertemuan-08-validasi-error-handling\db\04-orders-schema.sql"
sqlcmd -S localhost -E -C -b -i "pertemuan-08-validasi-error-handling\db\05-demo-accounts.sql"
```

### Hands-on 1

```powershell
# Backend (terminal 1)
cd pertemuan-08-validasi-error-handling\hands-on-1-form-validation\backend
Copy-Item .env.example .env
notepad .env                 # isi DB_USER, DB_PASSWORD, dan JWT_SECRET
npm install
npm run dev                  # http://localhost:3001

# Frontend (terminal 2)
cd ..\frontend
Copy-Item .env.example .env
npm install
npm run dev                  # http://localhost:5173
```

Panduan lengkap: [`hands-on-1-form-validation/README.md`](hands-on-1-form-validation/README.md).

### Hands-on 2

```powershell
# Backend (terminal 1)
cd pertemuan-08-validasi-error-handling\hands-on-2-centralized-error-handling\backend
Copy-Item .env.example .env
notepad .env                 # sesuaikan DB_USER, DB_PASSWORD, JWT_SECRET
npm install
npm run dev                  # http://localhost:3002

# Frontend (terminal 2)
cd ..\frontend
Copy-Item .env.example .env
npm install
npm run dev                  # http://localhost:5174
```

Panduan lengkap: [`hands-on-2-centralized-error-handling/README.md`](hands-on-2-centralized-error-handling/README.md).

## Akun Demo Hands-on 2

| Role | Email | Password | Halaman awal |
|---|---|---|---|
| Admin | `admin@kantin.test` | `admin123` | `/admin/orders` |
| Owner | `tini@kantin.test` | `rahasia123` | `/dashboard` |
| Customer | `bagas@student.test` | `rahasia123` | `/` |

Hands-on 1 hanya menerima role Owner. Hands-on 2 menerima customer, owner, dan admin.

## Struktur Folder

```text
pertemuan-08-validasi-error-handling/
|-- db/
|   |-- 01-menu-schema.sql          # kategori & deskripsi menu
|   |-- 02-menu-seed.sql            # backfill kategori + contoh camilan
|   |-- 03-auth-seed.sql            # akun owner praktikum
|   |-- 04-orders-schema.sql        # ORDERS + ORDER_ITEMS
|   `-- 05-demo-accounts.sql        # akun admin/customer demo
|-- hands-on-1-form-validation/
|   |-- backend/                    # Express 5 + zod + mssql + Fetch
|   |-- frontend/                   # React 19 + Vite 8 + Tailwind 4
|   `-- README.md
|-- hands-on-2-centralized-error-handling/
|   |-- backend/                    # Express 5 + zod + mssql + Axios contract
|   |-- frontend/                   # React 19 + Vite 8 + Tailwind 4 + Axios
|   |-- docs/                       # slide, lembar kerja, matriks uji, demo
|   `-- README.md
`-- README.md
```

## Perubahan Database

Pertemuan 08 **tidak membuat database baru** dan tidak mengubah tabel milik Pertemuan 03–07 secara destruktif.

| Objek | Perubahan | Sifat |
|---|---|---|
| `dbo.MENU_ITEMS.category` | `NVARCHAR(20) NULL` | Aditif |
| `dbo.MENU_ITEMS.description` | `NVARCHAR(255) NULL` | Aditif |
| `CK_MENU_ITEMS_category` | `makanan` / `minuman` / `camilan` / `NULL` | Aditif |
| Data menu lama | Backfill kategori dari kategori warung | Idempoten |
| Warung `Gorengan Bu Tini` | Satu warung camilan contoh, terikat ke owner demo | Idempoten |
| Menu camilan | 4 menu, 1 di antaranya habis | Idempoten |
| `dbo.USERS.password_hash` akun demo | Hash bcrypt valid | Idempoten |
| `dbo.ORDERS` | Header order + kode unik | Aditif |
| `dbo.ORDER_ITEMS` | Snapshot item, `menu_id` nullable | Aditif |

`category` sengaja nullable agar kode Pertemuan 02–07 yang belum mengirim kategori tetap berjalan.

`ORDER_ITEMS.menu_id` memakai `ON DELETE SET NULL`. Jika menu dihapus, order lama tetap menyimpan nama dan harga sebagai snapshot.

## Ringkasan API Hands-on 2

| Method | Path | Akses | Sukses | Fungsi |
|---|---|---|---|---|
| `GET` | `/health` | Publik | `200` | Status server dan database |
| `POST` | `/api/auth/register` | Publik | `201` | Daftar customer |
| `POST` | `/api/auth/login` | Publik | `200` | Login semua role + cookie |
| `GET` | `/api/auth/me` | Sesi | `200` | User yang sedang login |
| `POST` | `/api/auth/logout` | Publik | `200` | Hapus cookie sesi |
| `GET` | `/api/stalls` | Publik | `200` | Daftar warung |
| `GET` | `/api/stalls/mine` | Owner | `200` | Warung milik owner |
| `GET` | `/api/menu` | Publik | `200` | Daftar menu |
| `GET` | `/api/menu/:id` | Publik | `200` | Detail menu |
| `POST` | `/api/menu` | Owner + pemilik warung | `201` | Tambah menu |
| `PUT` | `/api/menu/:id` | Owner + pemilik menu | `200` | Ubah menu |
| `DELETE` | `/api/menu/:id` | Owner + pemilik menu | `204` | Hapus menu |
| `POST` | `/api/orders` | Customer | `201` | Buat pesanan |
| `GET` | `/api/orders` | Admin | `200` | Baca semua pesanan |
| `POST` | `/api/dev/force-error` | Non-production | `500` | Simulasi error server |
| `GET` | `/api/dev/slow?ms=5000` | Non-production | `200` | Simulasi request lambat |

Kontrak error Hands-on 2:

```json
{
  "status": "fail",
  "code": "MENU_UNAVAILABLE",
  "message": "Ada menu yang sedang habis.",
  "errors": [
    {
      "field": "items",
      "message": "Cireng Bumbu Rujak sedang habis. Hapus dari keranjang."
    }
  ],
  "requestId": "8b7f0f5e-4e86-4f4e-9a77-6b1f5a9f0c11"
}
```

`requestId` juga dikirim di header `X-Request-Id`. Kode error utama: `VALIDATION_ERROR`, `INVALID_JSON`, `UNAUTHORIZED`, `FORBIDDEN`, `STALL_FORBIDDEN`, `MENU_FORBIDDEN`, `MENU_NOT_FOUND`, `MENU_UNAVAILABLE`, `EMAIL_TAKEN`, `MENU_NAME_TAKEN`, `ROUTE_NOT_FOUND`, `INTERNAL_ERROR`.

## Validasi dan Otorisasi Berlapis

| Lapis | Lokasi | Peran |
|---|---|---|
| Frontend | `frontend/src/lib/validation.ts` | Umpan balik cepat, mencegah request yang jelas salah |
| Backend schema | `backend/src/schemas/*.ts` | Otoritatif, tetap menolak payload invalid dari curl/Postman |
| Backend auth | `authenticate` + `authorize` | Memeriksa sesi dan role |
| Backend ownership | service/repository | Memeriksa pemilik warung/menu, bukan hanya role |
| Frontend route guard | `ProtectedRoute` | Mencegah halaman role lain tampil |

Role saja tidak cukup. `POST /api/menu` dengan `stallId` warung orang lain ditolak `403 STALL_FORBIDDEN`; `PUT`/`DELETE` menu orang lain ditolak `403 MENU_FORBIDDEN`.

## Perintah Pengujian

Hands-on 1:

```powershell
cd pertemuan-08-validasi-error-handling\hands-on-1-form-validation\backend
npm run typecheck
npm run test:unit
npm run test:integration

cd ..\frontend
npm test
npm run lint
npm run build
```

Hands-on 2:

```powershell
cd pertemuan-08-validasi-error-handling\hands-on-2-centralized-error-handling\backend
npm run typecheck
npm run test:unit
npm run test:integration

cd ..\frontend
npm test
npm run lint
npm run build
```

Integration test backend memakai database nyata dan membersihkan data uji yang dibuatnya. Jalankan migrasi `04` dan `05` sebelum menguji Hands-on 2.

## Status Verifikasi

| Pemeriksaan | Hands-on 1 | Hands-on 2 |
|---|---|---|
| Type check backend | Lulus | Lulus |
| Unit test backend | 27/27 | 42/42 |
| Integration test backend | 24/24 | 14/14 |
| Unit test frontend | 23/23 | 33/33 |
| Lint frontend | Lulus | Lulus |
| Build frontend | Lulus | Lulus |
| Smoke test API | `200`, `201`, `400`, `401`, `403`, `404` | `200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`, `500` |
| Uji UI browser | Login, dashboard, modal, validasi | Register, login, checkout, owner CRUD, admin read-only, `/forbidden` |

## Batasan

- Hands-on 1 hanya menambah dan melihat menu; belum ada edit/hapus.
- Hands-on 1 hanya role owner; belum ada registrasi publik atau multi-role.
- Hands-on 2 belum punya riwayat order customer.
- Admin Hands-on 2 hanya membaca order; ubah status adalah tantangan opsional.
- Belum ada pagination/filter order.
- Belum ada test komponen React; validator diuji terpisah dan UI diuji manual/di browser.

## Troubleshooting Singkat

| Gejala | Penyebab umum |
|---|---|
| Health check `500` | SQL Server mati atau kredensial `.env` salah |
| Login Owner `401` | `03-auth-seed.sql` belum dijalankan atau hash masih placeholder |
| Login admin/customer `401` | `05-demo-accounts.sql` belum dijalankan |
| Dashboard kembali ke login | Cookie tidak terkirim / CORS credentials salah |
| `POST /api/menu` `403` | Role selain owner, atau `stallId` bukan warung milik owner (`STALL_FORBIDDEN`) |
| `CREATE TABLE permission denied` | Jalankan `04-orders-schema.sql` dengan akun DDL, mis. `sqlcmd -E` |
| CORS error | `CORS_ORIGIN` tidak sama dengan origin frontend |
| `EADDRINUSE` | Port 3001/5173/3002/5174 dipakai proses lain |
| `Invalid column name 'category'` | Migrasi database belum dijalankan |
| Error jaringan di form | Backend belum jalan atau `VITE_API_BASE_URL` salah |
| Cookie bentrok Hands-on 1/2 | Hands-on 2 memakai `kantin_session_ho2` |

Detail lengkap ada di README masing-masing hands-on.
