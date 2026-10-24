# Maem Bolo - Hands-On 2 Integrasi Axios, Auth, dan CRUD

Aplikasi full-stack untuk eksplorasi warung kantin, review, like, moderasi, dan pengelolaan menu. Frontend React + TypeScript memanggil REST API Express melalui Axios, lalu backend membaca/menulis SQL Server.

## Tujuan

1. Mengintegrasikan React dengan Express memakai Axios dan `withCredentials`.
2. Menyimpan JWT pada cookie HttpOnly, bukan localStorage.
3. Menerapkan autentikasi, restore sesi, dan RBAC admin/owner/customer.
4. Menerapkan ownership check pada warung, menu, dan review.
5. Menangani loading, error, empty state, dan feedback mutasi.
6. Menyediakan dokumentasi OpenAPI/Swagger yang dapat dicoba.
7. Menjaga konsistensi agregat `avg_rating`, `review_count`, dan `like_count`.

## Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide, Axios, React Router.
- Backend: Express 5, TypeScript, Zod, `mssql`, `jsonwebtoken`, `bcryptjs`, Swagger UI.
- Database: SQL Server, schema dari Pertemuan 03. **Tidak ada perubahan schema/seed pada hands-on ini.**

## Struktur

```text
hands-on-2-integrasi-axios-crud/
├─ backend/
│  ├─ src/config/        env dan koneksi
│  ├─ src/controllers/   HTTP request/response
│  ├─ src/db/            pool, request, transaction
│  ├─ src/docs/          OpenAPI 3.0.3
│  ├─ src/dtos/          bentuk response
│  ├─ src/errors/        error HTTP
│  ├─ src/middlewares/   auth, RBAC, validasi, CORS, error handler
│  ├─ src/repositories/  query SQL Server
│  ├─ src/routes/        pemetaan endpoint
│  ├─ src/schemas/       validasi Zod
│  ├─ src/services/      aturan bisnis dan ownership
│  └─ src/index.ts       entrypoint Express
└─ frontend/
   └─ src/
      ├─ components/     layout, form, dialog, UI
      ├─ context/        AuthProvider
      ├─ lib/            Axios client, API, style, format, route helper
      ├─ pages/          halaman publik/customer/owner/admin
      └─ types/          tipe data API
```

## Fitur

### Publik

- Daftar warung dengan pencarian nama/kategori.
- Detail warung, menu, rating, dan review.
- Register customer dan login.
- Restore sesi lewat `GET /api/auth/me`.

### Customer

- Membuat, mengubah, dan menghapus review milik sendiri.
- Like/unlike review.
- Melaporkan review.
- Memperbarui profil dan mengganti password.

### Owner

- Melihat warung milik sendiri.
- Mengubah dan menghapus warung milik sendiri.
- CRUD menu pada warung milik sendiri.
- Menghapus review pada warung milik sendiri.

### Admin

- Melihat semua user, membuat akun owner, mengubah role.
- CRUD semua warung.
- Melihat dan menindaklanjuti flag.
- Menghapus review.
- Melihat audit log.

## Autentikasi dan Otorisasi

- Login mengirim JWT melalui `Set-Cookie` dengan nama `kantin_session`.
- Cookie bersifat HttpOnly, `SameSite=Lax`, `Path=/`, dan `Secure` hanya saat production.
- Frontend memakai Axios `withCredentials: true`; tidak ada token di localStorage/sessionStorage.
- `401` berarti belum login atau cookie tidak valid/kedaluwarsa.
- `403` berarti role atau ownership tidak sesuai; frontend **tidak** menghapus sesi saat menerima 403.
- Hanya respons 401 dari endpoint selain login/register/me yang memicu reset sesi di frontend.
- Password lama yang salah pada endpoint ganti password menghasilkan `400`, bukan 401.

### Matriks RBAC

| Resource | Admin | Owner | Customer |
|---|---|---|---|
| Register publik | - | - | customer |
| Buat owner/ubah role | ya | tidak | tidak |
| Lihat warung/menu/review | ya | ya | ya |
| Buat warung | semua | tidak | tidak |
| Ubah/hapus warung | semua | milik sendiri | tidak |
| CRUD menu | semua | warung milik sendiri | tidak |
| Review | hapus semua | hapus review warung sendiri | CRUD review sendiri |
| Like/unlike | tidak | tidak | ya |
| Flag review | lihat/ubah status | tidak | buat |
| Audit log | ya | tidak | tidak |
| Profil sendiri | ya | ya | ya |

## Endpoint

Base URL: `http://localhost:3000/api`

| Method | Path | Akses |
|---|---|---|
| POST | `/auth/register` | publik |
| POST | `/auth/login` | publik |
| GET | `/auth/me` | login |
| POST | `/auth/logout` | publik (hapus cookie) |
| GET | `/profile` | login |
| PUT | `/profile` | login |
| PATCH | `/profile/password` | login |
| GET | `/users` | admin |
| POST | `/users/owner` | admin |
| PATCH | `/users/:id/role` | admin |
| GET | `/stalls` | publik |
| GET | `/stalls/:id` | publik |
| POST | `/stalls` | admin |
| PUT | `/stalls/:id` | admin/owner pemilik |
| DELETE | `/stalls/:id` | admin/owner pemilik |
| GET | `/menu` | publik |
| GET | `/menu/:id` | publik |
| POST | `/menu` | admin/owner pemilik |
| PUT | `/menu/:id` | admin/owner pemilik |
| DELETE | `/menu/:id` | admin/owner pemilik |
| GET | `/stalls/:id/reviews` | publik, cookie opsional |
| POST | `/stalls/:id/reviews` | customer |
| GET | `/reviews/mine` | customer |
| GET | `/reviews/manage` | admin/owner |
| PUT | `/reviews/:id` | customer pemilik |
| DELETE | `/reviews/:id` | admin/owner warung/customer pemilik |
| POST | `/reviews/:id/like` | customer |
| DELETE | `/reviews/:id/like` | customer |
| POST | `/reviews/:id/flags` | customer |
| GET | `/flags` | admin |
| PATCH | `/flags/:id` | admin |
| GET | `/audit-logs` | admin |

Endpoint tambahan:

- `GET /health`
- `GET /api-docs`
- `GET /api-docs/openapi.json`

Format sukses:

```json
{ "status": "success", "data": {} }
```

Format error:

```json
{
  "status": "fail",
  "message": "Validasi request gagal",
  "errors": [{ "field": "rating", "message": "rating minimal 1" }]
}
```

## Environment

### Backend

Salin `backend/.env.example` menjadi `backend/.env`, lalu isi kredensial database dan JWT secret. Jangan commit `.env`.

```dotenv
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
AUTH_COOKIE_NAME=kantin_session

DB_SERVER=localhost
DB_PORT=1433
DB_USER=...
DB_PASSWORD=...
DB_NAME=review_kantin
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

JWT_SECRET=...
JWT_EXPIRES_IN=2h
BCRYPT_SALT_ROUNDS=10
```

`CORS_ORIGIN` harus sama persis dengan origin frontend, termasuk host dan port. Jika frontend dibuka lewat `127.0.0.1:5173`, jangan isi `CORS_ORIGIN` dengan `localhost:5173`.

### Frontend

Salin `frontend/.env.example` menjadi `frontend/.env`:

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api
```

## Menjalankan

```bash
# backend
cd backend
npm install
npm run typecheck
npm run dev

# frontend (terminal lain)
cd frontend
npm install
npm run lint
npm run build
npm run dev
```

Swagger UI: `http://localhost:3000/api-docs`

Untuk Swagger, login terlebih dahulu melalui endpoint login agar browser menyimpan cookie. Gunakan `withCredentials` pada UI. Request mutasi dari origin frontend harus sesuai `CORS_ORIGIN`.

## Catatan Database

- Schema mengikuti `pertemuan-03-database-backend-crud/db/02-schema.sql`.
- Seed mengikuti `03-seed.sql`; hash password awal adalah placeholder.
- Patch hash Pertemuan 05 hanya menyentuh `admin@kantin.test`, `tini@kantin.test`, dan `bagas@student.test`.
- Jangan mereset database untuk hands-on ini. Gunakan akun yang sudah ada.
- Jangan menganggap password seed tertentu valid sebelum login manual berhasil.
- Drizzle schema tidak menyatakan cascade/unique. Penghapusan data anak dilakukan eksplisit dalam transaksi.
- `avg_rating`, `review_count`, dan `like_count` dihitung ulang setelah mutasi terkait.

## Skenario Uji Manual

1. Buka daftar dan detail warung tanpa login.
2. Register customer, pastikan cookie terpasang dan sesi pulih setelah reload.
3. Customer membuat review, mengedit, lalu menghapus; cek rating warung berubah.
4. Customer like dan unlike; cek `like_count` dan status tombol.
5. Customer melaporkan review.
6. Customer mencoba `POST /api/stalls` atau `POST /api/menu`; harus 403, sesi tetap aktif.
7. Owner mengubah/menghapus warung dan mengelola menu miliknya; mencoba resource owner lain harus 403.
8. Admin membuat owner, mengubah role, CRUD warung, memproses flag, dan menghapus review.
9. Admin menghapus warung; pastikan menu/review/like/flag terkait ikut terhapus tanpa error FK.
10. Hapus cookie atau gunakan token kedaluwarsa; endpoint terproteksi harus 401 dan frontend mengarahkan ke login.
11. Cek audit log muncul untuk mutasi admin/owner/customer yang relevan.
12. Uji Swagger: login, lalu jalankan endpoint terproteksi.

## Keterbatasan

- Belum ada automated test. Verifikasi runtime tetap perlu dijalankan manual.
- Belum ada pagination untuk user, review, flag, dan audit log.
- CRUD menu oleh admin tersedia melalui API/Swagger; dashboard admin memprioritaskan user, warung, moderasi, dan audit.
- Belum ada token revocation/versioning. Cookie yang sudah dicuri tetap valid sampai `exp`, termasuk setelah ganti password; ganti password hanya menghapus cookie pada browser saat ini.
- Proteksi duplicate review/like mengandalkan pengecekan aplikasi dan unique constraint database. Jika constraint tidak ada, dua request bersamaan masih mungkin lolos; aplikasi memetakan error unique/FK SQL Server ke 409.
- Audit log ditulis setelah operasi utama pada beberapa alur; kegagalan audit dapat membuat respons gagal meski mutasi sudah terjadi.
- CORS hanya mengizinkan satu origin frontend.
- Tidak ada upload gambar, notifikasi real-time, atau refresh token.
- Perubahan schema/seed di luar scope tidak dilakukan.
