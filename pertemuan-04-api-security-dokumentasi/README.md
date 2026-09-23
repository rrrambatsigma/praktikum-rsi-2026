# Pertemuan 04 — API Security & Dokumentasi

Validasi input dan sanitasi (**zod**), error handling terstruktur, lalu dokumentasi
API **OpenAPI 3.0** yang dibangkitkan dari schema zod (`zod-to-openapi`) dan
disajikan di Swagger UI. Lanjutan dari pertemuan-03 (`hands-on-2-orm-drizzle`).
Panduan materi: `/meetings/04-api-security-docs`.

## Prasyarat

- Node.js **>= 22.18.0** dan npm
- SQL Server aktif + database `review_kantin` sudah dibuat & di-seed di pertemuan-03
  (folder `db/` ada di `pertemuan-03-database-backend-crud`)
- `hands-on-2` mengikuti pola validasi/error handling dari `hands-on-1`

## Daftar Hands-on

| Hands-on | Isi |
| --- | --- |
| [Hands-on 1 — Validasi & Error Handling](hands-on-1-validasi-error-handling) | Validasi body/query/params dengan zod, custom error, 404, dan error handler terpusat (tanpa try/catch berkat Express 5) |
| [Hands-on 2 — Dokumentasi Swagger/OpenAPI](hands-on-2-dokumentasi-swagger-openapi) | Spek OpenAPI 3.0 dari schema zod (`zod-to-openapi`), disajikan di Swagger UI `/docs` |

## Alur Pembelajaran

1. **Hands-on 1**: semua input divalidasi (sanitasi `.trim()`, buang kunci tak dikenal,
   coerce + default untuk query), dan semua error memakai respons JSON konsisten
   `{ status, message, errors }` lewat error handler terpusat.
2. **Hands-on 2**: schema zod yang sama ditambah metadata `.openapi()` menjadi
   **satu sumber kebenaran** untuk dokumentasi — validasi & spek tidak bisa melenceng.

## Catatan

- Versi dipatok: `zod` **v3** + `@asteasolutions/zod-to-openapi` **7.3.4**
  (zod v4 memakai zod-to-openapi v8+).
- Setiap hands-on berdiri sendiri: `cd` ke foldernya, `npm install`, lalu `npm run dev`.
- Drizzle untuk MSSQL masih RC (`drizzle-orm@1.0.0-rc.5-5935859`) — sama seperti pertemuan-03.