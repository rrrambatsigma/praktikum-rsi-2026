# Pertemuan 03 — Database, Integrasi Backend & ORM

Recall desain database (ERD) di SQL Server → koneksi backend ke SQL Server →
akses data lewat ORM (Drizzle). Panduan materi: `/meetings/03-database-backend-crud`.

## Prasyarat

- Node.js **>= 22.18.0** dan npm
- SQL Server aktif (default instance `localhost`, atau named instance seperti `.\SQLEXPRESS`)
- Akses Windows Authentication sebagai sysadmin (untuk setup awal)

## Setup Database (sekali saja)

```powershell
sqlcmd -S localhost -E -C -i db\00-setup-mixed-mode.sql          # perlu restart service
sqlcmd -S localhost -E -C -i db\01-create-database-and-user.sql
sqlcmd -S localhost -E -C -i db\02-schema.sql
sqlcmd -S localhost -E -C -i db\03-seed.sql
```

## Daftar Hands-on

| Hands-on | Isi |
| --- | --- |
| [Hands-on 1 — Setup & Koneksi](hands-on-1-setup-koneksi) | Setup database/user + koneksi backend (driver `mssql`) |
| [Hands-on 2 — ORM Drizzle](hands-on-2-orm-drizzle) | CRUD + filter + pagination + join via Drizzle ORM; dokumentasi API (Swagger UI via `swagger-autogen`) di `/docs` |

## Catatan

- Skema DDL dikelola di `db/*.sql` (recall ERD). `src/db/schema.ts` Drizzle ditulis manual
  karena introspeksi (`drizzle-kit pull`) untuk MSSQL masih RC dan belum stabil.
- Setiap hands-on berdiri sendiri: `cd` ke foldernya, lalu `npm install` & `npm run dev`.
