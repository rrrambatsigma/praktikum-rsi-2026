# Pertemuan 08 - Validasi Form & Error Handling

Materi praktikum Rekayasa Sistem Informasi 2026 tentang validasi form dan penanganan error API pada aplikasi **Maem Bolo** (katalog kantin kampus).

Pertemuan ini berfokus pada satu prinsip: **validasi frontend adalah untuk pengalaman pengguna, validasi backend adalah untuk integritas data**. Keduanya harus ada dan tidak boleh saling menggantikan.

## Peta Materi

| Hands-on | Topik | Status |
|---|---|---|
| Hands-on 1 | Login Owner, Form Validation & Basic API Error Handling (Fetch API) | Tersedia |
| Hands-on 2 | Centralized Error Handling & Axios CRUD | Belum diimplementasikan |

Hands-on 1 adalah fondasi. Hands-on 2 akan membangun di atasnya tanpa mengubah source code Hands-on 1.

## Tujuan Pembelajaran

1. Membuat halaman login Owner dan form React yang dikendalikan state serta tervalidasi.
2. Memisahkan aturan validasi dari komponen UI.
3. Menampilkan error per field dan error umum secara jelas.
4. Mengirim request dengan Fetch API dan menangani status HTTP.
5. Memvalidasi ulang payload di backend menggunakan `zod`.
6. Menyimpan data ke SQL Server dengan query parameterized.
7. Membedakan error validasi, error autentikasi, error otorisasi, error bisnis, dan error server.
8. Menampilkan loading state dan notifikasi sukses yang tidak menyesatkan.
9. Melindungi dashboard di frontend dan endpoint tulis di backend.

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

# 2. Backend (terminal 1)
cd pertemuan-08-validasi-error-handling\hands-on-1-form-validation\backend
Copy-Item .env.example .env
notepad .env                 # isi DB_USER, DB_PASSWORD, dan JWT_SECRET
npm install
npm run dev                  # http://localhost:3001

# 3. Frontend (terminal 2)
cd ..\frontend
Copy-Item .env.example .env
npm install
npm run dev                  # http://localhost:5173
```

Panduan lengkap, contoh request/response, aturan validasi, skenario pengujian, dan troubleshooting ada di:

**[`hands-on-1-form-validation/README.md`](hands-on-1-form-validation/README.md)**

## Struktur Folder

```text
pertemuan-08-validasi-error-handling/
├─ db/
│  ├─ 01-menu-schema.sql        # kolom category & description (nullable)
│  ├─ 02-menu-seed.sql          # backfill kategori + contoh camilan
│  └─ 03-auth-seed.sql          # hash bcrypt akun Owner praktikum
├─ hands-on-1-form-validation/
│  ├─ backend/                  # Express 5 + zod + mssql
│  ├─ frontend/                 # React 19 + Vite 8 + Tailwind 4
│  └─ README.md
└─ README.md
```

## Perubahan Database

Pertemuan 08 **tidak membuat database baru** dan tidak mengubah tabel milik Pertemuan 03–07 secara destruktif.

| Objek | Perubahan | Sifat |
|---|---|---|
| `dbo.MENU_ITEMS.category` | `NVARCHAR(20) NULL` | Aditif |
| `dbo.MENU_ITEMS.description` | `NVARCHAR(255) NULL` | Aditif |
| `CK_MENU_ITEMS_category` | `makanan` / `minuman` / `camilan` / `NULL` | Aditif |
| Data menu lama | Backfill kategori dari kategori warung | Idempoten |
| Warung `Gorengan Bu Tini` | Satu warung camilan contoh | Idempoten |
| Menu camilan | 4 menu, 1 di antaranya habis | Idempoten |
| `dbo.USERS.password_hash` akun `tini@kantin.test` | Hash bcrypt valid untuk login praktikum | Idempoten |

`category` sengaja nullable agar kode Pertemuan 02–07 yang belum mengirim kategori tetap berjalan.

Tabel order/checkout belum dibuat. Itu bagian dari Hands-on 2.

## Ringkasan API

| Method | Path | Akses | Sukses | Fungsi |
|---|---|---|---|---|
| `GET` | `/health` | Publik | `200` | Status server dan database |
| `POST` | `/api/auth/login` | Publik | `200` | Login Owner + cookie sesi |
| `GET` | `/api/auth/me` | Sesi | `200` | User yang sedang login |
| `POST` | `/api/auth/logout` | Publik | `200` | Hapus cookie sesi |
| `GET` | `/api/stalls` | Publik | `200` | Daftar warung |
| `GET` | `/api/menu` | Publik | `200` | Daftar menu |
| `POST` | `/api/menu` | Owner | `201` | Tambah menu |
| `POST` | `/api/dev/force-error` | Publik | `500` | Simulasi error (non-production) |

Kontrak error:

```json
{
  "status": "fail",
  "code": "VALIDATION_ERROR",
  "message": "Data menu tidak valid.",
  "errors": [{ "field": "price", "message": "Harga harus lebih dari 0." }]
}
```

Kode error: `VALIDATION_ERROR`, `INVALID_JSON`, `UNAUTHORIZED`, `FORBIDDEN`, `STALL_NOT_FOUND`, `ROUTE_NOT_FOUND`, `CONFLICT`, `INTERNAL_ERROR`.

## Validasi Dua Lapis

| Lapis | Lokasi | Peran |
|---|---|---|
| Frontend | `frontend/src/lib/validation.ts` | Umpan balik cepat, mencegah request yang jelas salah |
| Backend | `backend/src/schemas/menuSchema.ts`, `authSchema.ts` | Otoritatif, tetap menolak payload invalid dari curl/Postman |

Backend juga memeriksa bahwa `stallId` benar-benar ada sebelum menyimpan, dan memeriksa cookie sesi + role Owner sebelum menerima `POST /api/menu`.

## Perintah Pengujian

Backend:

```powershell
cd pertemuan-08-validasi-error-handling\hands-on-1-form-validation\backend
npm run typecheck
npm run test:unit
npm run test:integration
```

Frontend:

```powershell
cd pertemuan-08-validasi-error-handling\hands-on-1-form-validation\frontend
npm test
npm run lint
npm run build
```

Integration test backend memakai database nyata dan membersihkan data uji yang dibuatnya.

## Status Verifikasi

| Pemeriksaan | Hasil |
|---|---|
| Type check backend | Lulus |
| Unit test backend | 24/24 lulus |
| Integration test backend | 21/21 lulus |
| Unit test frontend | 23/23 lulus |
| Lint frontend | Lulus |
| Build frontend | Lulus |
| Smoke test API + database | `200`, `201`, `400`, `401`, `403`, `404` sesuai kontrak |
| Uji UI headless (Chrome + CDP) | Login, redirect, toast, sesi, simpan menu, dan logout terverifikasi |
| Pengujian visual manual | Checklist tersedia, belum diotomatisasi |

## Batasan

- Hanya tambah dan lihat menu; belum ada edit/hapus.
- Role yang dipakai hanya `owner`; belum ada registrasi publik atau multi-role.
- Belum ada checkout atau pembayaran.
- Error handling backend sudah terpusat; pemetaan error frontend masih sederhana.
- Belum ada pagination/filter.
- Belum ada test komponen React (validator diuji terpisah + uji UI CDP).

## Troubleshooting Singkat

| Gejala | Penyebab umum |
|---|---|
| Health check `500` | SQL Server mati atau kredensial `.env` salah |
| Login Owner `401` | `03-auth-seed.sql` belum dijalankan atau hash masih placeholder |
| Dashboard kembali ke login | Cookie tidak terkirim / CORS credentials salah |
| `POST /api/menu` `403` | Login sebagai role selain `owner` |
| CORS error | `CORS_ORIGIN` tidak sama dengan origin frontend |
| `EADDRINUSE` | Port 3001/5173 dipakai proses lain |
| `Invalid column name 'category'` | Migrasi database belum dijalankan |
| Error jaringan di form | Backend belum jalan atau `VITE_API_BASE_URL` salah |

Detail lengkap ada di README Hands-on 1 bagian Troubleshooting.
