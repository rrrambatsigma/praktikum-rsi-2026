# Hands-on 1 — Autentikasi JWT (Register, Login, Hashing Password)

<!--
  CATATAN UNTUK DEVELOPER SITUS (markdown comment ini TIDAK akan tampil di Astro/GitHub):
  - File ini adalah sumber konten halaman web — narasi + kode, siap disalin.
  - Setiap blok kode memiliki label file yang ditulis di kalimat SEBELUMNYA (mis.
    `src/services/authService.ts`). Saat mengonversi ke komponen Astro, pakai
    `<Code title="<path>" lang="..." />` supaya label file muncul di atas kode.
  - Blok dengan label "Terminal: ..." = perintah yang dijalankan mahasiswa (bukan kode aplikasi).
  - Blok JSON bernomor = contoh OUTPUT respons API (bukan kode yang diketik mahasiswa).
  - Paragraf teks bebas = narasi, silakan diedit ringan.
  - Tabel "Kasus uji" boleh dirender apa adanya.
-->

Hands-on ini membangun di atas **project pertemuan-04 `hands-on-2-dokumentasi-swagger-openapi`**
(validasi zod + error handling terpusat + Swagger UI). API-nya sudah bisa membaca data warung,
menambah warung, hapus warung. Tapi **siapa pun** yang tahu alamat endpoint-nya bisa melakukan
semuanya — buka Postman, kirim request, beres. Server tidak mengenal pengirim request.

Di hands-on ini kita menutup celah itu: user bisa **mendaftarkan akun** (password di-hash
dengan bcrypt), lalu **login** untuk mendapat **token JWT** yang menjadi bukti identitasnya.

> File ini adalah sumber langkah utama.
> Topik ini bagian dari Pertemuan 05 — **Autentikasi dan Middleware**.

## Yang dipelajari

- **Password hashing** dengan `bcryptjs`: kenapa password tidak boleh disimpan apa adanya,
  kenapa butuh salt, dan kenapa `bcrypt.compare()` bisa memeriksa password tanpa menyimpan
  password itu sendiri.
- **JWT (JSON Web Token)**: anatomi `header.payload.signature`, cara membuat token
  (`jsonwebtoken`), cara memverifikasi signature dan `exp`, dan kenapa payload **tidak**
  boleh berisi password.
- **Endpoint register dan login**: peran masing-masing (validasi, cek database, hash atau
  bandingkan, balas token), plus alasan role selalu ditentukan server dan bukan diambil dari body.
- **Error 401** sebagai subclass `AppError`, dan kenapa pesan login gagal sengaja
  disamakan untuk email tidak terdaftar maupun password salah.

## Prasyarat

- Node.js **>= 22.18.0**, npm
- SQL Server aktif + database `review_kantin` sudah dibuat dan di-seed di pertemuan-03
  (skrip `db/*.sql` di folder `pertemuan-03-database-backend-crud` dijalankan **sekali saja**)
- `hands-on-1` ini menyalin project **pertemuan-04 `hands-on-2`**, jadi semua yang sudah
  ada di sana (validasi, error handler, Swagger) ikut terbawa

---

### Dari API terbuka ke API yang tahu kamu siapa

Pertemuan-04 kita sudah bisa membuat request yang valid dan membalas dengan JSON yang rapi.
Tapi satu pertanyaan belum terjawab: **request itu datang dari siapa?**

Server HTTP pada dasarnya buta. Yang diteruskannya ke aplikasi cuma `method`, `path`, `header`,
dan `body`. Tidak ada konsep "user" di dalam HTTP — orang yang menekan tombol di aplikasi,
orang yang mengirim `curl` di terminal, dan bot yang menebak endpoint, semuanya terlihat sama
oleh server: sekumpulan byte.

Akibatnya, di project sebelumnya:

- `DELETE /api/v1/stalls/3` bisa dipanggil siapa saja. Tidak ada yang bertanya "kamu pemilik
  warung ini, bukan?"
- `POST /api/v1/stalls` bisa menyamar sebagai pemilik warung mana pun lewat `ownerId` bebas.
- `GET /api/v1/admin/reports` (kalau ada) sama sekali tidak berbeda dari endpoint biasa.

Cara memperbaikinya bukan dengan menyembunyikan URL — URL itu memang publik dan akan tetap
begitu. Yang perlu ditambahkan adalah **bukti identitas** yang ikut dibawa setiap request.
Inilah yang disebut **autentikasi**: proses server memverifikasi bukti tersebut, lalu tahu
pengirimnya user yang mana.

Bukti itu tidak harus berupa password. Kalau password dikirim tiap request, ia akan
mengtravel bolak-balik di jaringan setiap kali user membuka halaman. Karena itu barter
modern memindahkan bukti itu ke **token** yang dibuat server saat login, berlaku terbatas
waktu, dan tidak bisa dipalsukan tanpa rahasia yang sama.

Di hands-on ini kita bangun dua endpoint yang menjadi pintu masuk tukar itu:

```
Client                          Server
  |                               |
  |-- POST /auth/register ------> |  validasi -> simpan (password di-hash)
  |<-- 201 { user } --------------|
  |                               |
  |-- POST /auth/login ---------> |  cek hash -> buat token
  |<-- 200 { token, user } -------|
  |                               |
  |        (menyimpan token)      |
  |                               |
  |   ... Hands-on 2: server      |
  |        baru mulai MENOLAK     |
  |        request tanpa token    |
```

Yang **tidak berubah** dari pertemuan-04: `db/`, `docs/`, `schemas/stallSchema.ts`,
`repositories/stallRepository.ts`, `services/stallService.ts`, dan seluruh lapisan validasi
serta error handling. Yang ditambahkan hanya satu jalur baru: **auth**.

### Titik awal: project pertemuan-04 hands-on-2

Kita tidak membuat project dari nol. Salin folder pertemuan-04 `hands-on-2`, lalu ubah
hanya bagian yang berkaitan dengan autentikasi:

Terminal: Salin project pertemuan-04 hands-on-2 sebagai titik awal

```powershell
Copy-Item -Recurse ..\..\pertemuan-04-api-security-dokumentasi\hands-on-2-dokumentasi-swagger-openapi .
Rename-Item hands-on-2-dokumentasi-swagger-openapi hands-on-1-autentikasi-jwt
Set-Location hands-on-1-autentikasi-jwt
```

Folder `.env` ikut terbawa — dan itu berarti **koneksi database tidak perlu dikonfigurasi
ulang**: tetap `review_kantin` dan user `praktikum_user` yang sama.

Struktur project setelah dilengkapi:

```
hands-on-1-autentikasi-jwt/
├─ package.json  tsconfig.json  drizzle.config.ts
├─ .env                          # SAMA — reuse database pertemuan-03 (review_kantin)
└─ src/
   ├─ index.ts                   # UBAH — mount /api/v1/auth
   ├─ db/                        # SAMA
   ├─ docs/openapi.ts            # UBAH — + schema & path endpoint /auth
   ├─ repositories/userRepository.ts  # BARU — query tabel USERS
   ├─ services/tokenService.ts   # BARU — sign/verify JWT + baca JWT_SECRET
   ├─ services/authService.ts    # BARU — register (hash) dan login (compare)
   ├─ controllers/authController.ts   # BARU
   ├─ routes/authRouter.ts       # BARU — /register dan /login
   ├─ schemas/authSchema.ts      # BARU — validasi body auth (tanpa field role)
   ├─ dtos/authDto.ts            # BARU — bentuk respons auth
   ├─ errors/UnauthorizedError.ts    # BARU — 401
   ├─ errors/  middlewares/      # UBAH — errorHandler cukup satu cabang AppError
   └─ schemas/stallSchema.ts  services/stallService.ts   # SAMA
      controllers/stallController.ts  routes/stallRouter.ts  # SAMA
```

----------

## Langkah 1 — Install jsonwebtoken dan bcryptjs

Project salinan belum punya apa pun untuk menerbitkan token. Kita tambah dua dependensi:

Terminal: Install dependensi autentikasi

```powershell
npm install jsonwebtoken bcryptjs
npm install -D @types/jsonwebtoken
```

Dua alasan memilih paket ini:

- **`jsonwebtoken`** — API sinkron dan sederhana (`jwt.sign` dan `jwt.verify`), paling banyak
  dipakai di tutorial Node.js, dan tipe DefinitelyTyped-nya (`@types/jsonwebtoken`) rapi.
- **`bcryptjs`** — implementasi bcrypt **murni JavaScript**, jadi **tidak butuh compiler C++**
  di laptop mahasiswa. API-nya identik dengan `bcrypt` (paket aslinya), jadi semua contoh di
  internet tetap bisa diikuti. Paket `bcrypt` asli terikat `node-gyp` dan sering gagal
  `npm install` di Windows tanpa Visual Studio Build Tools.

Setelah install, `package.json` berubah jadi:

```json
{
  "name": "hands-on-1",
  "version": "1.0.0",
  "private": true,
  "description": "Hands-on 1 Pertemuan 05 - autentikasi JWT: register, login, hashing password, dan verifikasi token",
  "main": "src/index.ts",
  "scripts": {
    "start": "tsx src/index.ts",
    "dev": "tsx watch src/index.ts"
  },
  "type": "commonjs",
  "dependencies": {
    "@asteasolutions/zod-to-openapi": "^7.3.4",
    "bcryptjs": "^3.0.2",
    "dotenv": "^17.4.2",
    "drizzle-orm": "^1.0.0-rc.5-5935859",
    "express": "^5.2.1",
    "jsonwebtoken": "^9.0.2",
    "mssql": "^11.0.2",
    "swagger-ui-express": "^5.0.1",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/express": "^5.0.6",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/mssql": "^9.1.11",
    "@types/node": "^26.5.1",
    "@types/swagger-ui-express": "^4.1.8",
    "drizzle-kit": "^1.0.0-rc.5-5935859",
    "tsx": "^4.23.13",
    "typescript": "^7.0.2"
  }
}
```

> **Catatan:** `bcryptjs` sudah membawa file `.d.ts`-nya sendiri sejak versi 3, jadi tidak
> perlu `@types/bcryptjs`. Kalau kamu masih memakai `bcryptjs` v2, pasang `@types/bcryptjs`
> secara manual.

## Langkah 2 — Konfigurasi `.env`

Autentikasi JWT butuh dua konfigurasi baru: **rahasia penanda tangan** dan **umur token**.
Tambahkan ke `.env` (isi juga `.env.example`, supaya selalu ada referensinya):

```
# Rahasia penanda tangani JWT. WAJIB diganti di aplikasi nyata —
# siapa pun yang tahu string ini bisa membuat token palsu untuk role apa saja.
JWT_SECRET=kunci-rahasia-kantin-2026
JWT_EXPIRES_IN=2h

# Biaya bcrypt (jumlah iterasi). 10 cukup untuk praktikum, naikkan ke 12+ di produksi.
BCRYPT_SALT_ROUNDS=10
```

Penjelasan singkat tiap variabel:

| Variabel | Arti | Kenapa penting |
| --- | --- | --- |
| `JWT_SECRET` | Kunci HMAC-SHA256 yang menandatangani token | Kalau bocor, penyerang bisa membuat sendiri token dengan role admin tanpa password |
| `JWT_EXPIRES_IN` | Berapa lama token dianggap sah (`2h`, `30m`, `7d`) | Makin pendek = kebocoran token lebih kecil lingkarannya, tapi user lebih sering login ulang |
| `BCRYPT_SALT_ROUNDS` | Iterasi hashing bcrypt (10 berarti 2^10 putaran) | Menurunkan angka ini membuat brute force jauh lebih murah |

> **Perhatian:** di aplikasi nyata `JWT_SECRET` dijaga ketat (Secret Manager, environment
> variable di server, dan sejenisnya). Yang dipakai di `.env` lokal ini hanya untuk belajar —
> jangan pernah dipakai di produksi.

## Langkah 3 — Model User: kenapa password harus di-hash

Sebelum menulis endpoint apa pun, kita perlu memahami model `USERS` yang sudah ada sejak
pertemuan-03. Buka lagi DDL-nya:

Terminal: Lihat definisi tabel USERS

```sql
-- dari pertemuan-03-database-backend-crud/db/02-schema.sql
CREATE TABLE dbo.USERS (
    id            INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_USERS PRIMARY KEY,
    name          NVARCHAR(100) NOT NULL,
    email         NVARCHAR(150) NOT NULL CONSTRAINT UQ_USERS_email UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    role          NVARCHAR(20)  NOT NULL
        CONSTRAINT CK_USERS_role CHECK (role IN ('admin', 'owner', 'customer')),
    created_at    DATETIME2(0)  NOT NULL CONSTRAINT DF_USERS_created_at DEFAULT SYSDATETIME()
);
```

Tiga kolom yang perlu diperhatikan:

1. **`password_hash` — bukan `password`.** Kolomnya sengaja diberi nama `*_hash`. Nama kolom
   adalah dokumentasi: apa pun yang masuk ke sini **bukan** password asli.
2. **`NVARCHAR(255)`.** Hash bcrypt selalu 60 karakter, jadi 255 memberi ruang longgar —
   pola panjang kolom yang umum dipakai untuk kolom credential.
3. **`role` dengan CHECK constraint.** Tiga role saja yang valid: `admin`, `owner`, `customer`.
   Constraint database ini adalah **jaring pengaman terakhir**; logika cek role tetap akan
   ditulis di aplikasi (hands-on 2).

Tabel yang sama sudah terpetakan di `src/db/schema.ts` — tidak ada yang perlu diubah di sana:

```ts
export const users = mssqlTable('USERS', {
  id: int('id').primaryKey().identity(),
  name: nvarchar('name', { length: 100 }).notNull(),
  email: nvarchar('email', { length: 150 }).notNull().unique(),
  passwordHash: nvarchar('password_hash', { length: 255 }).notNull(),
  role: nvarchar('role', { length: 20, enum: ['admin', 'owner', 'customer'] }).notNull(),
  createdAt: datetime2('created_at'),
});
```

### Kenapa password tidak boleh disimpan apa adanya

Kalau kolom `password_hash` diisi dengan password asli (`rahasia123`), maka siapa pun yang
bisa membaca database — admin, dump SQL yang bocor, file backup, atau SQL injection — langsung
punya password semua orang. Dan karena orang memakai password yang sama di banyak situs, satu
kebocoran bisa menghantam beberapa layanan sekaligus.

Solusinya: simpan **hasil hash**, bukan aslinya. Hash adalah fungsi satu arah: dari password
bisa dihitung hash-nya, tapi dari hash **tidak bisa** dikembalikan ke password. Untuk memeriksa
password saat login, server meng-*hash* ulang input lalu **membandingkan hasilnya** dengan hash
yang tersimpan — password aslinya tidak pernah dibutuhkan lagi.

Kenapa **bcrypt**, bukan `crypto.createHash('sha256', password)`?

- SHA-256 memang satu arah dan cepat — justru **terlalu cepat**. Penyerang yang punya hash
  bisa mencoba miliaran tebakan per detik; `bcrypt` sengaja lambat.
- **Salt**: bcrypt mengacak hash dengan salt acak per password. Dua orang dengan password
  `rahasia123` menghasilkan hash **berbeda**, jadi penyerang tidak bisa memakai tabel
  pra-komputasi (rainbow table).
- **Cost factor** (angka `10` di depan hash): jumlah iterasi dikontrol server dan bisa
  dinaikkan seiring hardware makin cepat, tanpa mengubah algoritma.

### Hands-on: ganti placeholder seed dengan hash asli

Seed di pertemuan-03 mengisi `password_hash` dengan nilai **palsu** supaya skripnya ringkas.
Cek dulu apa yang tersimpan sekarang:

Terminal: Periksa password_hash yang ada sekarang

```sql
SELECT email, role, password_hash FROM dbo.USERS WHERE role = 'admin';
-- admin@kantin.test | admin | hash_admin
```

Nilai `hash_admin` **bukan** hash bcrypt, cuma teks. Kalau nanti dipakai di endpoint login,
`bcrypt.compare()` akan selalu mengembalikan `false` dan tidak ada akun yang bisa login.
Karena itu kita perbaiki dengan skrip kecil.

Buat file `pertemuan-05-auth-middleware/db/seed-password-hashes.sql`:

```sql
USE review_kantin;
GO

-- ====================================================== PASSWORD SEED (bcrypt)
-- Seed di pertemuan-03 (db/03-seed.sql) masih memakai placeholder
-- N'hash_admin', N'hash_owner1', dst. Nilai itu BUKAN hash bcrypt, jadi
-- endpoint /auth/login akan selalu gagal membandingkannya.
--
-- Skrip ini mengganti placeholder tersebut dengan hash bcrypt asli.
-- Semua akun di bawah memakai password: 'rahasia123'
--
-- Aman dijalankan berulang kali (idempotent) karena memakai UPDATE,
-- bukan INSERT. Kalau database belum di-seed di pertemuan-03,
-- jalankan dulu db/00..03 di folder pertemuan-03-database-backend-crud.
IF EXISTS (SELECT 1 FROM dbo.USERS)
BEGIN
    -- admin  -> boleh akses semua endpoint (authorize('admin'))
    UPDATE dbo.USERS SET password_hash = N'$2b$10$eYDhA8k96hVOwauOdHcJ/eyLwmLpIXMJcOApklHzRNrAa2yXVweXy'
    WHERE email = N'admin@kantin.test';

    -- owner  -> pemilik warung, belum punya akses endpoint admin
    UPDATE dbo.USERS SET password_hash = N'$2b$10$uDbObu/Mw0BOJ0MNJo9H4.E3RsRtKnpRHBZ4axJr76K0fSn8qYrAe'
    WHERE email = N'tini@kantin.test';

    -- customer -> user biasa, hanya boleh akses endpoint protected
    UPDATE dbo.USERS SET password_hash = N'$2b$10$XayKzWUDvMrQxrSm50SMNeJHtPZxImuhA7uUtk2h3bvD5fVzUfdje'
    WHERE email = N'bagas@student.test';

    -- Verifikasi: kolom password_hash HARUS diawali '$2b$10$'
    SELECT id, email, role, LEFT(password_hash, 7) AS hash_prefix
    FROM dbo.USERS
    WHERE email IN (N'admin@kantin.test', N'tini@kantin.test', N'bagas@student.test');
END
ELSE
BEGIN
    PRINT 'Tabel dbo.USERS belum ada. Jalankan db/02-schema.sql & db/03-seed.sql di pertemuan-03 lebih dulu.';
END
GO
```

Terminal: Jalankan skrip seed password (sekali saja)

```powershell
cd ..\db
sqlcmd -S localhost -E -C -i seed-password-hashes.sql
```

Hasilnya — perhatikan kolom `hash_prefix` sudah berubah jadi `$2b$10$`:

```
┌────┬──────────────────────┬──────────┬─────────────┐
│ id │ email                │ role     │ hash_prefix │
├────┼──────────────────────┼──────────┼─────────────┤
│  1 │ admin@kantin.test    │ admin    │ $2b$10$     │
│  2 │ tini@kantin.test     │ owner    │ $2b$10$     │
│ 12 │ bagas@student.test   │ customer │ $2b$10$     │
└────┴──────────────────────┴──────────┴─────────────┘
```

Tiga akun ini dipakai di hands-on 2 untuk menguji perbedaan **401** (tidak punya akses sama
sekali) dan **403** (sudah login, tapi role-nya tidak cukup).

> **Kenapa `UPDATE`, bukan `INSERT`?** Supaya skripnya idempotent — aman dijalankan berkali-kali
> tanpa menghasilkan user duplikat. Pola yang sama dipakai di `db/02-schema.sql` dan
> `db/03-seed.sql` Pertemuan-03.

## Langkah 4 — Error 401 (`UnauthorizedError`)

Kegagalan autentikasi juga butuh bentuk respons yang konsisten. Daripada menulis
`res.status(401).json(...)` berulang di banyak tempat, kita ikuti pola `AppError` yang sudah
dipakai Pertemuan-04.

Buat `src/errors/UnauthorizedError.ts`:

```ts
import { AppError } from './AppError.ts';

/**
 * Dipakai saat request tidak membawa token yang bisa dipercaya — belum login,
 * token tidak ada, format header salah, signature tidak cocok, atau token kedaluwarsa.
 * Memetakan ke HTTP 401.
 *
 * Bedakan dengan 403 (ForbiddenError, ada di hands-on 2): 401 berarti "siapa kamu?"
 * belum terjawab, 403 berarti "kamu tahu, tapi tidak boleh".
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Token tidak ada atau tidak valid') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}
```

Sekitar 10 baris, tapi langsung memberi kita hal penting: **nama error yang bermakna**.
`throw new UnauthorizedError('Email atau password salah')` jauh lebih bisa dibaca daripada
`throw new Error('INVALID_CREDENTIALS')` lalu diterjemahkan manual di controller.

Sekarang rapikan `src/middlewares/errorHandler.ts`. Di Pertemuan-04 cabangnya masih
mendaftarkan tiap subclass satu per satu:

```ts
// SEBELUM (pertemuan-04) — harus ditambah setiap kali ada error class baru
if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AppError) {
```

Semua subclass sudah mewarisi `AppError`, jadi cukup satu cabang — dan tidak perlu disentuh
lagi meski nanti ada `ForbiddenError` di hands-on 2:

```ts
// SESUDAH
if (error instanceof AppError) {
```

Buat juga `src/dtos/authDto.ts` — bentuk data yang dikembalikan ke client:

```ts
/** Data user yang aman dikirim ke client — TIDAK ikut menyertakan passwordHash. */
export interface AuthUserDto {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'owner' | 'customer';
}

export interface RegisterResponseDto {
  user: AuthUserDto;
}

export interface LoginResponseDto {
  /** Token JWT mentah. Client mengirimnya kembali di header Authorization. */
  token: string;
  /** Selalu 'Bearer' — penanda cara penyebutan token di header. */
  tokenType: 'Bearer';
  /** Umur token yang masih berlaku, mis. '2h'. */
  expiresIn: string;
  user: AuthUserDto;
}
```

Perhatikan `AuthUserDto` **tidak punya** `passwordHash`. Inilah gunanya DTO: bentuk respons API
tidak harus sama dengan bentuk tabel. Kalau kita membalas `row` database apa adanya,
`passwordHash` ikut terkirim ke client.

## Langkah 5 — Validasi input auth (`src/schemas/authSchema.ts`)

Aturan Pertemuan-04 (validasi dengan zod) tetap berlaku di endpoint baru. Yang perlu kita
tambah adalah **aturan khusus auth** — dan satu keputusan yang penting.

Buat `src/schemas/authSchema.ts`:

```ts
import { z } from 'zod';

// ------------------------------------------------------------------- fields
// bcrypt hanya memproses 72 byte pertama, jadi password dibatasi di situ.
const passwordSchema = z
  .string({ required_error: 'password wajib diisi' })
  .min(8, 'password minimal 8 karakter')
  .max(72, 'password maksimal 72 karakter');

const emailSchema = z
  .string({ required_error: 'email wajib diisi' })
  .trim()
  .toLowerCase()
  .email('format email tidak valid')
  .max(150, 'email maksimal 150 karakter');

// -------------------------------------------------------------------- body
// CATATAN: schema ini SENGAJA tidak punya field `role`.
// Role diberikan server saat register (selalu 'customer'). Kalau `role`
// diterima dari body, siapa pun bisa mendaftarkan diri sebagai admin.
//
// .strict() menolak kunci tak dikenal, termasuk percobaan mengirim `role`.
// zod v3 menerima pesan kustom di sini, jadi pesan default-nya yang bahasa
// Inggris bisa diganti agar konsisten dengan pesan validasi yang lain.
export const registerSchema = z
  .object({
    name: z
      .string({ required_error: 'name wajib diisi' })
      .trim()
      .min(3, 'name minimal 3 karakter')
      .max(100, 'name maksimal 100 karakter'),
    email: emailSchema,
    password: passwordSchema,
  })
  .strict({ message: 'body hanya boleh berisi name, email, dan password' });

export const loginSchema = z
  .object({
    email: emailSchema,
    // Di login cukup dicek tidak kosong; aturan panjang hanya berlaku saat register.
    password: z.string({ required_error: 'password wajib diisi' }).min(1, 'password wajib diisi'),
  })
  .strict({ message: 'body hanya boleh berisi email dan password' });

// ------------------------------------------------------------------ types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

Tiga hal yang perlu dicermati di file ini:

**1. `role` tidak ada di schema — dan itu disengaja.** Kalau `role` diterima dari body,
pengguna terdaftar bisa mengirim `{"role": "admin"}` dan langsung jadi admin. Peran yang aman
adalah: **server yang menentukan role**, client hanya memilih "aku mau daftar". `.strict()`
lalu menolak request yang mencoba mengirim field itu.

**2. `.trim().toLowerCase()` pada email.** Tanpa ini, `Budi@Test.COM` dan `budi@test.com`
akan dianggap dua user berbeda — padahal `email` punya `UNIQUE`, jadi orang bisa mendaftarkan
akun dengan email yang sebenarnya sama. Normalisasi di layer validasi menyelesaikan masalah ini
di satu tempat.

**3. Batas 72 karakter pada password.** bcrypt hanya memproses 72 byte pertama; karakter
setelah itu **diabaikan diam-diam**. Kalau validasinya longgar, `rahasia123` disambung 100
huruf akan dianggap password yang sah padahal 100 huruf itu tidak pernah dicek. Menyamakan
batas validasi dengan batas algoritma menutup celah itu.

## Langkah 6 — `UserRepository` (`src/repositories/userRepository.ts`)

Repository ini untuk tabel `USERS`. Dia **tidak** tahu apa itu hashing — dia hanya membaca
dan menulis baris.

Buat `src/repositories/userRepository.ts`:

```ts
import { eq } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { users } from '../db/schema.ts';

/** Sama dengan enum kolom `role` di tabel USERS (drizzle sudah meng-infer-nya). */
export type UserRole = 'admin' | 'owner' | 'customer';

export interface CreateUserInput {
  name: string;
  email: string;
  /** Sudah di-hash oleh AuthService — repository tidak pernah hashing sendiri. */
  passwordHash: string;
  role: UserRole;
}

export class UserRepository {
  async findByEmail(email: string) {
    const db = await getDb();
    const rows = await db.select().from(users).where(eq(users.email, email));
    return rows[0];
  }

  async findById(id: number) {
    const db = await getDb();
    const rows = await db.select().from(users).where(eq(users.id, id));
    return rows[0];
  }

  // MSSQL: pengembalian baris hasil insert memakai .output() (bukan .returning()).
  // created_at tidak diisi di sini karena sudah punya DEFAULT SYSDATETIME() di DDL.
  async create(input: CreateUserInput) {
    const db = await getDb();
    const rows = await db
      .insert(users)
      .output()
      .values({
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role,
      });
    return rows[0];
  }
}
```

Dua detail yang mengikuti pola Pertemuan-03:

- **`.output()` bukan `.returning()`** — API Drizzle untuk MSSQL berbeda dari Postgres.
- **`createdAt` tidak diisi** — kolomnya sudah punya `DEFAULT SYSDATETIME()` di DDL, jadi
  membiarkannya ke database lebih benar daripada mengulang nilai default di aplikasi.

`findById` belum dipakai di hands-on ini, tapi akan berguna di hands-on 2 saat middleware butuh
memuat user berdasarkan `id` dari token.

## Langkah 7 — `TokenService`: membuat dan memverifikasi JWT

Buat `src/services/tokenService.ts`:

```ts
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { UserRole } from '../repositories/userRepository.ts';

/** Bentuk `req.user` nanti diisi oleh middleware auth (hands-on 2). */
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

/**
 * Rahasia penanda tangani JWT dibaca dari .env.
 * Sengaja TIDAK diberi nilai default: kalau lupa diset, server harus berhenti
 * dengan pesan jelas, bukan diam-diam menandatangani token dengan string tebakan.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET belum diset di .env — token tidak bisa dibuat atau diverifikasi');
  }
  return secret;
}

/**
 * Umur token (format '2h', '30m', '7d'). Tipe yang diharapkan jsonwebtoken
 * adalah tipe internal miliknya sendiri, jadi string dari env di-cast lewat
 * SignOptions agar strict TypeScript tidak protes.
 */
function getExpiresIn(): SignOptions['expiresIn'] {
  return (process.env.JWT_EXPIRES_IN ?? '2h') as SignOptions['expiresIn'];
}

/**
 * Membuat token JWT. Isinya (payload):
 * - sub : identitas user
 * - name, email, role : data yang dibutuhkan server untuk otorisasi nanti
 * - iat, exp : dibuat kapan dan kedaluwarsa kapan (otomatis oleh jsonwebtoken)
 *
 * JANGAN pernah menaruh password di payload — payload hanya di-encode
 * (base64url), bukan dienkripsi, sehingga bisa dibaca siapa pun yang punya token.
 */
export function signToken(user: AuthUser): string {
  return jwt.sign(
    { sub: String(user.id), name: user.name, email: user.email, role: user.role },
    getJwtSecret(),
    {
      algorithm: 'HS256',
      expiresIn: getExpiresIn(),
    },
  );
}

/**
 * Membalik proses `signToken`: memastikan signature cocok dengan JWT_SECRET
 * dan token belum kedaluwarsa, lalu mengembalikan AuthUser.
 *
 * Melempar TokenExpiredError atau JsonWebTokenError kalau tidak valid —
 * pemanggil yang memutuskan cara membalas ke client (middleware auth jadi 401).
 */
export function verifyToken(token: string): AuthUser {
  const payload = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });

  if (typeof payload === 'string') {
    throw new jwt.JsonWebTokenError('Payload token bukan objek JSON');
  }

  const id = Number(payload.sub);
  const { name, email, role } = payload as {
    name?: string;
    email?: string;
    role?: UserRole;
  };

  if (!Number.isInteger(id) || !name || !email || !role) {
    throw new jwt.JsonWebTokenError('Payload token tidak memuat data user yang lengkap');
  }

  return { id, name, email, role };
}
```

Tiga keputusan desain yang perlu dipahami:

**`getJwtSecret()` tidak punya nilai default.** Di `src/db/index.ts` Pertemuan-03, nilai
koneksi boleh punya default (`localhost`, `1433`) karena tidak bersifat rahasia. `JWT_SECRET`
berbeda: kalau tidak di-set dan kita diam-diam memakai string tebakan, aplikasi tetap **jalan**
sambil menandatangani token dengan kunci yang bisa ditebak siapa saja. Lebih baik gagal saat
start dengan pesan yang jelas.

**`algorithms: ['HS256']` saat verify.** Tanpa ini, server menerima token yang ditandatangani
dengan algoritma lain — termasuk `none`, yang berarti tanpa signature sama sekali. Menyebutkan
daftar algoritma yang diizinkan menutup kelas kerentanan itu.

**`sub` dipakai untuk identitas, bukan `id`.** `sub` (subject) adalah klaim standar JWT untuk
"tentang siapa token ini". Kita tetap menyimpannya sebagai string lalu mengubahnya kembali ke
number, karena klaim JWT pada dasarnya selalu string.

## Langkah 8 — Register, Login, Controller, dan Router

Sekarang logika bisnisnya. `AuthService` adalah tempat hashing dan pembuatan token terjadi.

Buat `src/services/authService.ts`:

```ts
import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/userRepository.ts';
import { signToken, type AuthUser } from './tokenService.ts';
import { AppError } from '../errors/AppError.ts';
import { UnauthorizedError } from '../errors/UnauthorizedError.ts';
import type { LoginInput, RegisterInput } from '../schemas/authSchema.ts';
import type { AuthUserDto, LoginResponseDto } from '../dtos/authDto.ts';

type UserRow = NonNullable<Awaited<ReturnType<UserRepository['findByEmail']>>>;

/** Biaya bcrypt: jumlah iterasi hashing. Makin besar = makin lambat dan aman. */
function getSaltRounds(): number {
  return Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
}

export class AuthService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  // Mapping row DB -> DTO. Perhatikan passwordHash SENGAJA tidak ikut,
  // itulah gunanya DTO: bentuk respons API tidak sama dengan bentuk tabel.
  private toDto(row: UserRow): AuthUserDto {
    return { id: row.id, name: row.name, email: row.email, role: row.role };
  }

  async register(input: RegisterInput): Promise<AuthUserDto> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError(409, 'Email sudah terdaftar');
    }

    // Password di-hash dengan salt acak. Password asli tidak pernah disimpan
    // dan tidak pernah dikembalikan ke client.
    const passwordHash = await bcrypt.hash(input.password, getSaltRounds());

    const row = await this.userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      // Role ditentukan server, bukan client. Pendaftaran mandiri = customer.
      role: 'customer',
    });
    if (!row) throw new AppError(500, 'User gagal dibuat');

    return this.toDto(row);
  }

  async login(input: LoginInput): Promise<LoginResponseDto> {
    const row = await this.userRepository.findByEmail(input.email);

    // Pesan sengaja sama untuk "email tidak terdaftar" dan "password salah",
    // supaya penyerang tidak bisa menebak email mana yang memang terdaftar.
    if (!row) throw new UnauthorizedError('Email atau password salah');

    const passwordValid = await bcrypt.compare(input.password, row.passwordHash);
    if (!passwordValid) throw new UnauthorizedError('Email atau password salah');

    const user: AuthUser = this.toDto(row);
    return {
      token: signToken(user),
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_EXPIRES_IN ?? '2h',
      user,
    };
  }
}
```

Tiga hal yang menentukan di file ini:

**1. `bcrypt.compare()`, bukan `password === row.passwordHash`.** `compare` menghitung hash
dari input dengan salt yang tertanam di hash tersimpan, lalu membandingkan hasilnya. Inilah
gunanya hash: kita bisa memeriksa password tanpa pernah menyimpannya. Sekalian, inilah yang
membuat `bcrypt.compare()` otomatis **menolak** nilai `hash_admin` dari Langkah 3 — formatnya
bukan hash bcrypt, jadi tidak akan pernah cocok.

**2. Pesan login gagal disamakan.** Perhatikan `if (!row)` dan `if (!passwordValid)`
menghasilkan pesan identik. Kalau pesan-nya dibedakan ("email tidak terdaftar" versus
"password salah"), endpoint ini berubah jadi alat untuk mengecek apakah email seseorang
terdaftar di sistem kita.

**3. Role ditulis server.** `role: 'customer'` ditulis langsung di kode, bukan dibaca dari
`input`. Tidak ada jalur di mana client bisa memengaruhi nilai ini — dan itulah yang membuat
`registerSchema` tanpa field `role` konsisten dengan implementasinya.

Sekarang controller-nya. `src/controllers/authController.ts`:

```ts
import type { Request, Response } from 'express';
import { AuthService } from '../services/authService.ts';
import { getValidated } from '../middlewares/validate.ts';
import type { LoginInput, RegisterInput } from '../schemas/authSchema.ts';

/**
 * Register dan login sengaja TIDAK memakai token apa pun — justru di endpoint
 * inilah token dibuat. Error yang dilempar apa pun (email bentrok, password salah)
 * akan diteruskan Express ke errorHandler.
 */
export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService = new AuthService()) {
    this.authService = authService;
  }

  register = async (_req: Request, res: Response): Promise<void> => {
    const body = getValidated<RegisterInput>(res, 'body');
    const user = await this.authService.register(body);
    res.status(201).json({ status: 'success', data: { user } });
  };

  login = async (_req: Request, res: Response): Promise<void> => {
    const body = getValidated<LoginInput>(res, 'body');
    const data = await this.authService.login(body);
    res.status(200).json({ status: 'success', data });
  };
}
```

Tidak ada `try/catch` — sama seperti Pertemuan-04, Express 5 meneruskan error dari handler
async ke `errorHandler` secara otomatis.

Lalu router-nya, `src/routes/authRouter.ts`:

```ts
import { Router } from 'express';
import { AuthController } from '../controllers/authController.ts';
import { validate } from '../middlewares/validate.ts';
import { loginSchema, registerSchema } from '../schemas/authSchema.ts';

const authRouter = Router();
const authController = new AuthController();

// Kedua route ini PUBLIK. Belum ada authenticate di sini — dan memang tidak
// boleh ada, karena token justru dibuat oleh endpoint login.
authRouter.post('/register', validate(registerSchema, 'body'), authController.register);
authRouter.post('/login', validate(loginSchema, 'body'), authController.login);

export { authRouter };
```

Terakhir, pasangkan di `src/index.ts`:

```ts
// Autentikasi: register dan login. Dua-duanya route publik.
app.use('/api/v1/auth', authRouter);

app.use('/api/v1/stalls', stallRouter);
```

## Langkah 9 — Verifikasi Token

Sebelum lanjut ke hands-on 2, kita buktikan dulu bahwa token yang keluar benar-benar berisi
yang kita kira, dan bahwa isinya tidak bisa dipalsukan.

### Membedah token secara manual

Login dulu, lalu ambil tokennya:

Terminal: Login dan simpan token ke variabel

```powershell
$login = Invoke-RestMethod -Uri http://localhost:3000/api/v1/auth/login `
  -Method Post -ContentType 'application/json' `
  -Body '{"email":"admin@kantin.test","password":"rahasia123"}'

$token = $login.data.token
$login.data.user
$token.Length
```

Contoh keluaran `user` (tanpa `passwordHash` — DTO bekerja):

```
id   : 1
name : Admin Kantin
email: admin@kantin.test
role : admin
```

Tokennya adalah string panjang, dan yang kita lihat nanti ini hanya **bagian payload**-nya.
Sekarang kita uraikan:

Terminal: Pisahkan dan decode header serta payload

```powershell
$parts = $token.Split('.')
$parts.Count                      # 3 — header, payload, signature

function Decode($segment) {
  [System.Text.Encoding]::UTF8.GetString(
    [System.Convert]::FromBase64String(
      $segment.Replace('-', '+').Replace('_', '/') + '=' * ((4 - $segment.Length % 4) % 4)))
}

Decode $parts[0]                  # header
Decode $parts[1]                  # payload
$parts[2]                         # signature (tidak bisa di-decode)
```

Hasilnya:

```
header : {"alg":"HS256","typ":"JWT"}
payload: {"sub":"1","name":"Admin Kantin","email":"admin@kantin.test","role":"admin",
          "iat":1790679286,"exp":1790686486}
signature: eX6ekwjaf0ww6PeTbXT3Wt...
```

Sekarang beberapa hal yang langsung terlihat:

- **Tiga bagian, dipisah titik.** Persis seperti yang sudah dibahas di materi.
- **Payload bisa dibaca siapa pun.** Tidak ada enkripsi sama sekali — cuma `base64url`.
  Perhatikan `role: "admin"` terbaca jelas. Inilah alasan password **tidak boleh** masuk ke
  payload: kalau iya, password semua orang bisa dibaca dari token yang bocor (misal lewat
  `localStorage` atau log browser).
- **`iat` dan `exp` berdampingan selisih 7200 detik** = 2 jam, sesuai `JWT_EXPIRES_IN=2h`.
- **Signature tidak bisa di-decode.** Ia hasil HMAC-SHA256 dari header + payload + `JWT_SECRET`.
  Kita tidak bisa memalsukannya tanpa tahu rahasianya.

### Membuktikan token tidak bisa dipalsukan

Coba ubah satu karakter di payload, lalu verifikasi ulang dengan `verifyToken`:

Terminal: Coba verifikasi token yang dimodifikasi

```powershell
$parts[1] = $parts[1].Substring(0, $parts[1].Length - 1) + 'A'   # ubah 1 karakter
($parts -join '.').Length
```

Token yang sudah diubah totalnya panjangnya sama, dan secara visual juga tetap "terlihat seperti
JWT". Tapi `verifyToken` akan menolaknya, karena satu karakter perubahan di payload membuat
signature yang dihitung ulang **tidak sama lagi**:

```
JsonWebTokenError: invalid signature
```

Perhatikan apa yang **tidak** terjadi: server tidak membaca payload-nya lalu memutuskan
"ah, role-nya admin, sudahlah". Verifikasi dibangun di atas **signature** dulu. Itulah yang
membuat JWT tidak bisa dipalsukan hanya dengan mengubah isi string.

### Ringkasan

| Yang dijamin | Oleh apa |
| --- | --- |
| Token benar-benar dari server kita | Signature HMAC dengan `JWT_SECRET` |
| Token belum kedaluwarsa | Field `exp` dan `JWT_EXPIRES_IN` |
| Algoritma yang diterima terbatas | `algorithms: ['HS256']` saat verify |
| Password tidak pernah terekspos | Tidak masuk payload; kolom DB berisi hash |

Yang **belum** ada: server masih menerima request **tanpa token** di endpoint warung mana pun.
Itu disengaja — itu bagian hands-on 2.

## Langkah 10 — Dokumentasi di Swagger dan rakit di entry point

Supaya `/docs` ikut memuat endpoint baru, tambahkan di `src/docs/openapi.ts`. Pertama, schema
respons:

```ts
// ------------------------------------------------------------------- auth
// Komponen schema untuk endpoint /auth. Body request-nya (registerSchema,
// loginSchema) juga dipakai sebagai validasi di middleware `validate`.
const authUserSchema = registry.register(
  'AuthUser',
  z.object({
    id: z.number().openapi({ example: 1 }),
    name: z.string().openapi({ example: 'Admin Kantin' }),
    email: z.string().openapi({ example: 'admin@kantin.test' }),
    role: z.enum(['admin', 'owner', 'customer']).openapi({ example: 'admin' }),
  }),
);

const registerInput = registry.register('RegisterInput', registerSchema);
const loginInput = registry.register('LoginInput', loginSchema);

const registerResponse = registry.register(
  'RegisterResponse',
  z.object({
    status: z.literal('success'),
    data: z.object({ user: authUserSchema }),
  }),
);

const loginResponse = registry.register(
  'LoginResponse',
  z.object({
    status: z.literal('success'),
    data: z.object({
      token: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
      tokenType: z.literal('Bearer'),
      expiresIn: z.string().openapi({ example: '2h' }),
      user: authUserSchema,
    }),
  }),
);
```

Lalu daftarkan kedua path-nya di bagian `// ----- routes`:

```ts
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/register',
  summary: 'Daftar akun baru',
  description:
    'Route publik. Role selalu diisi server sebagai `customer` — field `role` ' +
    'tidak ada di schema sehingga `.strict()` akan menolaknya.',
  request: {
    body: {
      description: 'Data pendaftaran',
      content: { 'application/json': { schema: registerInput } },
    },
  },
  responses: {
    201: {
      description: 'Akun berhasil dibuat',
      content: { 'application/json': { schema: registerResponse } },
    },
    400: {
      description: 'Body tidak valid',
      content: { 'application/json': { schema: errorSchema } },
    },
    409: {
      description: 'Email sudah terdaftar',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/login',
  summary: 'Login dan terima token JWT',
  description:
    'Route publik. Suksesnya login mengembalikan token JWT yang nanti dikirim ' +
    'client di header `Authorization: Bearer <token>`.',
  request: {
    body: {
      description: 'Kredensial login',
      content: { 'application/json': { schema: loginInput } },
    },
  },
  responses: {
    200: {
      description: 'Login berhasil, token dikembalikan',
      content: { 'application/json': { schema: loginResponse } },
    },
    400: {
      description: 'Body tidak valid',
      content: { 'application/json': { schema: errorSchema } },
    },
    401: {
      description: 'Email atau password salah',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
});
```

> **Perhatikan:** `registerSchema` dan `loginSchema` yang sama dipakai **dua kali** — untuk
> validasi request dan untuk mendokumentasikan request. Tidak ada definisi ganda. Itulah
> yang membuat zod di Pertemuan-04 jadi benar-benar menguntungkan.

## Langkah 11 — Jalankan dan uji

Terminal: Jalankan server (development)

```powershell
npm run dev
```

### A. Terminal (curl)

Terminal: Register akun baru

```powershell
curl.exe -X POST http://localhost:3000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"name\": \"Budi Santoso\", \"email\": \"budi@test.com\", \"password\": \"rahasia123\"}'
```

```json
1  {
2    "status": "success",
3    "data": {
4      "user": {
5        "id": 16,
6        "name": "Budi Santoso",
7        "email": "budi@test.com",
8        "role": "customer"
9      }
10   }
11 }
```

Perhatikan `role` bernilai `"customer"` padahal kita **tidak pernah mengirim** role di request
— server yang menetapkannya. Dan tidak ada `passwordHash` di respons.

Terminal: Register dengan email yang sama (harus 409)

```powershell
curl.exe -X POST http://localhost:3000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"name\": \"Budi Santoso\", \"email\": \"budi@test.com\", \"password\": \"rahasia123\"}'
```

```json
1  {
2    "status": "fail",
3    "message": "Email sudah terdaftar"
4  }
```

Terminal: Coba daftar jadi admin (harus 400)

```powershell
curl.exe -X POST http://localhost:3000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"name\": \"Penyusup\", \"email\": \"penyusup@test.com\", \"password\": \"rahasia123\", \"role\": \"admin\"}'
```

```json
1  {
2    "status": "fail",
3    "message": "Validasi gagal",
4    "errors": [
5      {
6        "field": "body",
7        "message": "body hanya boleh berisi name, email, dan password"
8      }
9    ]
10 }
```

`.strict()` menolak `role` sebelum request sampai ke service. Ini defense in depth: kalau suatu
saat validasi dihapus, `AuthService` juga akan mengabaikan role dari input.

Terminal: Login dengan akun seed (dapat token)

```powershell
curl.exe -X POST http://localhost:3000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\": \"admin@kantin.test\", \"password\": \"rahasia123\"}'
```

```json
1  {
2    "status": "success",
3    "data": {
4      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6IkFkbWluIEthbnRpbiIsImVtYWlsIjoiYWRtaW5Aa2FudGluLnRlc3QiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3OTA2NzkyODYsImV4cCI6MTc5MDY4NjQ4Nn0.eX6ekwjaf0ww6PeTbXT3WtoatBmTj-eoZHYe7iE-e6U",
5      "tokenType": "Bearer",
6      "expiresIn": "2h",
7      "user": {
8        "id": 1,
9        "name": "Admin Kantin",
10       "email": "admin@kantin.test",
11       "role": "admin"
12     }
13   }
14 }
```

Terminal: Login dengan password salah (harus 401)

```powershell
curl.exe -X POST http://localhost:3000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\": \"admin@kantin.test\", \"password\": \"salahbanget\"}'
```

```json
1  {
2    "status": "fail",
3    "message": "Email atau password salah"
4  }
```

Terminal: Login dengan email yang tidak terdaftar (harus 401, pesan sama)

```powershell
curl.exe -X POST http://localhost:3000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\": \"tidak@ada.test\", \"password\": \"rahasia123\"}'
```

```json
1  {
2    "status": "fail",
3    "message": "Email atau password salah"
4  }
```

Pesannya identik dengan kasus sebelumnya — memang itu tujuannya.

Terminal: Buktikan hash benar-benar tersimpan (bukan password asli)

```powershell
# Cek isi kolom di database
sqlcmd -S localhost -E -C -Q "SELECT email, password_hash FROM dbo.USERS WHERE email = 'budi@test.com'"

# Bandingkan dengan hash bcrypt langsung
node -e "const b=require('bcryptjs'); console.log('cocok:', b.compareSync('rahasia123', '<hash dari database>'))"
```

Hash-nya akan berbentuk `$2b$10$...` — 60 karakter, dan berbeda tiap kali meskipun passwordnya
sama, karena salt-nya acak.

### B. Postman

1. **Buka Postman** dan buat collection baru `Review Kantin - Pertemuan 5`.
2. **Tambah request "Register"**
   - Method `POST`, URL `http://localhost:3000/api/v1/auth/register`
   - Tab **Body** → **raw** → **JSON**:

     ```json
     {
       "name": "Siti Aminah",
       "email": "siti@test.com",
       "password": "rahasia123"
     }
     ```

   - Klik **Send**. Dapat respons `201` dengan `role: "customer"`.
3. **Tambah request "Login admin"**
   - Method `POST`, URL `http://localhost:3000/api/v1/auth/login`
   - Body:

     ```json
     {
       "email": "admin@kantin.test",
       "password": "rahasia123"
     }
     ```

   - Klik **Send**, lalu salin nilai `token` dari respons.
4. **Uji kasus gagal** — ubah `password` jadi `salahbanget`, kirim ulang, perhatikan `401`
   dengan pesan `Email atau password salah`.
5. **Kirim `role` saat register** — tambahkan `"role": "admin"` di body register, kirim, dan
   perhatikan validasi menolak dengan `400`.

### C. Swagger UI

Buka `http://localhost:3000/docs`. Endpoint `POST /api/v1/auth/register` dan
`POST /api/v1/auth/login` sudah muncul di bagian **auth** dengan bentuk request dan response
yang terbaca rapi. Coba keduanya dari sana — hasilnya sama persis dengan Postman.

> **Belum ada tombol "Authorize".** Di bagian atas `/docs` memang belum ada tombol itu,
> karena belum ada endpoint yang butuh token. Tombol itu — dan seluruh mekanisme
> middleware-nya — baru muncul di **hands-on 2**.

### Rangkuman kasus uji

| Kasus | Request | Hasil |
| --- | --- | --- |
| Register valid | `POST /auth/register` dengan name/email/password benar | `201` + user `role: customer` |
| Email duplikat | Register lagi dengan email sama | `409` Email sudah terdaftar |
| Password terlalu pendek | `password: "123"` | `400` password minimal 8 karakter |
| Coba kirim role | Register + `"role": "admin"` | `400` body hanya boleh berisi name, email, dan password |
| Login valid | `admin@kantin.test` / `rahasia123` | `200` + token + user |
| Password salah | `password: "salahbanget"` | `401` Email atau password salah |
| Email tak terdaftar | `tidak@ada.test` | `401` Email atau password salah (pesan sama) |
| Email ternormalisasi | Register `Budi@Test.COM ` (ada spasi) | Disimpan sebagai `budi@test.com` |
| Password terpotong | Register password lebih dari 72 karakter | `400` password maksimal 72 karakter |
| Data warung lama | `GET /api/v1/stalls` tanpa token | Tetap `200` (belum diproteksi) |

## Troubleshooting

| Gejala | Kemungkinan penyebab dan solusi |
| --- | --- |
| `JsonWebTokenError: invalid signature` saat login | `JWT_SECRET` di `.env` berubah setelah token dibuat. Login ulang untuk mendapat token baru. |
| `Error: JWT_SECRET belum diset di .env` | Baris `JWT_SECRET` belum ada di `.env`. Salin ulang dari `.env.example`, lalu restart server (`npm run dev`). |
| `401 Email atau password salah` padahal email dan password benar | Seed Pertemuan-03 masih berisi `hash_admin`. Jalankan `db/seed-password-hashes.sql` di folder `pertemuan-05-auth-middleware`. |
| `bcrypt.compare()` selalu `false` | `password_hash` bukan hasil bcrypt (misal `hash_admin`). Jalankan ulang skrip seed. |
| `npm install` gagal di `bcrypt` (bukan `bcryptjs`) | Paket `bcrypt` asli butuh compiler C++. Paket yang dipakai hands-on ini, `bcryptjs` (murni JS), tidak butuh itu. |
| `Cannot find module 'jsonwebtoken'` | `npm install` belum dijalankan di folder hands-on ini. |
| `bcrypt.compare is not a function` | Versi `bcryptjs` terlalu lama (v2 ke bawah punya API berbeda). Jalankan `npm install bcryptjs@latest`. |
| Registrasi berhasil tapi respons masih ada `passwordHash` | Controller membalas `row` database langsung, bukan hasil `toDto()`. Pastikan `register` mengembalikan `this.toDto(row)`. |
| Pesan `Unrecognized key(s) in object` (bahasa Inggris) | Pesan bawaan zod — berarti `.strict()` belum dikasih pesan kustom. Lihat Langkah 5. |

## Struktur Project

```
hands-on-1-autentikasi-jwt/
├─ package.json              # + jsonwebtoken, bcryptjs
├─ tsconfig.json
├─ drizzle.config.ts         # referensi drizzle-kit (tidak dipakai di hands-on ini)
├─ .env  .env.example        # + JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_SALT_ROUNDS
└─ src/
   ├─ index.ts               # + app.use('/api/v1/auth', authRouter)
   ├─ docs/openapi.ts        # + schema dan path endpoint /auth
   ├─ controllers/
   │  ├─ stallController.ts  # SAMA
   │  └─ authController.ts   # BARU — register, login
   ├─ services/
   │  ├─ stallService.ts     # SAMA
   │  ├─ tokenService.ts     # BARU — signToken, verifyToken, AuthUser
   │  └─ authService.ts      # BARU — bcrypt hash dan compare
   ├─ repositories/
   │  ├─ stallRepository.ts  menuItemRepository.ts   # SAMA
   │  └─ userRepository.ts   # BARU — findByEmail, findById, create
   ├─ schemas/
   │  ├─ stallSchema.ts      # SAMA
   │  └─ authSchema.ts       # BARU — registerSchema, loginSchema
   ├─ dtos/
   │  ├─ stallDto.ts         # SAMA
   │  └─ authDto.ts          # BARU — AuthUserDto, LoginResponseDto
   ├─ errors/
   │  ├─ AppError.ts         # SAMA
   │  ├─ NotFoundError.ts    # SAMA
   │  ├─ ValidationError.ts  # SAMA
   │  └─ UnauthorizedError.ts    # BARU — 401
   └─ middlewares/
      ├─ validate.ts         # SAMA
      ├─ notFound.ts         # SAMA
      └─ errorHandler.ts     # UBAH — cukup satu cabang instanceof AppError
```

Skema DDL tetap dikelola di `pertemuan-03-database-backend-crud/db/*.sql` (recall ERD).
Tidak ada migration di hands-on ini — satu-satunya perubahan data adalah
`pertemuan-05-auth-middleware/db/seed-password-hashes.sql` yang mengganti nilai placeholder
pada baris yang sudah ada.

## Bacaan Lanjutan

- [jsonwebtoken — npm](https://www.npmjs.com/package/jsonwebtoken) — API `sign` dan `verify`, daftar error (`TokenExpiredError`, `JsonWebTokenError`)
- [Auth0 — Cookies vs Tokens](https://auth0.com/blog/cookies-vs-tokens-whats-the-difference/) — kapan memilih session, kapan JWT
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) — kenapa hash yang lambat (bcrypt, argon2) lebih aman
- [OWASP REST Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html) — 401 versus 403, header `Authorization`
- [jwt.io](https://jwt.io) — dekoder JWT interaktif untuk mencoba token buatanmu sendiri