# Starter Pertemuan 05 — Autentikasi & Middleware

Branch ini berisi **titik awal** praktikum Pertemuan 05, bukan versi jadi. Semua langkah
pengerjaan ada di situs materi pertemuan 5.

## Isi

```
pertemuan-05-auth-middleware/
├─ db/
│  └─ seed-password-hashes.sql          # jalankan sekali sebelum Hands-on 1
├─ hands-on-1-autentikasi-jwt/          # titik awal Hands-on 1 (= hasil Pertemuan 04 Hands-on 2)
└─ hands-on-2-middleware-otorisasi/     # titik awal Hands-on 2 (= hasil Hands-on 1)
```

Hands-on 1 dimulai dari project yang belum punya autentikasi sama sekali. Hands-on 2 dimulai
dari project yang sudah punya register/login dan token JWT, tetapi token itu belum dipakai.

## Cara pakai

1. Pilih folder hands-on yang sedang dikerjakan, misalnya:
   ```
   cd pertemuan-05-auth-middleware/hands-on-1-autentikasi-jwt
   ```
2. Install dependensi:
   ```
   npm install
   ```
3. Buat file `.env` dari contoh:
   ```
   cp .env.example .env
   ```
4. Jalankan server:
   ```
   npm run dev
   ```

## Prasyarat database

Database `review_kantin` dari Pertemuan 03 harus sudah dibuat dan di-seed. Sebelum mengerjakan
Hands-on 1, jalankan juga skrip `pertemuan-05-auth-middleware/db/seed-password-hashes.sql`
agar akun seed (`admin@kantin.test`, `tini@kantin.test`, `bagas@student.test`) bisa login dengan
password `rahasia123`.

Versi jadi dari kedua hands-on ada di branch `main` sebagai referensi.
