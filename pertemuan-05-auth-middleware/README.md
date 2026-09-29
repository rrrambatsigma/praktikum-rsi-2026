# Pertemuan 05 — Autentikasi & Middleware

Hashing password dengan **bcrypt**, autentikasi **JWT** (register, login, verifikasi
token), lalu **middleware** `authenticate` + `authorize` yang membedakan 401 dan 403 di
seluruh endpoint. Lanjutan dari pertemuan-04 (`hands-on-2-dokumentasi-swagger-openapi`).
Panduan materi: `/meetings/05-auth-middleware`.

## Prasyarat

- Node.js **>= 22.18.0** dan npm
- SQL Server aktif + database `review_kantin` sudah dibuat & di-seed di pertemuan-03
  (folder `db/` ada di `pertemuan-03-database-backend-crud`)
- Jalankan `db/seed-password-hashes.sql` di folder ini **sebelum** hands-on — seed
  pertemuan-03 masih memakai placeholder `N'hash_admin'`, bukan hash bcrypt, jadi
  login pasti gagal tanpa langkah ini
- `hands-on-2` menyalin project `hands-on-1` lalu melanjutkan dari sana

## Daftar Hands-on

| Hands-on | Isi |
| --- | --- |
| [Hands-on 1 — Autentikasi JWT](hands-on-1-autentikasi-jwt) | Register & login, hashing bcrypt, `jsonwebtoken`, `UnauthorizedError`, middleware `authenticate` + `getUser` |
| [Hands-on 2 — Middleware Otorisasi](hands-on-2-middleware-otorisasi) | `authorize(...roles)`, `ForbiddenError`, `ownerId` dihapus dari body, cek kepemilikan objek, review, laporan admin, `bearerAuth` di OpenAPI |

## Alur Pembelajaran

1. **Hands-on 1**: password di-hash dengan bcrypt (salt membuat hash yang sama
   berbeda tiap kali), login mengembalikan token JWT, dan setiap request terlindungi
   diverifikasi tokennya oleh middleware `authenticate`.
2. **Hands-on 2**: identitas dari token dipakai untuk memutuskan **boleh atau tidak**
   — `authorize(...roles)` untuk cek role, cek kepemilikan di service untuk objek
   (`stall`), dan `ownerId`/`userId` dibuang dari body supaya client tidak pernah
   menentukan identitasnya sendiri.

## Catatan

- **401 = tidak tahu siapa kamu** (token hilang, rusak, atau kedaluwarsa).
  **403 = tahu siapa kamu, tapi tidak boleh** (role kurang, atau bukan pemilik objek).
- Identitas selalu berasal dari `req.user`, tidak pernah dari body. Middleware
  `validate` juga menolak kunci tak dikenal dengan `.strict()`.
- Urutan middleware di route terlindungi: `authenticate` → `authorize` → `validate`,
  supaya request tanpa token selalu 401 apa pun isi body-nya.
- Akun seed untuk mencoba: `admin@kantin.test` (admin), `tini@kantin.test` (owner),
  `bagas@student.test` (customer) — semuanya password `rahasia123`.
- Setiap hands-on berdiri sendiri: `cd` ke foldernya, `npm install`, `npm run dev`.
- Drizzle untuk MSSQL masih RC (`drizzle-orm@1.0.0-rc.5-5935859`) — sama seperti
  pertemuan-03 dan 04.