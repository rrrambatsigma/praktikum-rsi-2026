> **Branch starter.** Backend sudah lengkap. Lengkapi bagian frontend yang ditandai `TODO`.
>
> File yang perlu dikerjakan:
> - `frontend/src/lib/errors.ts`: `toApiError` dan `getFieldErrors`
> - `frontend/src/lib/http.ts`: response interceptor untuk `401`
> - `frontend/src/lib/api.ts`: `createMenu`, `updateMenu`, `deleteMenu`, `register`, `createOrder`, `updateOrderStatus`
> - `frontend/src/lib/validation.ts`: `passwordChecks`, `validateRegisterForm`, `validateCheckoutForm`
> - `frontend/src/components/ProtectedRoute.tsx`: guard sesi dan role

# Hands-on 2 - Centralized Error Handling, RBAC, dan Checkout

Hands-on kedua Pertemuan 08. Fokusnya bukan lagi satu form, tetapi satu alur aplikasi utuh: **register customer, login multi-role, routing berbasis role, CRUD menu owner, checkout customer, pemantauan order admin, dan penanganan error yang terpusat**.

Folder ini sengaja terpisah dari `hands-on-1-form-validation`. Source Hands-on 1 tidak diubah.

## Tujuan Pembelajaran

1. Membedakan autentikasi (siapa kamu) dan otorisasi (apa yang boleh kamu lakukan).
2. Membuat registrasi customer tanpa memberi kesempatan memilih role dari client.
3. Menerapkan password policy di frontend dan backend.
4. Menampilkan toast sukses register dan login secara terpisah.
5. Menerapkan RBAC di route frontend dan endpoint backend.
6. Menerapkan object-level authorization pada CRUD menu owner.
7. Membuat checkout dengan transaksi database dan total yang dihitung server.
8. Menormalisasi error Axios ke satu kontrak error.
9. Menyertakan `requestId` agar error pengguna bisa dilacak di log server.
10. Menerapkan least privilege: admin memproses status order, tetapi tidak mengubah isi order, menu, atau akun.

## Ruang Lingkup

### Core yang diimplementasikan

| Area | Perilaku |
|---|---|
| Register | Hanya customer. Role tidak boleh dikirim client. |
| Login | Customer, owner, dan admin. Redirect sesuai role. |
| Password policy | 8–72 karakter, mengandung huruf dan angka, konfirmasi sama. |
| Toast | Register sukses → toast, lalu ke login. Login sukses → toast terpisah. |
| RBAC frontend | Customer → katalog/checkout; owner → dashboard; admin → order. |
| RBAC backend | Setiap endpoint diperiksa `authenticate` + `authorize`. |
| Menu owner | Create, read, update, delete hanya untuk menu warung miliknya. |
| Checkout | Customer memilih menu, mengisi data penerima, membuat satu order/struk. |
| Tiket warung | Item order menyimpan snapshot warung; customer melihat satu struk berisi bagian per warung, owner hanya melihat item warungnya. |
| Perhitungan total | Server membaca harga dari database; harga/total dari client diabaikan. |
| Admin | Melihat semua order, melihat detail item per warung, dan mengubah status `confirmed` menjadi `completed` atau `cancelled`. |
| Error | `code`, `message`, `errors[]`, `requestId`, status HTTP konsisten. |
| HTTP client | Axios dengan `withCredentials` dan normalisasi error. |

### Optional yang tidak termasuk core

- Riwayat order customer.
- Kelola warung dan assign owner dari UI admin.
- Moderasi semua menu dan kelola akun user dari UI admin.
- Halaman profil.
- Error boundary React.
- Panel pengujian error di UI.
- Pagination dan filter order.

## Prasyarat

- Node.js >= 22.18 dan npm.
- SQL Server aktif di `localhost:1433`.
- Database `review_kantin` dan schema Pertemuan 03 sudah ada.
- SQL Server Management Studio (SSMS).

## Mulai Cepat

### 1. Siapkan database lewat SSMS

Buka SSMS, connect ke instance SQL Server yang dipakai di Pertemuan 03. Buka dan jalankan file berikut satu per satu dengan F5, sesuai urutan:

1. `db/01-menu-schema.sql`
2. `db/02-menu-seed.sql`
3. `db/03-auth-seed.sql`
4. `db/04-orders-schema.sql`
5. `db/05-demo-accounts.sql`
6. `db/06-order-stall-snapshot.sql`

Gunakan akun yang punya hak DDL, misalnya `sa` atau admin database. `praktikum_user` hanya punya hak baca/tulis data.

### 2. Backend

```bash
cd pertemuan-08-validasi-error-handling/hands-on-2-centralized-error-handling/backend
cp .env.example .env
# sesuaikan DB_USER, DB_PASSWORD, JWT_SECRET
npm install
npm run typecheck
npm run dev
```

### 3. Frontend

```bash
cd pertemuan-08-validasi-error-handling/hands-on-2-centralized-error-handling/frontend
cp .env.example .env
npm install
npm run lint
npm run build
npm run dev
```

Swagger UI: `http://localhost:3002/api-docs`

## Akun Demo

| Role | Email | Password | Halaman awal |
|---|---|---|---|
| Admin | `admin@kantin.test` | `admin123` | `/admin/orders` |
| Owner | `tini@kantin.test` | `rahasia123` | `/dashboard` |
| Customer | `bagas@student.test` | `rahasia123` | `/` |

Akun demo di atas disiapkan oleh `db/03-auth-seed.sql` dan `db/05-demo-accounts.sql`. Password hanya untuk praktikum.

## Alur Pengguna

### 1. Register customer

- Buka `/register`.
- Isi nama, email, password, dan konfirmasi password.
- Checklist password berubah hijau saat syarat terpenuhi.
- Setelah sukses, backend **tidak** memasang cookie sesi.
- Frontend menampilkan toast “Akun berhasil dibuat”, lalu pindah ke `/login`.
- Toast login baru muncul setelah user benar-benar login.

### 2. Login multi-role

| Role | Setelah login |
|---|---|
| Customer | `/` (katalog) |
| Owner | `/dashboard` |
| Admin | `/admin/orders` |

Jika role membuka halaman role lain, frontend mengarahkan ke `/forbidden`. Backend tetap menolak request yang tidak berhak, jadi membuka URL langsung tidak cukup.

### 3. Owner

- Dashboard hanya menampilkan warung milik owner.
- Form tambah/edit menu hanya menawarkan warung tersebut.
- Backend memeriksa ulang `stallId`; request dengan `stallId` warung orang lain ditolak `403 STALL_FORBIDDEN`.
- Edit/hapus menu memeriksa pemilik menu, bukan hanya role.
- Nama menu duplikat di warung yang sama ditolak `409 MENU_NAME_TAKEN`.
- Menu **Pesanan** menampilkan tiket order yang memuat menu dari warung owner. Item warung lain tidak ikut terlihat.
- Owner tidak dapat mengubah status order; status diproses admin.

### 4. Customer

- Katalog bisa dilihat tanpa login.
- Hanya customer yang bisa menambah ke keranjang dan checkout.
- Checkout mengirim `menuId` dan `quantity`, bukan harga.
- Server membaca harga terbaru, menghitung subtotal/total, lalu menyimpan order + item dalam satu transaksi.
- Menu yang habis ditolak `409 MENU_UNAVAILABLE`.
- Setelah sukses, halaman menampilkan satu kode order dan toast sukses.
- Jika keranjang berisi menu dari beberapa warung, struk customer tetap satu, tetapi item dikelompokkan per warung. Setiap warung menerima tiket itemnya sendiri.

### 5. Admin

- Admin melihat tabel semua order dan dapat membuka detail item yang dikelompokkan per warung.
- Admin dapat memproses status order: `confirmed` menjadi `completed` atau `cancelled`.
- Status yang sudah final tidak dapat diubah lagi (`409 ORDER_STATUS_FINAL`).
- Admin tidak dapat mengubah item, harga, total, menu, warung, atau akun. Ini least privilege untuk peran operasional kantin.

## Ringkasan API

| Method | Path | Akses | Sukses | Fungsi |
|---|---|---|---|---|
| `GET` | `/health` | Publik | `200` | Status server + database |
| `POST` | `/api/auth/register` | Publik | `201` | Daftar customer |
| `POST` | `/api/auth/login` | Publik | `200` | Login semua role + cookie |
| `GET` | `/api/auth/me` | Sesi | `200` | User yang sedang login |
| `POST` | `/api/auth/logout` | Publik | `200` | Hapus cookie sesi |
| `GET` | `/api/stalls` | Publik | `200` | Katalog warung |
| `GET` | `/api/stalls/mine` | Owner | `200` | Warung milik owner |
| `GET` | `/api/menu` | Publik | `200` | Katalog menu |
| `GET` | `/api/menu/:id` | Publik | `200` | Detail menu |
| `POST` | `/api/menu` | Owner | `201` | Tambah menu |
| `PUT` | `/api/menu/:id` | Owner + pemilik | `200` | Ubah menu |
| `DELETE` | `/api/menu/:id` | Owner + pemilik | `204` | Hapus menu |
| `POST` | `/api/orders` | Customer | `201` | Buat pesanan |
| `GET` | `/api/orders/mine` | Owner | `200` | Tiket pesanan untuk warung owner |
| `GET` | `/api/orders` | Admin | `200` | Baca semua pesanan |
| `GET` | `/api/orders/:id` | Admin | `200` | Detail pesanan + item per warung |
| `PATCH` | `/api/orders/:id/status` | Admin | `200` | Ubah status ke `completed`/`cancelled` |
| `POST` | `/api/dev/force-error` | Non-production | `500` | Simulasi error server |
| `GET` | `/api/dev/slow?ms=5000` | Non-production | `200` | Simulasi request lambat |

## Kontrak Error

Semua error memakai bentuk yang sama:

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

`requestId` juga dikirim di header `X-Request-Id`. Di server, id yang sama ditulis ke log saat terjadi error 500.

### Kode error utama

| Kode | Status | Arti |
|---|---|---|
| `VALIDATION_ERROR` | `400` | Payload tidak lolos schema |
| `INVALID_JSON` | `400` | Body bukan JSON valid |
| `UNAUTHORIZED` | `401` | Belum login / kredensial salah |
| `FORBIDDEN` | `403` | Role tidak berhak |
| `STALL_FORBIDDEN` | `403` | Warung bukan milik owner |
| `MENU_FORBIDDEN` | `403` | Menu bukan milik owner |
| `MENU_NOT_FOUND` | `404` | Menu tidak ada |
| `STALL_NOT_FOUND` | `404` | Warung tidak ada |
| `ROUTE_NOT_FOUND` | `404` | Route tidak ada |
| `EMAIL_TAKEN` | `409` | Email sudah terdaftar |
| `MENU_NAME_TAKEN` | `409` | Nama menu duplikat di warung |
| `MENU_UNAVAILABLE` | `409` | Menu sedang habis |
| `INTERNAL_ERROR` | `500` | Error server tak terduga |

## Arsitektur Error Handling

### Backend

| File | Peran |
|---|---|
| `src/middlewares/requestId.ts` | Membuat/meneruskan `requestId`, mengirim header `X-Request-Id` |
| `src/middlewares/validate.ts` | Mengubah `ZodError` menjadi `ValidationError` |
| `src/middlewares/errorHandler.ts` | Satu tempat memetakan `AppError`, JSON rusak, konflik SQL, dan error 500 |
| `src/errors/*` | Kelas error dengan status, kode, pesan, dan detail field |
| `src/routes/*` | Memasang `authenticate`, `authorize`, dan `validateBody` |

Controller tidak menulis `try/catch` untuk setiap error. Error dilempar ke Express dan diolah di `errorHandler`.

### Frontend

| File | Peran |
|---|---|
| `src/lib/http.ts` | Instance Axios, `withCredentials`, timeout, event sesi habis |
| `src/lib/errors.ts` | `ApiError`, normalisasi error Axios, `getFieldErrors` |
| `src/lib/api.ts` | Fungsi endpoint bertipe, membongkar envelope `{ status, data }` |
| `src/lib/validation.ts` | Validasi form register, login, menu, checkout |
| `src/context/ToastContext.tsx` | Satu toast global untuk umpan balik |
| `src/components/ProtectedRoute.tsx` | Guard route berdasarkan login dan role |

Komponen tidak perlu memeriksa `error.response.data`. Semua error sudah berbentuk `ApiError` dengan `status`, `code`, `message`, `details`, dan `requestId`.

## Model Data Checkout

Migrasi `db/04-orders-schema.sql` menambahkan:

- `dbo.ORDERS` — header order: kode, customer, telepon, pembayaran, total, status, waktu.
- `dbo.ORDER_ITEMS` — snapshot item: nama menu, harga satuan, quantity, subtotal.

`ORDER_ITEMS.menu_id` boleh `NULL` dan memakai `ON DELETE SET NULL`. Jika owner menghapus menu, order lama tetap menyimpan nama dan harga sebagai snapshot.

Order dibuat dalam transaksi:

1. Validasi payload.
2. Baca menu dari database.
3. Tolak menu yang tidak ada atau habis.
4. Hitung subtotal dan total dari harga database.
5. Insert `ORDERS`.
6. Insert semua `ORDER_ITEMS`.
7. Commit. Jika ada langkah gagal, rollback.

## Matriks RBAC

| Kemampuan | Customer | Owner | Admin |
|---|---:|---:|---:|
| Lihat katalog | Ya | Ya | Ya |
| Register | Ya | — | — |
| Checkout | Ya | Tidak | Tidak |
| Lihat semua order | Tidak | Tidak | Ya |
| Tambah menu | Tidak | Milik sendiri | Tidak |
| Ubah menu | Tidak | Milik sendiri | Tidak |
| Hapus menu | Tidak | Milik sendiri | Tidak |
| Ubah status order | Tidak | Tidak | Tidak (core) |

## Perintah Pengujian

Backend:

```powershell
cd pertemuan-08-validasi-error-handling\hands-on-2-centralized-error-handling\backend
npm run typecheck
npm run test:unit
npm run test:integration
```

Frontend:

```powershell
cd pertemuan-08-validasi-error-handling\hands-on-2-centralized-error-handling\frontend
npm test
npm run lint
npm run build
```

Integration test memakai database nyata. Pastikan `04-orders-schema.sql` dan `05-demo-accounts.sql` sudah dijalankan. Test membuat data uji lalu membersihkannya di `after`.

## Status Verifikasi

| Pemeriksaan | Hasil |
|---|---|
| Type check backend | Lulus |
| Unit test backend | 44/44 lulus |
| Integration test backend | 16/16 lulus |
| Unit test frontend | 33/33 lulus |
| Lint frontend | Lulus |
| Build frontend | Lulus |
| Browser: katalog publik | Lulus |
| Browser: register → login customer | Lulus |
| Browser: checkout + kode order | Lulus |
| Browser: login owner → dashboard + modal edit | Lulus |
| Browser: login admin → tabel order read-only | Lulus |
| Browser: role salah → `/forbidden` | Lulus |

## Troubleshooting

| Gejala | Penyebab umum |
|---|---|
| `CREATE TABLE permission denied` | Jalankan `04-orders-schema.sql` lewat SSMS dengan akun yang punya hak DDL, misalnya `sa` |
| Login admin/customer `401` | `05-demo-accounts.sql` belum dijalankan |
| Register `409 EMAIL_TAKEN` | Email sudah ada; gunakan email lain |
| Checkout `409 MENU_UNAVAILABLE` | Menu sedang habis; hapus dari keranjang |
| Checkout `404 MENU_NOT_FOUND` | Menu sudah dihapus; muat ulang katalog |
| Owner melihat 5 warung | Seed lokal memang memberi 5 warung ke `tini@kantin.test` |
| `403` saat buka halaman role lain | Guard frontend benar; kembali ke halaman role |
| CORS error | `CORS_ORIGIN` harus `http://localhost:5174` |
| `EADDRINUSE` | Port 3002/5174 dipakai proses lain |
| Cookie bentrok dengan Hands-on 1 | Hands-on 2 memakai `AUTH_COOKIE_NAME=kantin_session_ho2` |

## Dokumen Pendamping

- [`docs/08-slide-outline.md`](docs/08-slide-outline.md) — kerangka 8 slide.
- [`docs/lembar-kerja.md`](docs/lembar-kerja.md) — lembar kerja mahasiswa.
- [`docs/matriks-pengujian.md`](docs/matriks-pengujian.md) — matriks uji manual.
- [`docs/demo.md`](docs/demo.md) — skrip demo 15 menit.
