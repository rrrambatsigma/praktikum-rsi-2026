# Maem Bolo - Hands-on 1: Login Owner, Validasi Form & Error Handling

Latihan full-stack untuk Pertemuan 08. Owner masuk lewat halaman login, lalu mengelola menu warung di dashboard. Frontend React memvalidasi input di browser, backend Express **memvalidasi ulang seluruh payload dan memeriksa sesi login** sebelum menyimpan ke SQL Server `review_kantin`.

Dua prinsip yang dipakai sepanjang hands-on ini:

1. **Validasi frontend adalah untuk pengalaman pengguna, validasi backend adalah untuk integritas data.** Keduanya harus ada.
2. **Route protection di frontend bukan pengaman API.** Endpoint `POST /api/menu` tetap memeriksa cookie sesi dan role Owner di backend.

---

## 1. Tujuan Pembelajaran

Setelah menyelesaikan hands-on ini, mahasiswa diharapkan mampu:

1. Membuat halaman login Owner dengan React controlled component.
2. Menerapkan validasi email dan password di frontend serta backend.
3. Menjelaskan perbedaan validasi panjang password dan autentikasi kredensial.
4. Memakai autentikasi JWT dalam cookie `httpOnly` yang sudah tersedia di repo.
5. Melindungi dashboard dengan `AuthProvider` + `ProtectedRoute`.
6. Melindungi endpoint tambah menu dengan middleware `authenticate` + `authorize('owner')`, lalu memeriksa kepemilikan warung (object-level authorization).
7. Menampilkan toast sukses/gagal yang hanya muncul setelah hasil backend diketahui.
8. Memetakan error API ke field form, pesan autentikasi, atau pesan koneksi.
9. Membedakan status `400`, `401`, `403`, `404`, `409`, dan `500`.
10. Menguji skenario login dan tambah menu yang berhasil maupun gagal.

## 2. Materi yang Dipelajari

- Controlled form, state error, dan fokus otomatis ke field tidak valid.
- Validasi nilai mentah (string) sebelum konversi tipe.
- Fetch API dengan `credentials: 'include'`.
- Autentikasi JWT HS256 di cookie `httpOnly` + `bcryptjs`.
- Middleware `authenticate` dan `authorize`.
- Object-level authorization: memeriksa `STALLS.owner_id` terhadap user yang login.
- Validasi skema dengan `zod` di backend.
- Pemisahan lapisan `routes → controllers → services → repositories`.
- Penanganan error terpusat dan kontrak respons error.
- Query parameterized ke SQL Server.
- CORS dengan kredensial antara `localhost:5173` dan `localhost:3001`.
- React Router untuk memisahkan halaman login dan dashboard.

## 3. Prasyarat

| Kebutuhan | Keterangan |
|---|---|
| Node.js | Minimal versi 22.18 (diuji pada 24.21) |
| npm | Disertakan bersama Node.js |
| SQL Server | Berjalan di `localhost:1433` |
| Database | `review_kantin` dari Pertemuan 03 |
| Akun database | `praktikum_user` dari Pertemuan 03 |
| Shell | PowerShell di Windows |
| Browser | Chrome, Edge, atau Firefox versi terbaru |

Pastikan database sudah ada:

```powershell
sqlcmd -S localhost -E -C -d review_kantin -Q "SELECT COUNT(*) AS total FROM dbo.MENU_ITEMS;"
```

## 4. Teknologi

**Frontend**

- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4 melalui `@tailwindcss/vite`
- `lucide-react` untuk ikon
- `react-router-dom` v7
- Fetch API bawaan browser
- `node:test` untuk unit test validator

**Backend**

- Express 5 + TypeScript
- `tsx` sebagai runner
- `zod` untuk validasi
- `mssql` untuk SQL Server
- `bcryptjs` untuk memeriksa hash password
- `jsonwebtoken` untuk JWT HS256
- `cookie-parser` untuk membaca cookie sesi
- `node:test` untuk unit dan integration test

Tidak memakai Axios, React Query, registrasi publik, checkout, atau payment. Axios dan centralized error handling lanjutan dibahas pada Hands-on 2.

## 5. Struktur Folder

```text
pertemuan-08-validasi-error-handling/
├─ db/
│  ├─ 01-menu-schema.sql          # kolom category & description
│  ├─ 02-menu-seed.sql            # backfill kategori + contoh camilan
│  └─ 03-auth-seed.sql            # memastikan hash bcrypt akun Owner
├─ hands-on-1-form-validation/
│  ├─ backend/
│  │  ├─ src/
│  │  │  ├─ config/env.ts
│  │  │  ├─ controllers/
│  │  │  │  ├─ authController.ts
│  │  │  │  ├─ menuController.ts
│  │  │  │  └─ ...
│  │  │  ├─ db/pool.ts
│  │  │  ├─ dtos/
│  │  │  ├─ errors/               # AppError, ValidationError, Unauthorized, Forbidden, ...
│  │  │  ├─ middlewares/
│  │  │  │  ├─ auth.ts            # authenticate + getUser
│  │  │  │  ├─ authorize.ts       # authorize('owner')
│  │  │  │  ├─ cors.ts
│  │  │  │  └─ errorHandler.ts
│  │  │  ├─ repositories/         # menu, stall, user
│  │  │  ├─ routes/
│  │  │  │  ├─ authRouter.ts
│  │  │  │  ├─ menuRouter.ts
│  │  │  │  └─ ...
│  │  │  ├─ schemas/
│  │  │  │  ├─ authSchema.ts
│  │  │  │  └─ menuSchema.ts
│  │  │  ├─ services/
│  │  │  │  ├─ authService.ts
│  │  │  │  ├─ tokenService.ts
│  │  │  │  ├─ menuOwnership.ts      # aturan object-level authorization
│  │  │  │  └─ menuService.ts
│  │  │  ├─ types/               # AuthUser, UserRole, augmentasi Express.Request
│  │  │  ├─ utils/cookie.ts       # setAuthCookie + clearAuthCookie
│  │  │  ├─ app.ts
│  │  │  └─ index.ts
│  │  ├─ tests/
│  │  │  ├─ authSchema.test.ts
│  │  │  ├─ menuOwnership.test.ts
│  │  │  ├─ menuSchema.test.ts
│  │  │  └─ menuApi.test.ts
│  │  ├─ .env.example
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  └─ frontend/
│     ├─ src/
│     │  ├─ components/
│     │  │  ├─ AppFooter.tsx
│     │  │  ├─ AppHeader.tsx
│     │  │  ├─ AuthShell.tsx
│     │  │  ├─ FieldError.tsx
│     │  │  ├─ MenuForm.tsx
│     │  │  ├─ MenuList.tsx
│     │  │  ├─ ProtectedRoute.tsx
│     │  │  ├─ Toast.tsx
│     │  │  └─ ui.tsx
│     │  ├─ context/
│     │  │  ├─ AuthContext.tsx
│     │  │  └─ ToastContext.tsx
│     │  ├─ data/categories.ts
│     │  ├─ hooks/useMenuData.ts
│     │  ├─ lib/
│     │  │  ├─ api.ts
│     │  │  ├─ format.ts
│     │  │  ├─ styles.ts
│     │  │  └─ validation.ts
│     │  ├─ pages/
│     │  │  ├─ DashboardPage.tsx
│     │  │  └─ LoginPage.tsx
│     │  ├─ types/
│     │  │  ├─ auth.ts
│     │  │  └─ menu.ts
│     │  ├─ App.tsx
│     │  ├─ index.css
│     │  └─ main.tsx
│     ├─ tests/validation.test.ts
│     ├─ .env.example
│     ├─ package.json
│     └─ vite.config.ts
└─ README.md
```

## 6. Alur Aplikasi

### 6.1 Login

```text
Buka http://localhost:5173
        │
        ▼
[Frontend] AuthProvider memanggil GET /api/auth/me
        │ belum ada cookie valid → 401
        ▼
[Frontend] ProtectedRoute mengarahkan ke /login
        │
        ▼
Owner mengisi email + password
        │
        ▼
[Frontend] validateLoginForm()          ← email wajib/format valid,
        │ valid                            password wajib/min 8
        ▼
POST /api/auth/login  (Fetch + credentials: 'include')
        │
        ▼
[Backend] loginSchema (zod)             ← 400 VALIDATION_ERROR
        │ valid
        ▼
[Backend] UserRepository.findByEmail()
        │
        ▼
[Backend] bcrypt.compare(password, hash) ← 401 jika tidak cocok
        │ cocok
        ▼
[Backend] sign JWT HS256 + Set-Cookie httpOnly
        │
        ▼
Respons 200 { status, message, data: user }
        │
        ▼
[Frontend] toast sukses + navigate ke dashboard
```

### 6.2 Tambah menu

```text
Dashboard terbuka (user sudah terautentikasi)
        │
        ▼
[Frontend] validateMenuForm()           ← validasi 1: kenyamanan pengguna
        │ valid
        ▼
POST /api/menu  (cookie sesi ikut terkirim)
        │
        ▼
[Backend] authenticate                  ← 401 jika cookie tidak ada/kedaluwarsa
        │
        ▼
[Backend] authorize('owner')            ← 403 jika role bukan owner
        │
        ▼
[Backend] express.json()                ← menolak JSON rusak (400)
        │
        ▼
[Backend] menuInputSchema (zod)         ← validasi 2: otoritatif (400)
        │ valid
        ▼
[Backend] stallRepository.findById()    ← warung harus ada (404)
        │ ada
        ▼
[Backend] canManageStall()              ← owner_id harus milik user (403 STALL_FORBIDDEN)
        │ cocok
        ▼
[Backend] menuRepository.create()       ← INSERT parameterized
        │
        ▼
SQL Server: dbo.MENU_ITEMS
        │
        ▼
Respons 201 { status, message, data }
        │
        ▼
[Frontend] toast sukses + reload daftar menu dari backend
```

Jika backend menolak, `errors[].field` dipetakan kembali ke field form. Jika koneksi gagal, muncul toast koneksi. Daftar menu **hanya** diperbarui setelah respons sukses.

## 7. Setup Database

Jalankan dari **root repository** `E:\praktikum-rsi-2026`.

### 7.1 Cek database

```powershell
sqlcmd -S localhost -E -C -d review_kantin -Q "SELECT COUNT(*) AS total FROM dbo.MENU_ITEMS;"
```

### 7.2 Migrasi schema menu

```powershell
sqlcmd -S localhost -E -C -b -i "pertemuan-08-validasi-error-handling\db\01-menu-schema.sql"
```

Script ini menambahkan secara **aditif dan idempoten**:

- `category NVARCHAR(20) NULL`
- `description NVARCHAR(255) NULL`
- constraint `CK_MENU_ITEMS_category` untuk `makanan`, `minuman`, `camilan`, atau `NULL`

### 7.3 Seed menu

```powershell
sqlcmd -S localhost -E -C -b -i "pertemuan-08-validasi-error-handling\db\02-menu-seed.sql"
```

Seed melakukan:

1. Backfill kategori menu lama dari kategori warung.
2. Menambah warung `Gorengan Bu Tini` bila belum ada, dengan `owner_id` eksplisit milik `tini@kantin.test`.
3. Memperbaiki data lama bila warung tersebut sebelumnya menempel ke Owner lain.
4. Menambah empat menu camilan, satu di antaranya `is_available = 0`.
5. Menghapus duplikat seed bila script dijalankan ulang.

### 7.4 Seed akun Owner

Autentikasi memakai data `dbo.USERS` dari Pertemuan 03 dan hash bcrypt dari Pertemuan 05. Jalankan script berikut agar hash akun Owner benar-benar valid:

```powershell
sqlcmd -S localhost -E -C -b -i "pertemuan-08-validasi-error-handling\db\03-auth-seed.sql"
```

Script ini **tidak membuat akun baru**. Ia hanya memperbarui hash milik akun yang sudah ada dan akan gagal dengan pesan jelas bila akun tersebut tidak ditemukan.

Akun praktikum yang benar-benar terdaftar:

| Field | Nilai |
|---|---|
| Email | `tini@kantin.test` |
| Password | `rahasia123` |
| Role | `owner` |

> Password di atas hanya untuk lingkungan praktikum dan sudah diumumkan di seed Pertemuan 05. Untuk penggunaan nyata, ganti password dan `JWT_SECRET`. Hash bcrypt disimpan di database; password plaintext tidak pernah disimpan aplikasi.

### 7.5 Verifikasi

```powershell
sqlcmd -S localhost -E -C -d review_kantin -Q "SELECT id, name, email, role, LEFT(password_hash, 7) AS hash_prefix FROM dbo.USERS WHERE role = 'owner';"

sqlcmd -S localhost -E -C -d review_kantin -Q "SELECT category, COUNT(*) AS jumlah FROM dbo.MENU_ITEMS GROUP BY category ORDER BY category;"
```

Hash yang valid diawali `$2b$` dan panjangnya 60 karakter. Jumlah menu bergantung pada data yang sudah Anda tambahkan; seed awal Pertemuan 08 menghasilkan 24 menu.

> Jika login SQL Server memakai autentikasi SQL, ganti `-E` dengan `-U praktikum_user` lalu tambahkan `-P` saat diminta.

## 8. Setup Backend

```powershell
cd pertemuan-08-validasi-error-handling\hands-on-1-form-validation\backend
Copy-Item .env.example .env
notepad .env
```

Isi `.env`:

```env
PORT=3001
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development

DB_SERVER=localhost
DB_PORT=1433
DB_USER=praktikum_user
DB_PASSWORD=ubah_password_database
DB_NAME=review_kantin
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

JWT_SECRET=ubah_dengan_secret_acak_minimal_32_karakter
JWT_EXPIRES_IN=1d
AUTH_COOKIE_NAME=kantin_session
BCRYPT_SALT_ROUNDS=10
```

Membuat `JWT_SECRET` acak:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Salin hasilnya ke `JWT_SECRET`. **Jangan commit `.env`.**

```powershell
npm install
npm run dev
```

Output yang diharapkan:

```text
Server berjalan di http://localhost:3001
Health check: http://localhost:3001/health
```

Cek dari terminal lain:

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/health"
```

### Script backend

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Menjalankan server dengan watch mode |
| `npm start` | Menjalankan server tanpa watch |
| `npm run typecheck` | Cek tipe TypeScript |
| `npm run test:unit` | Unit test skema menu, login, dan ownership |
| `npm run test:integration` | Integration test dengan database nyata |

## 9. Setup Frontend

Buka terminal baru:

```powershell
cd pertemuan-08-validasi-error-handling\hands-on-1-form-validation\frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Buka `http://localhost:5173`. Anda akan diarahkan ke `/login` bila belum punya sesi.

`vite.config.ts` memakai `strictPort: true`, sehingga Vite langsung gagal bila port `5173` sudah dipakai, bukan berpindah port diam-diam.

### Script frontend

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Menjalankan Vite dev server |
| `npm test` | Unit test validator login dan menu |
| `npm run lint` | ESLint |
| `npm run build` | Type check + build produksi |
| `npm run preview` | Melihat hasil build |

### Konfigurasi API

`frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

Bila variabel ini tidak diisi, frontend memakai `http://localhost:3001/api` sebagai fallback.

## 10. Cara Autentikasi Bekerja

### 10.1 Mekanisme

| Bagian | Implementasi |
|---|---|
| Penyimpanan password | Hash bcrypt di `dbo.USERS.password_hash` |
| Pemeriksaan kredensial | `bcrypt.compare()` di `authService.login()` |
| Token | JWT HS256, berisi `sub`, `name`, `email`, `role` |
| Penyimpanan token | Cookie `kantin_session`, `httpOnly`, `SameSite=Lax`, `Secure` hanya di production |
| Umur sesi | Mengikuti `JWT_EXPIRES_IN` (default `1d`) |
| Pemeriksaan sesi | `GET /api/auth/me` saat aplikasi dimuat |
| Proteksi backend | `authenticate` lalu `authorize('owner')` pada `POST /api/menu` dan `GET /api/stalls/mine` |
| Kepemilikan warung | `canManageStall(stall.ownerId, user)` di `menuService.createMenu()` |
| Logout | `POST /api/auth/logout` menghapus cookie |

Frontend **tidak menyimpan token di localStorage**. `AuthProvider` hanya menyimpan data user di memori dan memverifikasi sesi lewat `/auth/me`. Cookie `httpOnly` tidak dapat dibaca JavaScript.

### 10.2 Status autentikasi

| Status | Arti | Perilaku frontend |
|---|---|---|
| `401 UNAUTHORIZED` | Belum login, cookie tidak ada, atau token kedaluwarsa | Toast sesi berakhir + arahkan ke `/login` |
| `403 FORBIDDEN` | Login valid tetapi role bukan `owner` | Toast "Akun ini bukan Owner." dan tetap di `/login` |
| `403 STALL_FORBIDDEN` | Role Owner valid, tetapi `stallId` bukan warung miliknya | Field `stallId` ditandai + toast "Warung bukan milik Anda." |
| `200` pada `/auth/me` | Sesi valid | Dashboard boleh dibuka |

`GET /api/menu` dan `GET /api/stalls` tetap publik agar daftar menu mudah diamati saat praktikum. Yang dilindungi adalah operasi tulis `POST /api/menu` dan endpoint `GET /api/stalls/mine`.

Form tambah menu memakai `GET /api/stalls/mine`, bukan `GET /api/stalls`. Jadi frontend tidak pernah menawarkan warung milik Owner lain. Backend tetap memeriksa ulang `stallId` karena request bisa dimodifikasi lewat DevTools atau curl.

Akun dengan role `admin` atau `customer` boleh memiliki kredensial yang valid, tetapi **tidak diberi sesi** oleh endpoint login Hands-on 1. Responsnya `403 FORBIDDEN` karena aplikasi ini khusus Owner; middleware `authorize('owner')` tetap menjadi lapisan pertahanan kedua di endpoint menu.

## 11. Endpoint API

Base URL: `http://localhost:3001`

| Method | Path | Akses | Sukses | Fungsi |
|---|---|---|---|---|
| `GET` | `/health` | Publik | `200` | Cek server + database |
| `POST` | `/api/auth/login` | Publik | `200` | Login, mengirim cookie sesi |
| `GET` | `/api/auth/me` | Sesi | `200` | Data user yang sedang login |
| `POST` | `/api/auth/logout` | Publik | `200` | Hapus cookie sesi |
| `GET` | `/api/stalls` | Publik | `200` | Daftar warung |
| `GET` | `/api/stalls/mine` | Owner | `200` | Warung milik Owner yang login |
| `GET` | `/api/menu` | Publik | `200` | Daftar menu beserta warung |
| `POST` | `/api/menu` | Owner + pemilik warung | `201` | Tambah menu |
| `POST` | `/api/dev/force-error` | Publik | `500` | Simulasi error server (non-production) |

### 11.1 Login berhasil

```powershell
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

$login = @{
  email    = "tini@kantin.test"
  password = "rahasia123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body $login `
  -WebSession $session
```

Respons `200`:

```json
{
  "status": "success",
  "message": "Berhasil masuk ke MaemBolo.",
  "data": {
    "id": 2,
    "name": "Bu Tini",
    "email": "tini@kantin.test",
    "role": "owner"
  }
}
```

Header respons memuat `Set-Cookie: kantin_session=...; HttpOnly; SameSite=Lax; Path=/`. `password_hash` tidak pernah ikut di respons.

### 11.2 Login gagal

```powershell
$salah = @{
  email    = "tini@kantin.test"
  password = "password-salah"
} | ConvertTo-Json

try {
  Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
    -Method Post -ContentType "application/json" -Body $salah
} catch {
  $_.ErrorDetails.Message
}
```

Respons `401`:

```json
{
  "status": "fail",
  "code": "UNAUTHORIZED",
  "message": "Email atau password tidak sesuai."
}
```

Pesan yang sama dipakai untuk email tidak terdaftar, sehingga penyerang tidak bisa menebak email mana yang ada.

### 11.3 Cek sesi dan logout

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/auth/me" -WebSession $session
Invoke-RestMethod -Uri "http://localhost:3001/api/auth/logout" -Method Post -WebSession $session
```

`/auth/me` tanpa cookie mengembalikan `401`. Setelah logout, panggilan `/auth/me` dengan sesi yang sama kembali `401`.

### 11.4 Daftar menu

```powershell
curl.exe -s http://localhost:3001/api/menu
```

```json
{
  "status": "success",
  "data": [
    {
      "id": 21,
      "stallId": 11,
      "stallName": "Gorengan Bu Tini",
      "name": "Pisang Goreng",
      "category": "camilan",
      "price": 5000,
      "description": "Pisang goreng hangat dengan topping gula halus.",
      "isAvailable": true
    }
  ]
}
```

### 11.5 Tambah menu sebagai Owner

Gunakan sesi hasil login di atas:

```powershell
$body = @{
  stallId     = 11
  name        = "Pisang Goreng Keju"
  category    = "camilan"
  price       = 8000
  description = "Pisang goreng dengan topping keju."
  isAvailable = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/menu" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body `
  -WebSession $session
```

Tanpa `-WebSession` (atau tanpa cookie), responsnya `401`:

```json
{
  "status": "fail",
  "code": "UNAUTHORIZED",
  "message": "Silakan login terlebih dahulu."
}
```

Role selain Owner mendapat `403`:

```json
{
  "status": "fail",
  "code": "FORBIDDEN",
  "message": "Anda tidak memiliki akses ke operasi ini."
}
```

Jika role sudah Owner tetapi `stallId` menunjuk warung milik Owner lain, backend menolak dengan `403 STALL_FORBIDDEN`:

```json
{
  "status": "fail",
  "code": "STALL_FORBIDDEN",
  "message": "Anda hanya dapat menambah menu pada warung milik Anda.",
  "errors": [
    { "field": "stallId", "message": "Warung ini bukan milik akun Anda." }
  ]
}
```

Cek daftar warung yang boleh dikelola:

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/stalls/mine" -WebSession $session
```

Endpoint ini hanya mengembalikan baris `STALLS` dengan `owner_id` sama dengan `sub` token. Tanpa cookie sesi hasilnya `401`.

### 11.6 Payload menu tidak valid

```powershell
$invalid = @{
  stallId     = 11
  name        = "Pisang"
  category    = "camilan"
  price       = 0
  isAvailable = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/menu" `
  -Method Post -ContentType "application/json" -Body $invalid -WebSession $session
```

Respons `400`:

```json
{
  "status": "fail",
  "code": "VALIDATION_ERROR",
  "message": "Data menu tidak valid.",
  "errors": [
    { "field": "price", "message": "Harga harus lebih dari 0." }
  ]
}
```

### 11.7 Warung tidak ditemukan

```powershell
$noStall = @{
  stallId = 999999; name = "Menu Uji"; category = "camilan"
  price = 5000; isAvailable = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/menu" `
  -Method Post -ContentType "application/json" -Body $noStall -WebSession $session
```

Respons `404` dengan `code: "STALL_NOT_FOUND"` dan `field: "stallId"`.

### 11.8 JSON rusak dan error server

```powershell
curl.exe -s -X POST http://localhost:3001/api/menu -H "Content-Type: application/json" -d "{"
curl.exe -s -X POST http://localhost:3001/api/dev/force-error
```

JSON rusak menghasilkan `400 INVALID_JSON`. Error server menghasilkan `500 INTERNAL_ERROR` tanpa stack trace; detail hanya dicatat di log server.

## 12. Aturan Validasi

### 12.1 Login

| Field | Frontend | Backend |
|---|---|---|
| Email | Wajib, `trim`, format email, maks 150 karakter | Wajib, `trim`, `toLowerCase`, format email, maks 150 |
| Password | Wajib, minimal 8, maks 72 karakter | Wajib, minimal 8, maks 72 karakter |

Catatan:

- Frontend **tidak mengirim request** jika email kosong, format email salah, atau password kurang dari 8 karakter.
- Panjang password bukan autentikasi. Backend tetap membandingkan hash dengan `bcrypt.compare`.
- Body login memakai `.strict()`, sehingga field asing seperti `role` ditolak.
- Error field ditampilkan di dekat input; toast dipakai untuk hasil autentikasi atau gangguan koneksi.

### 12.2 Form menu

| Field | Aturan | Pesan contoh |
|---|---|---|
| Warung | Wajib dipilih, harus ada di database, dan harus milik Owner yang login | `Pilih warung terlebih dahulu.` |
| Nama | Wajib, `trim`, 2–100 karakter, tidak boleh hanya spasi | `Nama menu wajib diisi.` |
| Kategori | Wajib salah satu dari `makanan`, `minuman`, `camilan` | `Pilih kategori menu.` |
| Harga | Wajib, hanya digit, bilangan bulat, > 0, maks 1.000.000 | `Harga harus lebih dari 0.` |
| Deskripsi | Opsional, maks 255 karakter | `Deskripsi maksimal 255 karakter.` |
| Ketersediaan | Boolean (`true`/`false`) | — |

Ketentuan tambahan:

- Harga memakai `type="text"` + `inputMode="numeric"`, bukan `type="number"`, agar `abc`, `-1000`, `1.5`, dan `1e3` bisa ditolak secara eksplisit.
- Harga kosong ditolak sebagai **kosong**, bukan otomatis menjadi `0`.
- Error field hilang ketika pengguna memperbaiki nilai field tersebut.
- Fokus berpindah ke field tidak valid pertama saat submit.
- Form tidak direset jika request gagal; daftar menu tidak bertambah jika backend menolak.
- Backend memakai `.strict()`, sehingga field asing ditolak dengan `field: "body"`.
- `stallId`, `price`, dan `isAvailable` harus bertipe benar. `"price": "5000"` (string) ditolak.
- `stallId` yang valid secara format tetapi bukan milik Owner tetap ditolak `403 STALL_FORBIDDEN`; validasi skema saja tidak cukup.

### 12.3 Perbedaan peran

| Aspek | Frontend | Backend |
|---|---|---|
| Tujuan | UX cepat dan jelas | Integritas data + keamanan |
| Sumber aturan | `src/lib/validation.ts` | `src/schemas/menuSchema.ts`, `authSchema.ts` |
| Bisa dilewati? | Ya, lewat DevTools/curl | Tidak |
| Efek gagal | Pesan di form | Status `4xx` dan data tidak disimpan |
| Pemeriksaan sesi | `ProtectedRoute` | `authenticate` + `authorize` |
| Kepemilikan warung | Form hanya memuat `/stalls/mine` | `canManageStall()` memeriksa `owner_id` |

## 13. Toast dan Error Handling

### 13.1 Toast yang tersedia

| Operasi | Kondisi | Umpan balik |
|---|---|---|
| Login | Berhasil | Toast **Berhasil masuk.** + pindah ke dashboard |
| Login | Kredensial salah (`401`) | Alert inline **Email atau password tidak sesuai.** |
| Login | Server tidak tersedia | Alert inline **Server tidak dapat dihubungi.** |
| Login | Validasi backend `400` | Error per field, tanpa toast tambahan |
| Menu | Berhasil (`201`) | Toast **Menu berhasil ditambahkan.** |
| Menu | Ditolak backend (`400`/`404`) | Toast **Menu belum dapat disimpan.** + field error |
| Menu | Warung bukan miliknya (`403 STALL_FORBIDDEN`) | Toast **Warung bukan milik Anda.** + field error |
| Menu | Gagal disimpan (`5xx`) | Toast **Menu gagal disimpan.** |
| Menu | Koneksi terputus | Toast **Koneksi ke server terputus.** |
| Menu | Sesi berakhir (`401`) | Toast **Sesi login berakhir.** lalu redirect |
| Logout | Berhasil | Toast **Berhasil keluar.** |

Ketentuan implementasi:

- Toast sukses hanya muncul setelah backend mengonfirmasi operasi.
- Satu provider toast global dipakai halaman login dan dashboard.
- Hanya satu toast disimpan pada satu waktu, sehingga tidak ada dua toast identik dari satu operasi.
- Pesan field tetap muncul di dekat input, bukan hanya di toast.
- Pesan internal database dan stack trace tidak pernah ditampilkan ke pengguna.

### 13.2 Format respons error

```json
{
  "status": "fail",
  "code": "VALIDATION_ERROR",
  "message": "Data menu tidak valid.",
  "errors": [
    { "field": "price", "message": "Harga harus lebih dari 0." }
  ]
}
```

| Status | `code` | Penyebab |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Payload tidak lolos skema |
| `400` | `INVALID_JSON` | Body bukan JSON valid |
| `401` | `UNAUTHORIZED` | Belum login, kredensial salah, atau sesi kedaluwarsa |
| `403` | `FORBIDDEN` | Role tidak berwenang |
| `403` | `STALL_FORBIDDEN` | `stallId` bukan warung milik Owner yang login |
| `404` | `STALL_NOT_FOUND` | `stallId` tidak ada |
| `404` | `ROUTE_NOT_FOUND` | Path tidak terdaftar |
| `409` | `CONFLICT` | Pelanggaran constraint database |
| `500` | `INTERNAL_ERROR` | Error tak terduga di server |

### 13.3 Cara frontend menangani error

| Jenis error | Penanganan |
|---|---|
| `NETWORK_ERROR` (fetch gagal) | Toast "server tidak dapat dihubungi/terputus" |
| `400` dengan `errors[]` | Dipetakan ke field terkait + fokus ke field pertama |
| `401` | Toast sesi berakhir, `AuthProvider` menghapus user, `ProtectedRoute` redirect |
| `403` | Toast pesan akses |
| `403 STALL_FORBIDDEN` | Field `stallId` ditandai + toast "Warung bukan milik Anda." |
| `5xx` | Toast pesan umum yang aman |
| Respons bukan JSON / format salah | `ApiError` dengan pesan "format respons tidak sesuai" |

## 14. Langkah Praktikum

1. Jalankan migrasi dan seed database (bagian 7), termasuk `03-auth-seed.sql`.
2. Jalankan backend di terminal pertama (bagian 8).
3. Buka `http://localhost:3001/health` dan pastikan status `success`.
4. Jalankan frontend di terminal kedua (bagian 9).
5. Buka `http://localhost:5173`. Anda diarahkan ke halaman login.
6. Klik **Masuk** tanpa mengisi apa pun. Amati error email dan password.
7. Isi email `bukan-email` dan password `123`. Amati pesan format email dan minimal 8 karakter.
8. Isi email benar dengan password salah. Amati pesan "Email atau password tidak sesuai." dan tetap di halaman login.
9. Masuk dengan akun Owner praktikum. Amati toast sukses dan dashboard terbuka.
10. Perhatikan daftar **Warung Saya**. Hanya warung dengan `owner_id` akun ini yang muncul.
11. Refresh halaman. Dashboard tetap terbuka karena cookie sesi masih valid.
12. Klik **Tambah Menu**, lalu submit kosong. Amati error warung, nama, kategori, dan harga.
13. Isi nama hanya spasi, lalu submit. Error nama muncul.
14. Coba harga `abc`, `0`, `-1`, `1.5`, dan `1e3`.
15. Isi data valid, submit, dan amati tombol berubah menjadi **Menyimpan...**.
16. Setelah respons `201`, toast sukses muncul dan daftar menu bertambah.
17. Buka DevTools, ubah `stallId` pada request menjadi id warung milik Owner lain, lalu kirim. Amati `403 STALL_FORBIDDEN`, field warung ditandai, dan menu tidak bertambah.
18. Hentikan backend, lalu submit menu valid. Amati toast koneksi dan daftar tidak bertambah.
19. Nyalakan backend, klik **Muat ulang** pada header.
20. Klik **Keluar**. Anda kembali ke halaman login; membuka `/` lagi tetap diarahkan ke login.

## 15. Skenario Pengujian

### 15.1 Login

| No | Aksi | Hasil yang diharapkan |
|---|---|---|
| 1 | Email kosong | `Email wajib diisi.`, request tidak dikirim |
| 2 | Format email salah | `Format email tidak valid.`, request tidak dikirim |
| 3 | Password kosong | `Password wajib diisi.` |
| 4 | Password 7 karakter | `Password minimal 8 karakter.` |
| 5 | Email/password salah | `401`, alert inline kredensial salah, tetap di `/login` |
| 6 | Login benar | `200`, toast sukses, dashboard terbuka, cookie `httpOnly` |
| 7 | Server mati | Alert inline "Server tidak dapat dihubungi." |
| 8 | Refresh dashboard | Sesi bertahan, dashboard tetap terbuka |
| 9 | Logout lalu buka `/` | Kembali ke `/login`, `/auth/me` menjadi `401` |
| 10 | Login dengan akun non-Owner | `403 FORBIDDEN`, tidak ada cookie sesi, tetap di `/login` |

### 15.2 Tambah menu

| No | Aksi | Hasil yang diharapkan |
|---|---|---|
| 1 | Semua field valid | `201`, toast sukses, daftar bertambah |
| 2 | Nama kosong | `Nama menu wajib diisi.` |
| 3 | Nama hanya spasi | `Nama menu wajib diisi.` |
| 4 | Warung belum dipilih | `Pilih warung terlebih dahulu.` |
| 5 | Kategori belum dipilih | `Pilih kategori menu.` |
| 6 | Harga kosong | `Harga wajib diisi.` |
| 7 | Harga `0` | `Harga harus lebih dari 0.` |
| 8 | Harga negatif | Ditolak sebagai bukan angka bulat |
| 9 | Harga `abc` / `1.5` / `1e3` | `Harga harus berupa angka bulat...` |
| 10 | Deskripsi > 255 karakter | Ditolak (validator + maxLength) |
| 11 | Payload invalid langsung ke API | `400 VALIDATION_ERROR`, data tidak tersimpan |
| 12 | Menu valid | `201`, row baru di `MENU_ITEMS` |
| 13 | Backend menolak (`400`/`404`) | Field error, daftar tidak berubah |
| 14 | `stallId` diubah ke warung Owner lain | `403 STALL_FORBIDDEN`, field warung ditandai, data tidak tersimpan |
| 15 | `GET /api/stalls/mine` tanpa sesi | `401 UNAUTHORIZED` |
| 16 | `GET /api/stalls/mine` dengan sesi Owner | Hanya warung dengan `ownerId` milik user tersebut |
| 17 | Server/database mati | Toast koneksi, daftar tidak berubah |

### 15.3 Pengujian otomatis

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

Integration test backend memakai database nyata: login Owner, memastikan `/api/stalls/mine` hanya berisi warung miliknya, membuat menu `TEST-HO1-<timestamp>`, menolak `stallId` warung Owner lain dengan `403 STALL_FORBIDDEN`, lalu menghapus data uji kembali.

### 15.4 Pengujian langsung ke API

```powershell
# Tanpa sesi → 401
$body = @{
  stallId = 1; name = "Uji"; category = "camilan"
  price = 5000; isAvailable = $true
} | ConvertTo-Json

curl.exe --% -s -X POST http://localhost:3001/api/menu -H "Content-Type: application/json" -d "{\"stallId\":1,\"name\":\"Uji\",\"category\":\"camilan\",\"price\":5000,\"isAvailable\":true}"

# Harga string → 400 (dengan cookie sesi)
curl.exe --% -s -b cookies.txt -X POST http://localhost:3001/api/menu -H "Content-Type: application/json" -d "{\"stallId\":1,\"name\":\"Uji\",\"category\":\"camilan\",\"price\":\"5000\",\"isAvailable\":true}"

# Field asing → 400
curl.exe --% -s -b cookies.txt -X POST http://localhost:3001/api/menu -H "Content-Type: application/json" -d "{\"stallId\":1,\"name\":\"Uji\",\"category\":\"camilan\",\"price\":5000,\"isAvailable\":true,\"total\":1000}"
```

> Simbol `--%` membuat PowerShell meneruskan sisa argumen apa adanya ke `curl.exe`. Untuk menyimpan cookie dengan `curl.exe`, tambahkan `-c cookies.txt` saat login dan `-b cookies.txt` saat request berikutnya. Cara paling mudah di PowerShell tetap `Invoke-RestMethod -WebSession`.

### 15.5 Verifikasi database

```powershell
sqlcmd -S localhost -E -C -d review_kantin -Q "SELECT COUNT(*) AS total FROM dbo.MENU_ITEMS;"
sqlcmd -S localhost -E -C -d review_kantin -Q "SELECT id, name, category, price, is_available FROM dbo.MENU_ITEMS ORDER BY id DESC;"
```

Jumlah row hanya bertambah setelah submit valid.

## 16. Status Verifikasi

Hasil di bawah ini berasal dari eksekusi nyata pada mesin pengembangan (Windows, Node 24.21, SQL Server lokal), bukan perkiraan.

| Jenis | Perintah | Hasil |
|---|---|---|
| Type check backend | `npm run typecheck` | Lulus |
| Unit test backend | `npm run test:unit` | 27 lulus, 0 gagal |
| Integration test backend | `npm run test:integration` | 24 lulus, 0 gagal |
| Unit test frontend | `npm test` | 23 lulus, 0 gagal |
| Lint frontend | `npm run lint` | Lulus tanpa error |
| Build frontend | `npm run build` | Lulus (Vite 8, JS 303.87 kB / gzip 94.69 kB, CSS 29.66 kB / gzip 6.34 kB) |
| Smoke test API | `Invoke-WebRequest` + cookie session | `200`, `201`, `400`, `401`, `403 FORBIDDEN`, `403 STALL_FORBIDDEN`, `404` sesuai kontrak; login `admin` ditolak `403` tanpa cookie sesi |
| Uji UI browser | Browser manual | Login split-card, dashboard hanya memuat warung milik Owner, modal tambah menu, dan validasi field terverifikasi |
| Cek database | `sqlcmd` | Data uji `TEST-HO1-*` dihapus kembali |

Yang **belum** diotomatisasi: pemeriksaan visual detail (kontras, spacing) dan navigasi keyboard manual. Jalankan checklist bagian 15.1 dan 15.2 saat praktikum.

## 17. Troubleshooting

### `Environment variable JWT_SECRET belum diisi`

Tambahkan `JWT_SECRET` di `backend/.env`, lalu restart backend. Jangan memakai secret contoh di production.

### Login Owner selalu `401` padahal password benar

1. Jalankan `db\03-auth-seed.sql`.
2. Pastikan akun ada dan role-nya `owner`:

```powershell
sqlcmd -S localhost -E -C -d review_kantin -Q "SELECT id, email, role, LEFT(password_hash, 7) AS prefix, LEN(password_hash) AS panjang FROM dbo.USERS WHERE email = 'tini@kantin.test';"
```

Hash harus diawali `$2b$` dan panjang 60. Placeholder seperti `hash_owner1` tidak bisa dipakai `bcrypt.compare`.

### Login berhasil tetapi dashboard langsung kembali ke `/login`

- Pastikan backend berjalan dan `GET /api/auth/me` mengembalikan `200` setelah login.
- Pastikan `credentials: 'include'` tidak dihapus dari `frontend/src/lib/api.ts`.
- Pastikan `Access-Control-Allow-Credentials: true` ada dan `CORS_ORIGIN` sama persis dengan origin frontend.
- Jangan membuka frontend lewat `127.0.0.1` bila `CORS_ORIGIN` berisi `localhost` (dan sebaliknya), karena cookie dianggap beda site.

### `POST /api/menu` mengembalikan `401`

Cookie sesi tidak terkirim. Login ulang, gunakan `-WebSession` di PowerShell atau `-b cookies.txt` di `curl.exe`.

### `POST /api/menu` mengembalikan `403`

Ada dua kemungkinan:

- `code: "FORBIDDEN"` — role akun bukan `owner`.
- `code: "STALL_FORBIDDEN"` — role sudah `owner`, tetapi `stallId` bukan warung milik akun tersebut.

Untuk kasus kedua, ambil daftar warung yang boleh dikelola lewat `GET /api/stalls/mine`, lalu pakai salah satu `id` dari respons itu. Frontend sudah melakukan ini; error biasanya muncul bila request dimodifikasi manual.

### Sesi berakhir terlalu cepat

Sesuaikan `JWT_EXPIRES_IN` di `.env`, misalnya `1d` atau `8h`, lalu login ulang. Cookie mengikuti waktu kedaluwarsa token.

### `Gagal terhubung ke database` / health check `500`

- Pastikan service SQL Server berjalan.
- Cek `DB_SERVER`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, dan `DB_NAME`.
- Untuk SQL Server lokal, gunakan `DB_ENCRYPT=false` dan `DB_TRUST_SERVER_CERTIFICATE=true`.

```powershell
Get-Service | Where-Object { $_.Name -like "MSSQL*" }
sqlcmd -S localhost -E -C -Q "SELECT @@VERSION;"
```

### `Login failed for user 'praktikum_user'`

- Password di `.env` salah.
- User belum dibuat. Jalankan ulang `pertemuan-03-database-backend-crud\db\01-create-database-and-user.sql`.
- Pastikan mixed mode authentication aktif bila memakai user SQL.

### `EADDRINUSE` pada port 3001 atau 5173

```powershell
Get-NetTCPConnection -LocalPort 3001 -State Listen | Select-Object OwningProcess
Get-Process -Id <PID>
```

Hentikan proses tersebut, atau ubah `PORT` di backend dan sesuaikan `VITE_API_BASE_URL`.

### CORS error di browser

- `CORS_ORIGIN` harus sama persis dengan origin frontend, termasuk skema dan port.
- Restart backend setelah mengubah `.env`.
- Jangan mengakses frontend lewat `127.0.0.1` bila `CORS_ORIGIN` berisi `localhost`.

### `Invalid column name 'category'`

Migrasi belum dijalankan. Jalankan `db\01-menu-schema.sql` lalu `db\02-menu-seed.sql`.

### `npm install` gagal

- Pastikan Node.js >= 22.18: `node -v`.
- Hapus `node_modules` dan `package-lock.json`, lalu ulangi `npm install`.
- Di balik proxy, atur `npm config set proxy` dan `npm config set https-proxy`.

### Form selalu menampilkan error jaringan

- Backend belum berjalan.
- `VITE_API_BASE_URL` salah.
- Restart Vite setelah mengubah `.env` (Vite membaca env saat start).

### Toast sukses tidak muncul

- Toast login hanya muncul setelah `POST /api/auth/login` mengembalikan `200`.
- Toast menu hanya muncul setelah `POST /api/menu` mengembalikan `201`.
- Periksa tab Network: `401` → sesi/kredensial, `400/404` → field error, `5xx` → toast error umum, request gagal → toast koneksi.

## 18. Keterbatasan Hands-on 1

- Hanya ada tambah dan lihat menu; belum ada edit dan hapus.
- Belum ada filter, pencarian, atau pagination.
- Role yang dipakai hanya `owner`; tidak ada registrasi publik atau manajemen banyak role.
- Belum ada refresh token; sesi berakhir sesuai `JWT_EXPIRES_IN`.
- Belum ada checkout atau transaksi pesanan.
- Penanganan error sudah terpusat di backend, tetapi pemetaan pesan di frontend masih sederhana.
- Belum ada optimistic update; daftar dimuat ulang setelah sukses.
- Belum ada test komponen React (hanya test validator murni + uji UI CDP).

## 19. Tantangan Tambahan

1. Tambahkan tombol edit dan hapus menu beserta endpoint `PUT` dan `DELETE`.
2. Tambahkan filter kategori dan pencarian nama di daftar menu.
3. Validasi saat `blur`, bukan hanya saat submit.
4. Pecah input menjadi komponen `TextField`, `SelectField`, dan `TextareaField` yang reusable.
5. Tambahkan rate limiting pada endpoint login.
6. Tambahkan refresh token atau mekanisme perpanjangan sesi.
7. Tambahkan unit test untuk `api.ts` memakai `fetch` tiruan.
8. Lanjutkan ke Hands-on 2 untuk centralized error handling dan Axios.
