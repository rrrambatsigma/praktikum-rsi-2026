> **Branch starter.** Backend sudah lengkap. Lengkapi bagian frontend yang ditandai `TODO`.
>
> File yang perlu dikerjakan:
> - `frontend/src/lib/api.ts`: `getMenus`, `getMenuById`, `getStalls`, `createMenu`, `updateMenu`, `deleteMenu`
> - `frontend/src/hooks/useMenuData.ts`: state loading, error, dan efek fetch

# Maem Bolo - Hands-On 1 Integrasi Fetch API

Aplikasi dashboard manajemen menu kantin untuk Pertemuan 07. Frontend React memanggil backend Express melalui Fetch API, kemudian backend membaca dan menulis data ke SQL Server. Backend juga menyediakan dokumentasi REST API interaktif melalui OpenAPI dan Swagger UI.

## Tujuan Praktikum

Setelah menyelesaikan hands-on ini, mahasiswa diharapkan mampu:

1. Menjelaskan alur request frontend ke backend sampai database.
2. Menggunakan Fetch API untuk `GET`, `POST`, `PUT`, dan `DELETE`.
3. Mengelola state loading, error, empty, dan sukses di React.
4. Mengirim dan menerima data JSON dengan format yang konsisten.
5. Menangani validasi di frontend dan backend.
6. Memahami peran CORS dalam integrasi frontend dan backend.
7. Menampilkan data relasi menu dan warung dari SQL Server.
8. Menggunakan dokumentasi OpenAPI melalui Swagger UI untuk mencoba endpoint secara manual.

## Design System

Arah visual Maem Bolo adalah **Warm Editorial + Modern SaaS Dashboard**: hangat, profesional, terstruktur, dan mengutamakan keterbacaan data.

### Font

Seluruh frontend memakai **Plus Jakarta Sans** dari Google Fonts dengan fallback:

```text
"Plus Jakarta Sans", Inter, system-ui, sans-serif
```

Hierarki tipografi:

- Judul halaman: 28-32 px, weight 700-800.
- Judul bagian: 18-20 px, weight 600-700.
- Angka statistik: 28 px, weight 700.
- Body: 14 px, weight 400-500.
- Label dan metadata: 12-13 px.
- Tabel: 13-14 px.

### Palet Warna

Token didefinisikan di `frontend/src/index.css` melalui `@theme` Tailwind CSS v4.

| Token | Nilai | Penggunaan |
|---|---|---|
| `--color-primary` | `#B94716` | Tombol utama, aksen, fokus, elemen aktif |
| `--color-primary-hover` | `#96380F` | Hover tombol utama |
| `--color-primary-dark` | `#87320F` | Aksen gelap dan penekanan |
| `--color-page` | `#FFF8F3` | Background halaman |
| `--color-surface` | `#FFFFFF` | Kartu, tabel, dialog, panel |
| `--color-surface-muted` | `#FFF1E7` | Background aksen ringan |
| `--color-text` | `#29231F` | Teks utama |
| `--color-text-muted` | `#796D65` | Subtitle dan metadata |
| `--color-border` | `#EDE1D8` | Border dan divider |
| `--color-success` | `#18794E` | Status berhasil dan tersedia |
| `--color-success-bg` | `#E6F5EC` | Background badge berhasil |
| `--color-danger` | `#C43232` | Hapus, error, status habis |
| `--color-danger-bg` | `#FDECEC` | Background badge error |
| `--color-warning` | `#946200` | Peringatan |
| `--color-warning-bg` | `#FFF4D6` | Background badge peringatan |

### Spacing, Radius, dan Shadow

- Spacing mengikuti basis 4 px.
- Input dan tombol memakai radius 10 px.
- Kartu dan panel memakai radius 12 px.
- Dialog memakai radius 16 px.
- Badge memakai radius penuh.
- Shadow dibuat halus melalui token `--shadow-card` dan `--shadow-dialog`.

## Teknologi

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS v4 melalui `@tailwindcss/vite`
- Lucide React
- Fetch API bawaan browser

### Backend

- Express 5
- TypeScript
- `mssql`
- `dotenv`
- OpenAPI 3.0.3
- Swagger UI melalui `swagger-ui-express`

Tidak ada Axios, React Query, autentikasi, JWT, session, atau API key pada hands-on ini.

## Struktur Project

```text
hands-on-1-integrasi-fetch-api/
├─ backend/
│  ├─ src/
│  │  ├─ config/
│  │  ├─ controllers/
│  │  ├─ db/
│  │  ├─ docs/
│  │  │  └─ openapi.ts
│  │  ├─ dtos/
│  │  ├─ errors/
│  │  ├─ middlewares/
│  │  ├─ repositories/
│  │  ├─ routes/
│  │  ├─ schemas/
│  │  ├─ services/
│  │  └─ index.ts
│  ├─ .env.example
│  ├─ package.json
│  └─ tsconfig.json
├─ frontend/
│  ├─ public/
│  ├─ src/
│  │  ├─ components/
│  │  ├─ hooks/
│  │  ├─ lib/
│  │  ├─ types/
│  │  ├─ App.tsx
│  │  ├─ index.css
│  │  └─ main.tsx
│  ├─ .env.example
│  ├─ package.json
│  ├─ README.md
│  └─ vite.config.ts
└─ README.md
```

## Prasyarat

- Node.js minimal versi 22.18.0.
- npm.
- SQL Server aktif.
- Database `review_kantin` sudah dibuat.
- Tabel dan seed dari Pertemuan 03 sudah dijalankan.
- Port `3000` dan `5173` tersedia.

## Persiapan Database

Tabel yang digunakan:

### `MENU_ITEMS`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INT IDENTITY | Primary key |
| `stall_id` | INT | Foreign key ke `STALLS.id` |
| `name` | NVARCHAR(100) | Nama menu |
| `price` | INT | Harga dalam rupiah |
| `is_available` | BIT | Status ketersediaan |

### `STALLS`

Digunakan untuk mengambil nama warung dan mengisi dropdown warung pada form menu.

Seed Pertemuan 03 berisi 10 warung dan 20 menu.

Jika database belum siap, jalankan script berikut dari root repository melalui SSMS atau `sqlcmd`:

```powershell
sqlcmd -S localhost -E -i pertemuan-03-database-backend-crud\db\01-create-database-and-user.sql
sqlcmd -S localhost -E -i pertemuan-03-database-backend-crud\db\02-schema.sql
sqlcmd -S localhost -E -i pertemuan-03-database-backend-crud\db\03-seed.sql
```

## Setup Backend

Masuk ke folder backend:

```powershell
cd pertemuan-07-integrasi-fe-be\hands-on-1-integrasi-fetch-api\backend
```

Salin environment:

```powershell
Copy-Item .env.example .env
```

Sesuaikan `.env` dengan kredensial SQL Server yang dibuat pada Pertemuan 03:

```env
PORT=3000
CORS_ORIGIN=http://localhost:5173

DB_SERVER=localhost
DB_PORT=1433
DB_USER=praktikum_user
DB_PASSWORD=ubah_password_database
DB_NAME=review_kantin
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

Install dependency dan jalankan:

```powershell
npm install
npm run dev
```

Perintah lain:

```powershell
npm run start
```

`start` menjalankan server sekali. `dev` menjalankan `tsx watch`.

Cek koneksi server dan database:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

Respons yang diharapkan:

```json
{
  "status": "success",
  "message": "Server dan database terhubung",
  "database": {
    "ok": 1
  },
  "timestamp": "2026-10-24T08:00:00.000Z"
}
```

Jika database gagal dihubungi, server mencatat detail error di terminal dan mengirim pesan generik ke client.

## Setup Frontend

Buka terminal baru dari folder frontend:

```powershell
cd pertemuan-07-integrasi-fe-be\hands-on-1-integrasi-fetch-api\frontend
```

Salin environment:

```powershell
Copy-Item .env.example .env
```

Isi `.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Install dependency dan jalankan:

```powershell
npm install
npm run dev
```

Buka alamat yang ditampilkan Vite, biasanya:

```text
http://localhost:5173
```

Perintah frontend lain:

```powershell
npm run build
npm run lint
npm run preview
```

Tailwind dikonfigurasi melalui plugin `@tailwindcss/vite` dan token `@theme` di `src/index.css`. Tidak ada file `tailwind.config.js`.

## URL Aplikasi

| Layanan | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend | `http://localhost:3000` |
| Health check | `http://localhost:3000/health` |
| Swagger UI | `http://localhost:3000/api-docs` |
| OpenAPI JSON | `http://localhost:3000/api-docs/openapi.json` |

Jika `PORT` backend diubah, sesuaikan URL backend, Swagger UI, dan `VITE_API_BASE_URL`.

## Environment

### Backend

| Variable | Default | Keterangan |
|---|---|---|
| `PORT` | `3000` | Port backend |
| `CORS_ORIGIN` | `http://localhost:5173` | Origin frontend yang diizinkan |
| `DB_SERVER` | `localhost` | Host SQL Server |
| `DB_PORT` | `1433` | Port SQL Server |
| `DB_USER` | wajib | User database |
| `DB_PASSWORD` | wajib | Password database |
| `DB_NAME` | wajib | Nama database |
| `DB_ENCRYPT` | `false` | Enkripsi koneksi |
| `DB_TRUST_SERVER_CERTIFICATE` | `false` jika tidak diisi | Trust certificate lokal |

Untuk SQL Server lokal, biasanya `DB_ENCRYPT=false` dan `DB_TRUST_SERVER_CERTIFICATE=true`.

### Frontend

| Variable | Default | Keterangan |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:3000/api` | Base URL API |

Jika mengubah `.env`, restart server backend atau Vite.

## API

Base URL:

```text
http://localhost:3000/api
```

### Endpoint

| Method | Endpoint | Status sukses | Status error | Keterangan |
|---|---|---|---|---|
| GET | `/health` | `200` | `500` | Health check server dan database |
| GET | `/api/menu` | `200` | `500` | Semua menu |
| GET | `/api/menu/:id` | `200` | `400`, `404`, `500` | Detail menu |
| POST | `/api/menu` | `201` | `400`, `404`, `409`, `500` | Tambah menu |
| PUT | `/api/menu/:id` | `200` | `400`, `404`, `409`, `500` | Ubah menu |
| DELETE | `/api/menu/:id` | `204` | `400`, `404`, `500` | Hapus menu |
| GET | `/api/stalls` | `200` | `500` | Daftar warung |

### Format Sukses

```json
{
  "status": "success",
  "data": {}
}
```

### Format Error

```json
{
  "status": "fail",
  "message": "Validasi gagal",
  "errors": [
    {
      "field": "price",
      "message": "price wajib berupa bilangan bulat minimal 0"
    }
  ]
}
```

Error `404`, `409`, dan `500` tidak selalu memiliki field `errors`.

### Payload Create dan Update

```json
{
  "stallId": 1,
  "name": "Kwetiau Goreng Spesial",
  "price": 15000,
  "isAvailable": true
}
```

Aturan validasi:

- `stallId` harus bilangan bulat positif dan harus ada di tabel `STALLS`.
- `name` wajib, 2 sampai 100 karakter.
- `price` harus bilangan bulat minimal 0 dan maksimal 1.000.000.000.
- `isAvailable` harus boolean; pada `POST` boleh dihilangkan dan default-nya `true`.
- `PUT` memakai payload lengkap.

### Contoh Request PowerShell

Ambil semua menu:

```powershell
Invoke-RestMethod http://localhost:3000/api/menu
```

Ambil semua warung:

```powershell
Invoke-RestMethod http://localhost:3000/api/stalls
```

Tambah menu:

```powershell
$body = @{
  stallId = 1
  name = 'Es Jeruk'
  price = 5000
  isAvailable = $true
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:3000/api/menu `
  -ContentType 'application/json' `
  -Body $body
```

Ubah menu:

```powershell
$body = @{
  stallId = 1
  name = 'Es Jeruk Manis'
  price = 6000
  isAvailable = $false
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Put `
  -Uri http://localhost:3000/api/menu/21 `
  -ContentType 'application/json' `
  -Body $body
```

Hapus menu:

```powershell
Invoke-RestMethod -Method Delete -Uri http://localhost:3000/api/menu/21
```

## Swagger UI

Swagger UI tersedia setelah backend berjalan:

```text
http://localhost:3000/api-docs
```

Spesifikasi OpenAPI mentah dapat diakses di:

```text
http://localhost:3000/api-docs/openapi.json
```

Spesifikasi berada di `backend/src/docs/openapi.ts` dan dibangun tanpa query database. Halaman dokumentasi tetap dapat dibuka tanpa koneksi database; koneksi baru dibutuhkan saat menjalankan endpoint melalui tombol `Try it out`.

Cara menggunakan:

1. Jalankan backend dan pastikan database siap.
2. Buka `http://localhost:3000/api-docs`.
3. Pilih salah satu endpoint, misalnya `POST /api/menu`.
4. Klik `Try it out`.
5. Isi request body JSON.
6. Klik `Execute`.
7. Periksa status code dan response yang ditampilkan Swagger UI.

Endpoint yang didokumentasikan:

- `GET /health`
- `GET /api/menu`
- `GET /api/menu/{id}`
- `POST /api/menu`
- `PUT /api/menu/{id}`
- `DELETE /api/menu/{id}`
- `GET /api/stalls`

Tidak ada autentikasi pada dokumentasi maupun endpoint.

## Alur Hands-On

1. Pastikan database dan seed sudah siap.
2. Jalankan backend dengan `npm run dev`.
3. Buka `http://localhost:3000/health` dan pastikan database terhubung.
4. Buka `http://localhost:3000/api-docs` dan pelajari kontrak endpoint.
5. Uji `GET /api/menu` dan `GET /api/stalls` melalui Swagger UI atau terminal.
6. Jalankan frontend dengan `npm run dev`.
7. Amati proses GET saat halaman pertama kali dimuat.
8. Klik `Tambah Menu`, isi form, lalu simpan.
9. Periksa request `POST /api/menu` dan perubahan tabel.
10. Klik `Edit` pada salah satu menu, ubah data, lalu simpan.
11. Periksa request `PUT /api/menu/:id`.
12. Klik `Hapus`, coba tombol batal, lalu ulangi dan konfirmasi.
13. Periksa request `DELETE /api/menu/:id` dan status `204`.
14. Coba validasi nama kosong, harga negatif, dan warung tidak valid.
15. Matikan backend lalu klik muat ulang untuk melihat error state.
16. Selesaikan checklist di bawah.

## Uji Manual

| No | Skenario | Hasil yang Diharapkan |
|---|---|---|
| 1 | Buka frontend | Data menu seed tampil |
| 2 | Cari nama menu | Daftar terfilter |
| 3 | Filter warung | Hanya menu warung tersebut yang tampil |
| 4 | Filter status habis | Hanya menu tidak tersedia yang tampil |
| 5 | Tambah menu valid | Toast sukses dan menu baru muncul |
| 6 | Tambah menu tanpa nama | Pesan validasi muncul di form |
| 7 | Tambah menu dengan harga negatif | Pesan validasi muncul di form |
| 8 | Edit menu | Form terisi data lama |
| 9 | Simpan edit | Data berubah tanpa reload penuh |
| 10 | Hapus lalu batal | Data tetap ada |
| 11 | Hapus lalu konfirmasi | Data hilang dan toast sukses muncul |
| 12 | Backend dimatikan | Error state dan tombol coba lagi muncul |
| 13 | `GET /health` | Status sukses dan database `ok: 1` |
| 14 | `DELETE` berhasil | Response `204 No Content` |
| 15 | Swagger UI | Halaman dokumentasi terbuka dan endpoint aktual tampil |
| 16 | `Try it out` GET menu | Response JSON tampil di Swagger UI |
| 17 | Request dari origin lain | Browser menolak response karena CORS |

## Troubleshooting

### `Tidak dapat terhubung ke server`

Backend belum berjalan, port salah, atau `VITE_API_BASE_URL` tidak sesuai. Jalankan backend dan periksa konfigurasi frontend.

### `Login failed for user`

Periksa `DB_USER` dan `DB_PASSWORD` di `backend/.env`.

### Gagal terhubung ke SQL Server

Periksa:

- SQL Server sedang berjalan.
- TCP/IP aktif.
- Port `1433` benar.
- `DB_SERVER` sesuai.
- `DB_ENCRYPT` dan `DB_TRUST_SERVER_CERTIFICATE` sesuai konfigurasi lokal.

### `Invalid object name 'dbo.MENU_ITEMS'`

Schema belum dijalankan. Jalankan script Pertemuan 03.

### CORS error

Middleware CORS mengirim header `Access-Control-Allow-Origin` sesuai `CORS_ORIGIN`. Browser akan menolak response jika origin frontend berbeda. Pastikan `CORS_ORIGIN` sama dengan origin frontend, misalnya `http://localhost:5173`, lalu restart backend.

### Swagger UI tidak muncul

Pastikan:

- Dependency sudah terpasang dengan `npm install` di folder backend.
- Backend berjalan.
- URL yang dibuka adalah `http://localhost:3000/api-docs`.
- `PORT` backend sesuai.

### Swagger UI terbuka tetapi `Try it out` gagal

Halaman dokumentasi tidak membutuhkan database, tetapi endpoint membutuhkannya. Pastikan SQL Server aktif, database `review_kantin` siap, dan kredensial `.env` benar.

### Perubahan `.env` tidak terbaca

Restart server backend atau Vite.

### Tailwind tidak berjalan

Pastikan:

- `@tailwindcss/vite` terpasang.
- Plugin `tailwindcss()` ada di `vite.config.ts`.
- `src/index.css` diawali `@import "tailwindcss";`.
- `index.css` diimport oleh `main.tsx`.

### Font Plus Jakarta Sans tidak tampil

Pastikan koneksi ke Google Fonts tersedia. Jika tidak, browser memakai fallback Inter atau `system-ui`.

### Ikon lucide tidak ditemukan

Jalankan `npm install` di folder frontend setelah memperbarui `package.json`.

### Port sudah digunakan

Ubah `PORT` di backend atau jalankan Vite dengan port lain:

```powershell
npm run dev -- --port 5174
```

Jika port frontend diubah, sesuaikan `CORS_ORIGIN` di backend.

## Checklist Hasil

- [ ] Backend berjalan di port 3000.
- [ ] `/health` berhasil.
- [ ] Swagger UI terbuka di `/api-docs`.
- [ ] Spesifikasi OpenAPI dapat diakses di `/api-docs/openapi.json`.
- [ ] `GET /api/menu` mengembalikan data menu.
- [ ] `GET /api/stalls` mengembalikan data warung.
- [ ] Frontend berjalan di port 5173.
- [ ] Plus Jakarta Sans tampil.
- [ ] Menu tampil dalam tabel desktop dan card mobile.
- [ ] Create menu berhasil.
- [ ] Update menu berhasil.
- [ ] Delete menu berhasil.
- [ ] Validasi frontend berjalan.
- [ ] Validasi backend berjalan.
- [ ] Loading state tampil.
- [ ] Empty state tampil.
- [ ] Error state dan retry tampil.
- [ ] Toast sukses tampil dan error operasi tampil inline.
- [ ] CORS berjalan.
- [ ] Tidak ada penggunaan Axios.

## Catatan Keamanan

Hands-on ini sengaja tidak memakai autentikasi dan otorisasi. Seluruh endpoint dapat diakses tanpa login. Konfigurasi ini hanya untuk pembelajaran dan tidak boleh dipakai langsung di produksi.

Jangan commit file `.env` yang berisi kredensial asli. Gunakan `.env.example` sebagai template.

## Tantangan Lanjutan

1. Tambahkan endpoint pencarian dan filter di backend.
2. Tambahkan pagination.
3. Tambahkan upload gambar menu.
4. Tambahkan autentikasi pemilik warung.
5. Tambahkan optimistic update di frontend.
6. Tambahkan automated test untuk endpoint CRUD.
