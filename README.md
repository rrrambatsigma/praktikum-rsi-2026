# Starter Praktikum RSI - Pertemuan 09

Titik awal Hands-on Pertemuan 09. Backend audit dan API client sudah lengkap. Satu halaman frontend yang perlu dikerjakan ditandai komentar `TODO`.

## Isi

```text
pertemuan-09-audit-log-system/
├─ db/                                  # skema, index, dan seed audit
└─ hands-on-1-audit-log/
   ├─ backend/                          # lengkap
   └─ frontend/                         # berisi TODO
```

## Menjalankan

1. Buka SSMS, connect ke `review_kantin`, lalu jalankan `db/01-audit-log-schema.sql` dan `db/02-audit-seed.sql` berurutan dengan F5.
2. Masuk ke folder backend atau frontend, salin `.env.example` menjadi `.env`, lalu:

```bash
npm install
npm run dev
```

Backend berjalan di `http://localhost:3003`, frontend di `http://localhost:5175`.

Panduan lengkap, akun demo, dan alur pengujian ada di [`hands-on-1-audit-log/README.md`](pertemuan-09-audit-log-system/hands-on-1-audit-log/README.md).
