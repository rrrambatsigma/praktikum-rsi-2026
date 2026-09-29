# Hands-on 2 — Middleware Otorisasi & Route Terlindungi

<!--
  CATATAN UNTUK DEVELOPER SITUS (markdown comment ini TIDAK akan tampil di Astro/GitHub):
  - File ini adalah sumber konten halaman web — narasi + kode, siap disalin.
  - Setiap blok kode memiliki label file yang ditulis di kalimat SEBELUMNYA (mis.
    `src/middlewares/auth.ts`). Saat mengonversi ke komponen Astro, pakai
    `<Code title="<path>" lang="..." />` supaya label file muncul di atas kode.
  - Blok dengan label "Terminal: ..." = perintah yang dijalankan mahasiswa (bukan kode aplikasi).
  - Blok JSON bernomor = contoh OUTPUT respons API (bukan kode yang diketik mahasiswa).
  - Paragraf teks bebas = narasi, silakan diedit ringan.
  - Tabel "Kasus uji" boleh dirender apa adanya.
-->

Hands-on ini melanjutkan **project pertemuan-05 `hands-on-1-autentikasi-jwt`**. Di sana kita sudah
punya endpoint `register` dan `login`, dan setiap user yang berhasil login mendapat **token JWT**.
Tapi token itu belum dipakai apa pun — masih tersimpan di respons dan tidak pernah dibaca lagi.

Di hands-on ini token tersebut mulai **dipakai**: setiap request ke endpoint yang terlindungi harus
membawa token di header, dan server memverifikasinya sebelum menjalankan bisnis. Selain itu kita
membuat **middleware otorisasi** yang mengecek role, sehingga `admin`, `owner`, dan `customer`
mendapat perlakuan berbeda.

> File ini adalah sumber langkah utama.
> Topik ini bagian dari Pertemuan 05 — **Autentikasi dan Middleware**.

## Yang dipelajari

- **Middleware autentikasi**: cara membaca header `Authorization`, memverifikasi signature JWT,
  dan menaruh hasilnya di `req.user` supaya handler lain tidak perlu mengurai token lagi.
- **Perbedaan 401 dan 403**: 401 berarti "siapa kamu?" (token tidak ada atau tidak valid), 403
  berarti "kamu tahu, tapi tidak boleh" (token valid, role tidak cukup).
- **Middleware berparameter**: menulis satu `authorize(...roles)` yang bisa dipakai ulang untuk
  endpoint apa pun, alih-alih menyalin `if (role === ...)` ke setiap controller.
- **Otorisasi tingkat objek**: belanja role saja belum cukup — warung yang diedit juga harus
  milik user tersebut.
- **Mempercayai token, bukan body**: field `ownerId` dan `userId` diambil dari `req.user`, dan
  dihapus dari schema request supaya client tidak bisa mengirimnya.
- **Tipe `req.user` di TypeScript**: cara memberi tahu compiler bahwa `Request` Express punya
  properti `user`, lewat *augmentasi* global.

## Prasyarat

- Node.js **>= 22.18.0**, npm
- SQL Server aktif + database `review_kantin` sudah di-seed di pertemuan-03
- **Hands-on 1 pertemuan-05 sudah selesai** — project ini menyalin folder
  `hands-on-1-autentikasi-jwt`, jadi `POST /api/v1/auth/login` dan tabel `USERS` sudah ada
- Akun seed sudah punya password yang bisa dipakai login (lihat Langkah 0)

---

### Dari "punya token" ke "token itu berarti sesuatu"

Pertemuan-05 Hands-on 1 berakhir denganmu memegang token JWT. Coba decode payload-nya
(bagian tengahnya) dan isinya kira-kira begini:

```json
{
  "sub": "2",
  "name": "Bu Tini",
  "email": "tini@kantin.test",
  "role": "owner",
  "iat": 1772000000,
  "exp": 1772007200
}
```

Isinya bagus. Masalahnya, **tidak ada satu pun baris kode di project ini yang membacanya**.
Token itu dibuat, dikirim ke client, lalu berhenti di situ. `DELETE /api/v1/stalls/1` masih
dapat dipanggil siapa saja; `ownerId` di body masih dipercaya begitu saja.

Perlu diluruskan satu istilah yang sering tertukar:

- **Autentikasi** = membuktikan **siapa** kamu. Token JWT adalah buktinya.
- **Otorisasi** = memutuskan **boleh tidak** kamu melakukan sesuatu, setelah identitas diketahui.

Server sudah bisa memverifikasi signature token (itu otentikasi). Yang belum ada adalah
keputusan "role `owner` boleh mengubah warung ini, tapi role `customer` tidak".

> ### Inti dokumen: dua pertanyaan, dua middleware
>
> _Kalau diibaratkan loket_: **staf loket** memeriksa KTP (autentikasi) sebelum menerima
> berkas. Sesudah identitas jelas, **supervisor** yang memutuskan berkas ini boleh ditangani
> atau tidak (otorisasi). Keduanya tidak bisa ditukar urutan.

## Langkah 0 — Titik awal: project pertemuan-05 hands-on 1

Salin project Hands-on 1. Folder ini (**hands-on-2-middleware-otorisasi**) adalah hasil salinan
tersebut setelah semua langkah di dokumen ini selesai.

Terminal: Salin project Hands-on 1

```powershell
Copy-Item -Recurse `
  pertemuan-05-auth-middleware\hands-on-1-autentikasi-jwt `
  pertemuan-05-auth-middleware\hands-on-2-middleware-otorisasi
```

Kalau `node_modules` ikut tersalin, hapus dulu supaya install ulang bersih:

```powershell
Remove-Item -Recurse -Force pertemuan-05-auth-middleware\hands-on-2-middleware-otorisasi\node_modules
```

Terminal: Install dependensi

```powershell
cd pertemuan-05-auth-middleware\hands-on-2-middleware-otorisasi
npm install
```

Terminal: Pastikan file `.env` ada (salin dari `.env.example` kalau perlu)

```powershell
Copy-Item .env.example .env
```

Di `.env` pastikan `JWT_SECRET` terisi. Hands-on ini **tidak** butuh nilai baru — token yang
dibuat Hands-on 1 masih bisa dipakai karena secret-nya sama.

### Akun uji

Hands-on 1 sudah menyediakan akun seed dengan password yang bisa dipakai login:

| Email                 | Role      | Password     |
| --------------------- | --------- | ------------ |
| `admin@kantin.test`   | `admin`   | `rahasia123` |
| `tini@kantin.test`    | `owner`   | `rahasia123` |
| `bagas@student.test`  | `customer` | `rahasia123` |

Kalau `bcrypt.compare()` selalu gagal, seed password-nya belum diganti. Jalankan ulang skrip
`pertemuan-05-auth-middleware\db\seed-password-hashes.sql` lebih dulu.

## Langkah 1 — Middleware autentikasi (`src/middlewares/auth.ts`)

Buat file `src/middlewares/auth.ts`:

```typescript
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { verifyToken, type AuthUser } from '../services/tokenService.ts';
import { UnauthorizedError } from '../errors/UnauthorizedError.ts';

/**
 * Bentuk request yang sudah membawa user hasil verifikasi token.
 *
 * Versi pertama ini memakai tipe LOKAL + casting, karena `Request` bawaan
 * Express tidak tahu apa itu `req.user`. Langkah 4 akan menggantinya dengan
 * augmentasi global supaya tidak perlu casting di mana-mana.
 */
export interface AuthRequest extends Request {
  user?: AuthUser;
}

const BEARER_PREFIX = 'Bearer ';

/**
 * Ambil token dari header `Authorization: Bearer <token>`.
 * Mengembalikan null kalau header tidak ada, tidak memakai skema Bearer, atau
 * tokennya kosong — semua kondisi itu sama-sama berarti "tidak terautentikasi".
 */
function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith(BEARER_PREFIX)) return null;

  const token = header.slice(BEARER_PREFIX.length).trim();
  return token.length > 0 ? token : null;
}

/**
 * Middleware autentikasi.
 *
 * Tanggung jawabnya satu saja: memastikan request membawa token yang valid,
 * lalu menaruhnya di `req.user` supaya handler berikutnya tidak perlu mengurai
 * token lagi. Kegagalan diteruskan lewat `next(error)` supaya semua error
 * dibalas oleh satu `errorHandler` yang sama seperti di Pertemuan-04.
 */
export const authenticate: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const token = extractToken(req);
  if (!token) {
    return next(new UnauthorizedError('Header Authorization dengan token Bearer wajib dikirim'));
  }

  try {
    // verifyToken melempar kalau signature salah atau token kedaluwarsa.
    (req as AuthRequest).user = verifyToken(token);
    return next();
  } catch {
    // Detail sengaja ditelan: client tidak perlu tahu bedanya "expired" dengan
    // "signature salah" — cukup tahu tokennya tidak valid.
    return next(new UnauthorizedError());
  }
};

/**
 * Pembaca `req.user` yang aman untuk controller dan middleware lain.
 * Melempar 401 (bukan diam-diam `undefined`) supaya kesalahan "lupa pasang
 * authenticate" muncul jelas saat pengembangan, bukan jadi error aneh
 * di baris kode lain yang tidak ada hubungannya.
 */
export function getUser(req: AuthRequest): AuthUser {
  if (!req.user) {
    throw new UnauthorizedError('Endpoint ini harus dipakai setelah middleware authenticate');
  }
  return req.user;
}
```

Ada tiga keputusan di file ini yang perlu dipahami, bukan sekadar diketik.

**1. Token dikirim lewat header, bukan body atau query.**

`Authorization: Bearer <token>` adalah standar yang dipakai hampir semua API modern.
Kebanyakan website dan aplikasi mobile sudah punya tempat standar untuk menaruh token, jadi
tidak perlu ditaruh di URL (yang bisa bocor ke log server dan history browser).

**2. `Bearer ` dicek dengan `startsWith`, bukan `split`.**

Perhatikan juga `if (!token)` di bagian return: string kosong harus dianggap tidak ada, bukan
token yang sah. Kalau lupa, `Authorization: Bearer ` saja akan lolos ke `verifyToken` dan
menghasilkan pesan error yang membingungkan.

**3. Kegagalan diteruskan dengan `next(error)`, bukan `res.status(401).json(...)`.**

Ini poin penting. Kalau middleware menulis respons sendiri, setiap kesalahan auth harus ditulis
ulang di banyak tempat, dan `errorHandler` dari Pertemuan-04 jadi tidak berguna. Dengan
`next(error)`, semua error — dari validasi, dari database, dari auth — melewati **satu** pintu
keluar yang sama.

`verifyToken()` dari Hands-on 1 sudah melempar `TokenExpiredError` atau `JsonWebTokenError`.
Di sini error itu ditangkap dan diganti menjadi `UnauthorizedError` yang seragam, supaya
client tidak bisa menebak-nebak apakah token-nya kedaluwarsa atau salah signature.

## Langkah 2 — Middleware otorisasi berparameter

Otentikasi sudah selesai. Sekarang pertanyaannya: **user yang sudah terbukti siapa, boleh
melakukan apa?**

Buat file `src/errors/ForbiddenError.ts` dulu:

```typescript
import { AppError } from './AppError.ts';

/**
 * Dipakai saat user SUDAH berhasil terautentikasi (token valid) tetapi role-nya
 * tidak memenuhi syarat untuk endpoint tersebut. Memetakan ke HTTP 403.
 *
 * Bedakan dari 401 (UnauthorizedError):
 * - 401 = "siapa kamu?"  -> token hilang, salah tanda tangan, atau kedaluwarsa.
 * - 403 = "kamu tahu, tapi tidak boleh." -> token valid, role tidak cukup.
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Kamu tidak punya akses ke resource ini') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}
```

Perhatikan: `ForbiddenError` **tidak perlu disentuh lagi di `errorHandler.ts`**. Di Hands-on 1
sudah disederhanakan menjadi satu cabang `if (error instanceof AppError)`, dan `ForbiddenError`
menurun dari `AppError`. Sekali cascading class itu dibuat benar, error baru cukup menambah
kelas — bukan menambah `if`.

Sekarang buat file `src/middlewares/authorize.ts`:

```typescript
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ForbiddenError } from '../errors/ForbiddenError.ts';
import { getUser, type AuthRequest } from './auth.ts';
import type { UserRole } from '../repositories/userRepository.ts';

/**
 * Middleware otorisasi BERPARAMETER.
 *
 * `authorize(...roles)` mengembalikan RequestHandler baru, jadi pola yang
 * dipakai di router nanti cukup menulis role-nya di dalam kurung:
 *
 *   authenticate, authorize('admin')            -> hanya admin
 *   authenticate, authorize('owner', 'admin')   -> owner atau admin
 *
 * Wajib dipasang SETELAH `authenticate`, karena `req.user` baru ada setelah
 * token diverifikasi. Memasangnya terbalik akan menghasilkan 401, bukan 403.
 */
export function authorize(...allowedRoles: UserRole[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Menangkap kesalahan saat development: middleware dijalankan tanpa
    // satu pun role, artinya rute ini tidak pernah bisa diakses.
    if (allowedRoles.length === 0) {
      return next(new Error('authorize() harus menerima minimal satu role'));
    }

    // getUser melempar UnauthorizedError (401) kalau req.user belum diisi —
    // inilah penjaga kalau urutan middleware terbalik.
    const user = getUser(req as AuthRequest);

    if (!allowedRoles.includes(user.role)) {
      return next(
        new ForbiddenError(`Endpoint ini hanya untuk role: ${allowedRoles.join(', ')}`),
      );
    }

    return next();
  };
}
```

Tiga hal yang membuat pola ini lebih baik daripada menulis cek role di dalam controller:

- **Satu fungsi, banyak endpoint.** Endpoint butuh tiga role? Tulis tiga role-nya. Menambah
  endpoint baru tidak berarti menyalin logika.
- **Role-nya jadi data, bukan kode.** `authorize('owner', 'admin')` bisa dibaca sekilas;
  `if (user.role === 'owner' || user.role === 'admin')` harus dibaca lebih pelan.
- **Dipesan oleh tipe.** Parameter `...allowedRoles: UserRole[]` membuat
  `authorize('adminn')` gagal compile, bukan gagal saat runtime.

`getUser(req as AuthRequest)` di sini bukan sekadar formalitas. Kalau suatu hari ada route yang
tertulis `authorize('admin')` **tanpa** `authenticate` di depannya, `getUser` melempar 401 —
client dapat pesan yang benar dan mudah di-debug, bukan `TypeError` karena membaca `role` dari
`undefined`.

## Langkah 3 — Pasang ke route: mana yang publik, mana yang terlindungi

Sekarang bagian yang menentukan. Buka `src/routes/stallRouter.ts` dan ganti isinya:

```typescript
import { Router } from 'express';
import { StallController } from '../controllers/stallController.ts';
import { ReviewController } from '../controllers/reviewController.ts';
import { validate } from '../middlewares/validate.ts';
import { authenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';
import {
  createStallSchema,
  idParamSchema,
  stallQuerySchema,
  updateStallSchema,
} from '../schemas/stallSchema.ts';
import { createReviewSchema } from '../schemas/reviewSchema.ts';

const stallRouter = Router();
const stallController = new StallController();
const reviewController = new ReviewController();

// ---------------------------------------------------------------- PUBLIK
// Tiga handler pertama tanpa middleware auth apa pun. Ini disengaja: daftar,
// detail, dan menu warung memang harus bisa dibaca tamu yang belum login.
stallRouter.get('/', validate(stallQuerySchema, 'query'), stallController.getStalls);
stallRouter.get('/:id', validate(idParamSchema, 'params'), stallController.getStallById);
stallRouter.get('/:id/menus', validate(idParamSchema, 'params'), stallController.getStallMenus);

// ------------------------------------------------------- TERLINDUNGI (401)
// Urutannya: authenticate (token valid?) -> authorize (role cukup?) ->
// validate (body/params benar?). Menaruh authenticate paling depan membuat
// jawaban untuk request tanpa token SELALU 401, apa pun isi body-nya —
// jadi tidak ada celah yang membocorkan aturan validasi ke pengguna anonim.
stallRouter.post(
  '/',
  authenticate,
  authorize('owner', 'admin'),
  validate(createStallSchema, 'body'),
  stallController.createStall,
);
stallRouter.put(
  '/:id',
  authenticate,
  authorize('owner', 'admin'),
  validate(idParamSchema, 'params'),
  validate(updateStallSchema, 'body'),
  stallController.updateStall,
);
stallRouter.post(
  '/:id/reviews',
  authenticate,
  validate(idParamSchema, 'params'),
  validate(createReviewSchema, 'body'),
  reviewController.createReview,
);

// ------------------------------------------------------ ADMIN SAJA (403)
// Satu authorize() dengan satu role sudah cukup, tanpa if-else di controller.
stallRouter.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(idParamSchema, 'params'),
  stallController.deleteStall,
);

export { stallRouter };
```

**Kenapa `authenticate` diletakkan paling depan, sebelum `validate`?**

Coba bayangkan urutannya dibalik. Request tanpa token tapi body-nya tidak valid akan dijawab
`400 Validasi gagal`, bukan `401`. Sekarang sinkron: begitu tidak ada token, jawabannya selalu
401 apa pun isi body-nya. Ini bukan hanya soal estetika — kalau validasi berjalan dulu,
aturan-aturan internal (field apa yang wajib, format apa yang dipakai) bisa dipelajari siapa
saja tanpa login.

### Jangan percaya body: `ownerId` dan `userId` harus hilang dari request

Sekarang bagian yang paling mudah dilewatkan orang, dan dampaknya paling berbahaya.

Schema `createStallSchema` di Hands-on 1 masih menerima `ownerId` dari body. Dampaknya
sederhana tapi serius: dengan begitu, `tini@kantin.test` (role `owner`) bisa membuat warung
dengan `ownerId: 7` — warung itu sebenarnya milik orang lain, tapi tercatat atas namanya.
Periksa kembali `src/schemas/stallSchema.ts`, dan **hapus** blok `ownerId` ini:

```typescript
// HAPUS blok ini dari createStallSchema:
    ownerId: z
      .number({ invalid_type_error: 'ownerId harus berupa angka' })
      .int('ownerId harus bilangan bulat')
      .positive('ownerId harus lebih dari 0')
      .openapi({ example: 2, description: 'ID owner (USERS.id dengan role owner)' }),
```

Ganti dengan komentar pengantar:

```typescript
// -------------------------------------------------------------------- body
// CATATAN PENTING: schema ini TIDAK punya field `ownerId`.
// Pemilik warung ditentukan server dari `req.user.id` (lihat stallController).
// Kalau `ownerId` diterima dari body, satu akun owner bisa membuat warung
// atas nama owner lain.
export const createStallSchema = z
  .object({
    name: z
```

Sekalian perbaiki pesan `.strict()` supaya tetap bahasa Indonesia seperti di Hands-on 1:

```typescript
  // .strict() menolak (atau membuang) kunci yang tidak dikenal. Pesan kustom
  // dipakai supaya tidak ada pesan bawaan zod yang bahasa Inggris lolos ke user.
  .strict({ message: 'body hanya boleh berisi name, category, location, dan description' });
```

Sekarang `src/controllers/stallController.ts`. Ganti handler `createStall` dan `updateStall`:

```typescript
import { getUser } from '../middlewares/auth.ts';

  createStall = async (req: Request, res: Response): Promise<void> => {
    const body = getValidated<CreateStallInput>(res, 'body');
    const { id: ownerId } = getUser(req as AuthRequest);

    // `ownerId` tidak pernah datang dari body — pemilik selalu user dari token.
    const stall = await this.stallService.createStall(body, ownerId);
    res.status(201).json({ status: 'success', data: stall });
  };

  updateStall = async (req: Request, res: Response): Promise<void> => {
    const { id } = getValidated<IdParam>(res, 'params');
    const body = getValidated<UpdateStallInput>(res, 'body');
    const user = getUser(req as AuthRequest);

    // Service juga mengecek warung ini milik user tersebut atau bukan.
    const stall = await this.stallService.updateStall(id, body, user);
    res.status(200).json({ status: 'success', data: stall });
  };
```

Dan `src/services/stallService.ts`:

```typescript
  /**
   * `ownerId` diterima sebagai parameter terpisah, bukan dari `input`.
   * Pemanggilnya mengambilnya dari `req.user` sehingga client tidak pernah
   * bisa menentukan sendiri pemilik warung.
   */
  async createStall(input: CreateStallInput, ownerId: number): Promise<StallResponseDto> {
    const row = await this.stallRepository.create({ ...input, ownerId });
    if (!row) throw new NotFoundError('Warung gagal dibuat');
    return this.toDto(row);
  }

  async updateStall(
    id: number,
    input: UpdateStallInput,
    user: AuthUser,
  ): Promise<StallResponseDto> {
    // Otorisasi tingkat objek: role "owner" saja belum cukup, warung yang
    // diubah juga harus milik user tersebut. Admin boleh semua.
    if (user.role !== 'admin') {
      const current = await this.stallRepository.findById(id);
      if (!current) throw new NotFoundError('Warung tidak ditemukan');
      if (current.ownerId !== user.id) {
        throw new ForbiddenError('Kamu hanya bisa mengubah warung milikmu sendiri');
      }
    }

    const row = await this.stallRepository.update(id, input);
    if (!row) throw new NotFoundError('Warung tidak ditemukan');
    return this.toDto(row);
  }
```

Tambahkan dua import di bagian atas file itu:

```typescript
import { ForbiddenError } from '../errors/ForbiddenError.ts';
import type { AuthUser } from './tokenService.ts';
```

Perhatikan `if (user.role !== 'admin')`. Ini adalah **otorisasi tingkat objek** — perbedaan
penting yang sering terlewat. `authorize('owner', 'admin')` di router hanya menjawab
pertanyaan "apakah dia owner?", belum menjawab "apakah warung ini memang miliknya?". Tanpa
pemeriksaan di service, `tini@kantin.test` (owner warung nomor 1) masih bisa mengubah warung
nomor 3 milik orang lain — karena role-nya `owner` lolos, dan middleware tidak tahu soal
kepemilikan.

> **Aturan praktis:** middleware menjawab *"role apa?"*, service menjawab *"milik siapa?"*.

### Tambah endpoint terlindungi baru

Sekarang kita tambahkan tiga endpoint sekaligus, untuk_bbisa melihat semua pola auth.

**a. `GET /api/v1/auth/me` — profil ringkas dari token**

Buka `src/controllers/authController.ts` dan tambahkan handler:

```typescript
  /**
   * Endpoint terlindungi paling sederhana: membalas apa yang ada di token.
   * Tidak ada query database sama sekali — inilah kekuatan dan sekaligus
   * kelemahan JWT (lihat `ProfileController.getProfile` untuk versi yang
   * memuat ulang data dari database).
   */
  getMe = async (req: Request, res: Response): Promise<void> => {
    const user = getUser(req as AuthRequest);
    res.status(200).json({ status: 'success', data: user });
  };
```

Dan daftarkan di `src/routes/authRouter.ts`:

```typescript
// TERLINDUNGI. Satu token valid dipakai untuk endpoint apa pun yang butuh
// "siapa kamu", termasuk yang tidak butuh role khusus.
authRouter.get('/me', authenticate, authController.getMe);
```

**b. `GET /api/v1/auth/profile` — profil terbaru dari database**

Buat file `src/controllers/profileController.ts`:

```typescript
import type { Request, Response } from 'express';
import { UserRepository } from '../repositories/userRepository.ts';
import { getUser, type AuthRequest } from '../middlewares/auth.ts';
import type { AuthUserDto } from '../dtos/authDto.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';

type UserRow = NonNullable<Awaited<ReturnType<UserRepository['findById']>>>;

/**
 * Endpoint profil untuk menunjukkan perbedaan antara "data dari token" dan
 * "data dari database".
 *
 * `getMe` (di AuthController) membalas persis isi payload token tanpa menyentuh
 * database — cepat, tapi bisa basi kalau role berubah atau akun dihapus.
 * `getProfile` di sini memuat ulang user dari database memakai `req.user.id`,
 * jadi selalu mencerminkan kondisi terbaru.
 */
export class ProfileController {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  getProfile = async (req: Request, res: Response): Promise<void> => {
    // Identitas dari token; data terbaru dari database.
    const { id } = getUser(req as AuthRequest);

    const row: UserRow | undefined = await this.userRepository.findById(id);
    if (!row) {
      // Token-nya masih valid secara kriptografi, tapi user-nya sudah tidak ada.
      throw new NotFoundError('User tidak ditemukan');
    }

    const data: AuthUserDto = {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
    };
    res.status(200).json({ status: 'success', data });
  };
}
```

Daftarkan di `src/routes/authRouter.ts`:

```typescript
authRouter.get('/profile', authenticate, profileController.getProfile);
```

**c. `POST /api/v1/stalls/:id/reviews` — vertical baru yang butuh autentikasi**

Buat `src/schemas/reviewSchema.ts`:

```typescript
import { z } from 'zod';

/**
 * Body untuk membuat review.
 *
 * `userId` SENGAJA tidak ada di sini. Identitas selalu diambil dari
 * `req.user` — kalau berasal dari body, siapa pun bisa menulis review
 * seolah-olah dia orang lain.
 */
export const createReviewSchema = z
  .object({
    rating: z.coerce
      .number({ invalid_type_error: 'rating harus berupa angka' })
      .int('rating harus bilangan bulat')
      .min(1, 'rating minimal 1')
      .max(5, 'rating maksimal 5')
      .openapi({ example: 4, description: 'Rating 1 sampai 5' }),
    comment: z
      .string()
      .trim()
      .max(1000, 'comment maksimal 1000 karakter')
      .nullable()
      .optional()
      .openapi({ example: 'Kwetiaunya enak banget!', description: 'Komentar opsional' }),
  })
  .strict({ message: 'body hanya boleh berisi rating dan comment' });

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
```

Buat `src/dtos/reviewDto.ts`:

```typescript
/** Bentuk review yang dikirim ke client (tanpa kolom internal yang tidak perlu). */
export interface ReviewResponseDto {
  id: number;
  stallId: number;
  userId: number;
  rating: number;
  comment: string | null;
  likeCount: number;
  createdAt: string | null;
}
```

Buat `src/repositories/reviewRepository.ts`:

```typescript
import { and, avg, count, eq, sql } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { reviews, stalls } from '../db/schema.ts';

export interface CreateReviewParams {
  stallId: number;
  userId: number;
  rating: number;
  comment: string | null;
}

export class ReviewRepository {
  /**
   * Satu user hanya boleh punya satu review per warung — dijaga unique
   * constraint di database, tapi dicek di sini juga supaya pesannya jelas
   * (409) alih-alih error constraint mentah dari driver.
   */
  async findByStallAndUser(stallId: number, userId: number) {
    const db = await getDb();
    const rows = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.stallId, stallId), eq(reviews.userId, userId)));
    return rows[0];
  }

  async create(params: CreateReviewParams) {
    const db = await getDb();
    const rows = await db
      .insert(reviews)
      .output()
      .values({
        stallId: params.stallId,
        userId: params.userId,
        rating: params.rating,
        comment: params.comment,
        likeCount: 0,
      });
    return rows[0];
  }

  /**
   * Hitung ulang ringkasan warung (avg_rating & review_count) dari tabel REVIEWS.
   *
   * `rating` di-cast ke DECIMAL dulu: kolomnya INT, jadi tanpa cast SQL Server
   * memotong bagian desimal AVG()-nya dan (4 + 5) / 2 tersimpan sebagai 4.
   */
  async refreshStallSummary(stallId: number) {
    const db = await getDb();

    const stats = await db
      .select({
        total: count(),
        average: avg(sql<number>`cast(${reviews.rating} as decimal(10, 4))`),
      })
      .from(reviews)
      .where(eq(reviews.stallId, stallId));

    const total = Number(stats[0]?.total ?? 0);
    const average = Number(stats[0]?.average ?? 0);

    const updated = await db
      .update(stalls)
      .set({ reviewCount: total, avgRating: average.toFixed(2) })
      .where(eq(stalls.id, stallId))
      .output();

    return updated[0];
  }
}
```

Perhatikan `refreshStallSummary`. Kolom `avg_rating` dan `review_count` di tabel `STALLS` adalah
**data turunan** — denormalisasi yang disengaja supaya daftar warung tidak perlu `JOIN` ke
ribuan baris review setiap kali dibuka. Konsekuensinya, setiap kali ada review baru, kedua
kolom itu harus dihitung ulang. `SELECT` agregat terpisah lalu `UPDATE` hasilnya jauh lebih
mudah dibaca dan di-debug daripada menyisipkan `AVG()` langsung di dalam `UPDATE`, yang
sungguh mudah salah begitu filter warung atau `GROUP BY`-nya lupa ditulis.

Dua hal kecil di query itu yang perlu dijaga. Pertama, `SELECT`-nya wajib difilter
`stallId` — tanpa itu, rata-ratanya menghitung seluruh tabel. Kedua, `rating` bertipe `INT`,
dan `AVG()` di SQL Server ikut mengikuti tipe datanya, sehingga bagian desimalnya terpotong:
`(4 + 5) / 2` jadi `4`, bukan `4.5`. Karena itu `rating` di-`cast` ke `DECIMAL` dulu sebelum
dirata-ratakan. `ReportService` punya masalah yang sama, jadi ikut di-`cast` di sana.

Buat `src/services/reviewService.ts`:

```typescript
import { ReviewRepository } from '../repositories/reviewRepository.ts';
import { StallRepository } from '../repositories/stallRepository.ts';
import type { ReviewResponseDto } from '../dtos/reviewDto.ts';
import { AppError } from '../errors/AppError.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';
import type { CreateReviewInput } from '../schemas/reviewSchema.ts';

type ReviewRow = NonNullable<Awaited<ReturnType<ReviewRepository['create']>>>;

export class ReviewService {
  private reviewRepository: ReviewRepository;
  private stallRepository: StallRepository;

  constructor(
    reviewRepository: ReviewRepository = new ReviewRepository(),
    stallRepository: StallRepository = new StallRepository(),
  ) {
    this.reviewRepository = reviewRepository;
    this.stallRepository = stallRepository;
  }

  private toDto(row: ReviewRow): ReviewResponseDto {
    return {
      id: row.id,
      stallId: row.stallId,
      userId: row.userId,
      rating: row.rating,
      comment: row.comment,
      likeCount: row.likeCount,
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    };
  }

  /**
   * `userId` datang dari parameter, bukan dari body — pemanggilnya (controller)
   * mengambilnya dari `req.user`. Service tidak pernah mempercayai input client
   * untuk keputusan soal siapa yang sedang acting.
   */
  async createReview(
    stallId: number,
    userId: number,
    input: CreateReviewInput,
  ): Promise<ReviewResponseDto> {
    const stall = await this.stallRepository.findById(stallId);
    if (!stall) throw new NotFoundError('Warung tidak ditemukan');

    const existing = await this.reviewRepository.findByStallAndUser(stallId, userId);
    if (existing) {
      throw new AppError(409, 'Kamu sudah pernah memberi review untuk warung ini');
    }

    const row = await this.reviewRepository.create({
      stallId,
      userId,
      rating: input.rating,
      comment: input.comment ?? null,
    });
    if (!row) throw new AppError(500, 'Review gagal disimpan');

    // Rating warung ikut diperbarui supaya angka di STALLS tidak basi.
    await this.reviewRepository.refreshStallSummary(stallId);

    return this.toDto(row);
  }
}
```

Dan `src/controllers/reviewController.ts`:

```typescript
import type { Request, Response } from 'express';
import { ReviewService } from '../services/reviewService.ts';
import { getUser, type AuthRequest } from '../middlewares/auth.ts';
import { getValidated } from '../middlewares/validate.ts';
import type { IdParam } from '../schemas/stallSchema.ts';
import type { CreateReviewInput } from '../schemas/reviewSchema.ts';

/**
 * `req.user` dibaca lewat `getUser()` — bukan `req.user!.id`.
 * Kalau `authenticate` somehow tidak terpasang, yang muncul adalah 401 yang
 * jelas, bukan error `undefined` yang sulit ditelusuri.
 */
export class ReviewController {
  private reviewService: ReviewService;

  constructor(reviewService: ReviewService = new ReviewService()) {
    this.reviewService = reviewService;
  }

  createReview = async (req: Request, res: Response): Promise<void> => {
    const { id: stallId } = getValidated<IdParam>(res, 'params');
    const body = getValidated<CreateReviewInput>(res, 'body');

    // Identitas penulis SELALU dari token, tidak pernah dari body.
    const { id: userId } = getUser(req as AuthRequest);

    const data = await this.reviewService.createReview(stallId, userId, body);
    res.status(201).json({ status: 'success', data });
  };
}
```

**d. `GET /api/v1/admin/reports` — endpoint khusus admin**

Buat `src/dtos/reportDto.ts`:

```typescript
/** Angka-angka ringkas untuk halaman laporan admin. */
export interface ReportSummaryDto {
  totalUsers: number;
  totalStalls: number;
  totalReviews: number;
  averageRating: number;
  stallsByCategory: Array<{ category: string | null; total: number }>;
}
```

Buat `src/services/reportService.ts`:

```typescript
import { avg, count, sql } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { reviews, stalls, users } from '../db/schema.ts';
import type { ReportSummaryDto } from '../dtos/reportDto.ts';

/**
 * Query agregat untuk laporan admin.
 *
 * Router dan service yang memanggil method ini sudah dijaga `authorize('admin')`
 * oleh middleware — cara paling aman tetap dengan membatasi di lapisan route,
 * bukan sekadar bertanya "siapa saja yang boleh memanggil file ini?".
 */
export class ReportService {
  async getSummary(): Promise<ReportSummaryDto> {
    const db = await getDb();

    // Empat agregat yang tidak saling bergantung, jadi dikirim bersamaan.
    // Cast ke DECIMAL dulu, sama alasannya seperti di ReviewRepository.
    const [userRows, stallRows, reviewRows, averageRows] = await Promise.all([
      db.select({ total: count() }).from(users),
      db.select({ total: count() }).from(stalls),
      db.select({ total: count() }).from(reviews),
      db
        .select({ average: avg(sql<number>`cast(${reviews.rating} as decimal(10, 4))`) })
        .from(reviews),
    ]);

    // Pengelompokan per kategori sekaligus menghitung jumlahnya.
    const byCategory = await db
      .select({ category: stalls.category, total: count() })
      .from(stalls)
      .groupBy(stalls.category)
      .orderBy(stalls.category);

    return {
      totalUsers: Number(userRows[0]?.total ?? 0),
      totalStalls: Number(stallRows[0]?.total ?? 0),
      totalReviews: Number(reviewRows[0]?.total ?? 0),
      averageRating: Number(averageRows[0]?.average ?? 0),
      stallsByCategory: byCategory.map((row) => ({
        category: row.category,
        total: Number(row.total),
      })),
    };
  }
}
```

Buat `src/controllers/adminController.ts`:

```typescript
import type { Request, Response } from 'express';
import { ReportService } from '../services/reportService.ts';
import { getUser, type AuthRequest } from '../middlewares/auth.ts';

export class AdminController {
  private reportService: ReportService;

  constructor(reportService: ReportService = new ReportService()) {
    this.reportService = reportService;
  }

  getReports = async (req: Request, res: Response): Promise<void> => {
    // Middleware sudah menjamin role admin, jadi di sini tidak perlu
    // pengecekan role lagi — cukup mencatat siapa yang meminta laporan.
    const { email } = getUser(req as AuthRequest);
    const data = await this.reportService.getSummary();

    res.status(200).json({
      status: 'success',
      meta: { requestedBy: email },
      data,
    });
  };
}
```

Perhatikan controller ini **tidak** menulis `if (user.role !== 'admin')`. Mengulangi cek
yang sama di controller adalah tanda middleware-nya belum dipasang dengan benar — atau
indikatif bahwa ada yang tidak konsisten antara kode dan dokumentasi.

Buat `src/routes/adminRouter.ts`:

```typescript
import { Router } from 'express';
import { AdminController } from '../controllers/adminController.ts';
import { authenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';

const adminRouter = Router();
const adminController = new AdminController();

// authenticate (401) DILETAKKAN LEBIH DAHULU daripada authorize (403):
// tanpa token, server bahkan belum tahu role-nya siapa.
adminRouter.get('/reports', authenticate, authorize('admin'), adminController.getReports);

export { adminRouter };
```

Terakhir, daftarkan router admin di `src/index.ts`:

```typescript
import { adminRouter } from './routes/adminRouter.ts';

// ...
// Router khusus admin. Seluruh route di dalamnya dijaga authorize('admin'),
// jadi menambah route baru di sini otomatis ikut terlindungi selama auth-nya
// tidak lupa ditulis.
app.use('/api/v1/admin', adminRouter);
```

## Langkah 4 — Typed `req.user` tanpa casting (`src/types/express.d.ts`)

Sampai sini semua sudah jalan, tapi ada satu bagian yang tidak enak dilihat. Di beberapa
tempat kita menulis casting:

```typescript
(req as AuthRequest).user = verifyToken(token);   // auth.ts
const user = getUser(req as AuthRequest);          // authorize.ts, controller, service
```

Tiap casting adalah tempat di mana compiler tidak bisa lagi memastikan kita benar. Kalau ada
tipe yang keliru, error-nya muncul jauh dari penyebabnya. Mari hilangkan.

Buat file `src/types/express.d.ts`:

```typescript
import type { AuthUser } from '../services/tokenService.ts';

/**
 * Augmentasi tipe Express secara global.
 *
 * Menambah properti `user` ke `Express.Request` berarti SETIAP handler,
 * service, dan middleware di proyek ini bisa menulis `req.user` tanpa
 * casting dan tanpa membuat interface `AuthRequest` sendiri di tiap modul.
 *
 * `user` sengaja opsional (`?`): pada route publik `authenticate` tidak
 * dijalankan, jadi nilainya memang belum ada. Pembacaannya selalu lewat
 * `getUser()` yang melempar 401 kalau belum diisi.
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
```

Sekarang rapikan semua file yang menyentuh `AuthRequest`. Perubahan ini hanya menghapus
`as AuthRequest` dan interface `AuthRequest`.

`src/middlewares/auth.ts` — hapus interface `AuthRequest` beserta import `Request`-nya yang
dipakai hanya untuk tipe itu, lalu ubah dua baris:

```typescript
// SEBELUM
(req as AuthRequest).user = verifyToken(token);
export function getUser(req: AuthRequest): AuthUser {

// SESUDAH
req.user = verifyToken(token);
export function getUser(req: Request): AuthUser {
```

`src/middlewares/authorize.ts`:

```typescript
import { getUser } from './auth.ts';   // type AuthRequest dihapus dari import
...
const user = getUser(req);            // casting dihapus
```

`src/controllers/stallController.ts`, `src/controllers/profileController.ts`,
`src/controllers/reviewController.ts`, dan `src/controllers/adminController.ts` — ubah
pola yang sama:

```typescript
import { getUser } from '../middlewares/auth.ts';   // type AuthRequest dihapus dari import
...
const user = getUser(req);                          // casting dihapus
```

Jalankan typecheck untuk memastikan tidak ada yang tertinggal.

Terminal: Pastikan TypeScript masih lolos

```powershell
npx tsc --noEmit
```

Kalau masih ada error `req as AuthRequest` yang "tidak ditemukan", berarti ada file yang
lupa dirapikan. Cari dengan:

Terminal: Cari casting yang masih tertinggal

```powershell
Select-String -Path src\**\*.ts -Pattern 'as AuthRequest'
```

### Kenapa `user` dibuat opsional (`user?`)

Ini keputusan yang sengaja, bukan laziness. Kalau `req.user` dideklarasikan sebagai `AuthUser`
(bukan `AuthUser | undefined`), TypeScript akan mengizinkan `getUser()` menulis
`return req.user` tanpa checking sama sekali — padahal pada route publik nilainya memang tidak
ada. Kejutan buruk seperti itu baru muncul saat runtime, di production.

Dengan `user?`, compiler memaksa kita memeriksa. Dan pemeriksaan itu sudah Dibungkus dalam
`getUser()`, jadi cukup satu tempat untuk ditulis dan satu tempat untuk dibaca.

## Langkah 5 — Dokumentasikan keamanan di Swagger (`src/docs/openapi.ts`)

Swagger dari Pertemuan-04 belum tahu apa-apa soal token. Akibatnya setiap orang yang membuka
`/docs` akan melihat `DELETE /api/v1/stalls/{id}` seolah-olah bisa dipanggil tanpa apa-apa.

Buka `src/docs/openapi.ts`, tambahkan security scheme di bagian atas (tepat setelah
`const registry = ...`):

```typescript
// ------------------------------------------------------------------ keamanan
// Satu-satunya cara client mengirim token: header `Authorization: Bearer ...`.
// Scheme ini juga membuat Swagger UI memunculkan tombol "Authorize" sehingga
// token bisa diisi sekali di awal lalu terpakai otomatis di semua request.
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Token JWT dari endpoint POST /api/v1/auth/login.',
});

/**
 * Skema keamanan untuk route terlindungi.
 *
 * OpenAPI TIDAK punya konsep "role" — isinya hanya menjelaskan token. Syarat
 * role ditulis di `description` tiap route supaya pembaca Swagger tahu kalau
 * 403 mungkin terjadi.
 */
const secured = [{ bearerAuth: [] }];
```

Komentarnya jujur soal batasannya: OpenAPI 3.0 memang **tidak** punya cara menyatakan role
(`x-roles` adalah ekstensi non-standar). Jadi informasi role di sini murni ditulis pada
`description` — tapi tetap jauh lebih baik daripada diam saja, karena pembaca Swagger jadi tahu
kenapa mencoba request-nya bisa gagal.

Tambahkan respons 401 dan 403 supaya bentuk errornya terdokumentasi. Letakkan setelah
`errorSchema` didefinisikan:

```typescript
// Respons 401 dan 403 sengaja memakai schema yang sama dengan error lain karena
// bentuk JSON-nya memang sama. Yang membedakan HANYA status code-nya:
// 401 = token tidak valid/tidak ada, 403 = token valid tapi role tidak cukup.
const unauthorizedResponse = {
  401: {
    description: 'Token tidak ada, kedaluwarsa, atau signature tidak cocok',
    content: { 'application/json': { schema: errorSchema } },
  },
};

const forbiddenResponse = {
  403: {
    description: 'Role dari token tidak punya izin untuk endpoint ini',
    content: { 'application/json': { schema: errorSchema } },
  },
};
```

Daftarkan schema baru untuk review dan laporan:

```typescript
const reviewSchema = registry.register(
  'Review',
  z.object({
    id: z.number().openapi({ example: 1 }),
    stallId: z.number().openapi({ example: 2 }),
    userId: z.number().openapi({ example: 3 }),
    rating: z.number().openapi({ example: 4 }),
    comment: z.string().nullable().openapi({ example: 'Kwetiaunya enak banget!' }),
    likeCount: z.number().openapi({ example: 0 }),
    createdAt: z.string().nullable().openapi({ example: '2026-03-01T08:00:00.000Z' }),
  }),
);

const reviewInput = registry.register('ReviewInput', createReviewSchema);

const reviewResponse = registry.register(
  'ReviewResponse',
  z.object({
    status: z.literal('success'),
    data: reviewSchema,
  }),
);

const reportSchema = registry.register(
  'ReportSummary',
  z.object({
    totalUsers: z.number().openapi({ example: 12 }),
    totalStalls: z.number().openapi({ example: 8 }),
    totalReviews: z.number().openapi({ example: 20 }),
    averageRating: z.number().openapi({ example: 4.25 }),
    stallsByCategory: z
      .array(z.object({ category: z.string().nullable(), total: z.number() }))
      .openapi({ example: [{ category: 'Kwetiau', total: 3 }] }),
  }),
);
```

Jangan lupa import schema review di bagian atas file:

```typescript
import { createReviewSchema } from '../schemas/reviewSchema.ts';
```

Terakhir, tambahkan route baru dan perbarui route yang sudah ada. `/api/v1/auth/me` dan
`/api/v1/auth/profile` sama-sama membalas user langsung, jadi keduanya memakai satu schema
`authUserResponse` — bukan `registerResponse` yang membungkus user di dalam `data.user`.
Tambahkan dulu schema itu di dekat definisi `authUserSchema`:

```typescript
const authUserResponse = registry.register(
  'AuthUserResponse',
  z.object({
    status: z.literal('success'),
    data: authUserSchema,
  }),
);
```

Contoh untuk `authRouter`:

```typescript
registry.registerPath({
  method: 'get',
  path: '/api/v1/auth/me',
  summary: 'Profil ringkas dari token',
  description:
    'Route terlindungi (authenticate). Membalas persis isi payload token tanpa ' +
    'query database. Kalau butuh data terbaru, pakai `/api/v1/auth/profile`.',
  security: secured,
  responses: {
    200: {
      description: 'Data user dari token',
      content: { 'application/json': { schema: authUserResponse } },
    },
    ...unauthorizedResponse,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/reports',
  summary: 'Ringkasan laporan (khusus admin)',
  description:
    'Butuh `authenticate` (401) lalu `authorize(\'admin\')` (403). Role `owner` ' +
    'dan `customer` yang mengirim token valid tetap akan ditolak dengan 403.',
  security: secured,
  responses: {
    200: {
      description: 'Ringkasan data',
      content: {
        'application/json': {
          schema: z.object({
            status: z.literal('success'),
            meta: z.object({ requestedBy: z.string() }),
            data: reportSchema,
          }),
        },
      },
    },
    ...unauthorizedResponse,
    ...forbiddenResponse,
  },
});
```

Lalu perbarui route stalls yang sekarang terlindungi. `POST /api/v1/stalls` jadi:

```typescript
registry.registerPath({
  method: 'post',
  path: '/api/v1/stalls',
  summary: 'Tambah warung',
  description:
    'Route terlindungi: butuh token (`owner` atau `admin`). Field `ownerId` ' +
    'TIDAK ada di body — pemilik selalu user dari token.',
  security: secured,
  request: {
    body: {
      description: 'Data warung baru',
      content: { 'application/json': { schema: stallInput } },
    },
  },
  responses: {
    201: {
      description: 'Warung berhasil dibuat',
      content: { 'application/json': { schema: stallDetailResponse } },
    },
    400: {
      description: 'Body tidak valid',
      content: { 'application/json': { schema: errorSchema } },
    },
    ...unauthorizedResponse,
    ...forbiddenResponse,
  },
});
```

Dan `DELETE /api/v1/stalls/{id}`:

```typescript
  description: 'Hanya `admin`. `owner` yang mengirim token valid akan mendapat 403.',
  security: secured,
  request: { params: idParamSchema },
  responses: {
    200: {
      description: 'Warung terhapus',
      content: { 'application/json': { schema: stallDetailResponse } },
    },
    400: {
      description: 'Parameter id tidak valid',
      content: { 'application/json': { schema: errorSchema } },
    },
    ...unauthorizedResponse,
    ...forbiddenResponse,
    404: {
      description: 'Warung tidak ditemukan',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
});
```

Terakhir, perbarui `info.description` di bagian `generateDocument`:

```typescript
  info: {
    title: 'Review Kantin API',
    version: '1.0.0',
    description:
      'Dokumentasi OpenAPI 3.0 yang dibangkitkan otomatis dari schema zod ' +
      '(@asteasolutions/zod-to-openapi) — satu sumber kebenaran untuk validasi ' +
      'dan dokumentasi. Operation yang memakai `security: secured` 🔒 membutuhkan ' +
      'header `Authorization: Bearer <token>` dari endpoint login; tekan tombol ' +
      'Authorize di kanan atas Swagger UI untuk menempelkan tokennya.',
  },
```

## Langkah 6 — Jalankan dan uji

Terminal: Jalankan server

```powershell
npm run dev
```

### A. Terminal (curl di PowerShell)

Karena PowerShell punya `curl` sebagai alias `Invoke-WebRequest` yang punya
perilaku berbeda, contoh di bawah memakai `Invoke-RestMethod` agar hasilnya bisa
dibaca.

Terminal: Login tiga role dan simpan tokennya

```powershell
$base = "http://localhost:3000"

$admin = (Invoke-RestMethod "$base/api/v1/auth/login" -Method Post -ContentType 'application/json' `
  -Body (@{ email = 'admin@kantin.test';   password = 'rahasia123' } | ConvertTo-Json)).data.token

$owner = (Invoke-RestMethod "$base/api/v1/auth/login" -Method Post -ContentType 'application/json' `
  -Body (@{ email = 'tini@kantin.test';    password = 'rahasia123' } | ConvertTo-Json)).data.token

$cust  = (Invoke-RestMethod "$base/api/v1/auth/login" -Method Post -ContentType 'application/json' `
  -Body (@{ email = 'bagas@student.test';  password = 'rahasia123' } | ConvertTo-Json)).data.token
```

Terminal: 401 — request tanpa token

```powershell
Invoke-RestMethod "$base/api/v1/auth/me" -Method Get
```

Respons (401):

```json
{
  "status": "fail",
  "message": "Header Authorization dengan token Bearer wajib dikirim"
}
```

Terminal: 401 — token rusak

```powershell
Invoke-RestMethod "$base/api/v1/auth/me" -Method Get -Headers @{ Authorization = "Bearer abc.def.ghi" }
```

Respons (401):

```json
{
  "status": "fail",
  "message": "Token tidak ada atau tidak valid"
}
```

Terminal: 200 — token dipakai dengan benar

```powershell
Invoke-RestMethod "$base/api/v1/auth/me" -Method Get -Headers @{ Authorization = "Bearer $cust" }
```

Respons (200):

```json
{
  "status": "success",
  "data": {
    "id": 12,
    "name": "Bagas Pratama",
    "email": "bagas@student.test",
    "role": "customer"
  }
}
```

Terminal: 403 — role tidak cukup (token customer ke endpoint admin)

```powershell
Invoke-RestMethod "$base/api/v1/admin/reports" -Method Get -Headers @{ Authorization = "Bearer $cust" }
```

Respons (403):

```json
{
  "status": "fail",
  "message": "Endpoint ini hanya untuk role: admin"
}
```

Terminal: 403 — endpoint yang butuh owner, dipanggil customer

```powershell
Invoke-RestMethod "$base/api/v1/stalls" -Method Post -ContentType 'application/json' `
  -Headers @{ Authorization = "Bearer $cust" } `
  -Body (@{ name = 'Warung Gagal' } | ConvertTo-Json)
```

Respons (403):

```json
{
  "status": "fail",
  "message": "Endpoint ini hanya untuk role: owner, admin"
}
```

Terminal: 400 — mencoba memaksa ownerId lewat body

```powershell
Invoke-RestMethod "$base/api/v1/stalls" -Method Post -ContentType 'application/json' `
  -Headers @{ Authorization = "Bearer $owner" } `
  -Body (@{ name = 'Warung Paksa'; ownerId = 2 } | ConvertTo-Json)
```

Respons (400):

```json
{
  "status": "fail",
  "message": "Validasi gagal",
  "errors": [
    {
      "field": "body",
      "message": "body hanya boleh berisi name, category, location, dan description"
    }
  ]
}
```

Perhatikan `ownerId` **tidak lagi** jadi bagian dari schema. Client tidak pernah punya
kesempatan menentukan sendiri pemiliknya.

Terminal: 403 — otorisasi tingkat objek (owner mengubah warung milik orang lain)

```powershell
# Warung nomor 1 milik Bu Tini (id 2). Warung nomor 3 milik orang lain.
Invoke-RestMethod "$base/api/v1/stalls/3" -Method Put -ContentType 'application/json' `
  -Headers @{ Authorization = "Bearer $owner" } `
  -Body (@{ location = 'Lantai 2' } | ConvertTo-Json)
```

Respons (403):

```json
{
  "status": "fail",
  "message": "Kamu hanya bisa mengubah warung milikmu sendiri"
}
```

Token `owner`-nya **valid**, role-nya juga **cukup** untuk `PUT /stalls/:id`. Yang menahan
adalah pemeriksaan kepemilikan di dalam service.

Terminal: 200 — admin bebas mengubah warung siapa pun

```powershell
Invoke-RestMethod "$base/api/v1/stalls/3" -Method Put -ContentType 'application/json' `
  -Headers @{ Authorization = "Bearer $admin" } `
  -Body (@{ location = 'Lantai 2' } | ConvertTo-Json)
```

Respons (200):

```json
{
  "status": "success",
  "data": {
    "id": 3,
    "ownerId": 3,
    "name": "Kedai Pak Slamet",
    "category": "Bakso",
    "location": "Lantai 2",
    "avgRating": 4.67,
    "reviewCount": 3,
    "isPopular": false
  }
}
```

Terminal: 201 — buat review, identitas diambil dari token

Gunakan warung **4** (`Kedai Cak Nur`). Di seed, warung ini belum pernah direview oleh
`bagas@student.test`, jadi request-nya memang baru.

```powershell
Invoke-RestMethod "$base/api/v1/stalls/4/reviews" -Method Post -ContentType 'application/json' `
  -Headers @{ Authorization = "Bearer $cust" } `
  -Body (@{ rating = 5; comment = 'Enak banget!' } | ConvertTo-Json)
```

Respons (201):

```json
{
  "status": "success",
  "data": {
    "id": 17,
    "stallId": 4,
    "userId": 12,
    "rating": 5,
    "comment": "Enak banget!",
    "likeCount": 0,
    "createdAt": "2026-09-29T18:13:05.000Z"
  }
}
```

Perhatikan `userId: 12` — nilai itu diambil dari token `bagas@student.test`, bukan dari body.
Kalau body memuat `userId`, request akan ditolak `400` oleh `.strict()`.

Terminal: 409 — review kedua untuk warung yang sama

```powershell
Invoke-RestMethod "$base/api/v1/stalls/4/reviews" -Method Post -ContentType 'application/json' `
  -Headers @{ Authorization = "Bearer $cust" } `
  -Body (@{ rating = 3 } | ConvertTo-Json)
```

Respons (409):

```json
{
  "status": "fail",
  "message": "Kamu sudah pernah memberi review untuk warung ini"
}
```

Cek bahwa ringkasan warung ikut ter-update:

```powershell
Invoke-RestMethod "$base/api/v1/stalls/4" -Method Get
```

Respons (200) — `avgRating` dan `reviewCount` sudah ikut berubah:

```json
{
  "status": "success",
  "data": {
    "id": 4,
    "ownerId": 5,
    "name": "Kedai Cak Nur",
    "category": "Mie",
    "avgRating": 4.5,
    "reviewCount": 2,
    "isPopular": false
  }
}
```

Hitung sendiri: seed memberi warung 4 `avgRating` 4.00 dari satu review. Setelah rating 5
masuk, rata-ratanya jadi `(4 + 5) / 2 = 4.5` dan `reviewCount` naik dari 1 ke 2. Kalau angka
di respons tidak cocok, `refreshStallSummary` belum terpanggil.

### B. Postman

1. Buka Postman, buat collection baru `Middleware Otorisasi - Pertemuan 5`.
2. **Ambil token dulu.** Salin request `POST /api/v1/auth/login` dari Hands-on 1, jalankan
   dengan `admin@kantin.test` / `rahasia123`, lalu salin nilai `data.token`.
3. Di tab **Authorization**, pilih tipe **Bearer Token** dan tempel token tersebut.
4. Uji `GET /api/v1/auth/me` — sekarang request otomatis membawa token.
5. Ganti header **Authorization** dengan token `tini@kantin.test`, lalu panggil
   `GET /api/v1/admin/reports`. Hasilnya `403 Forbidden`.
6. Request `GET /api/v1/stalls` **tanpa** tab Authorization harus tetap `200` — endpoint
   publik memang tidak butuh token.

Cara tercepat membandingkan 401 dan 403: siapkan dua tab (atau dua request) yang identik
selain tokennya. Kalau tokennya **hilang atau rusak** jawabannya 401. Kalau tokennya **valid
tapi role-nya tidak cukup** jawabannya 403.

### C. Swagger UI

1. Buka `http://localhost:3000/docs`.
2. Klik tombol **Authorize** di kanan atas, tempel token admin, tekan **Authorize**. Tombolnya
   berubah menjadi tercentang.
3. Sekarang coba `GET /api/v1/admin/reports` → **Try it out** → **Execute**. Jalan, dan
   di bagian **Responses** ada `200`, `401`, dan `403` yang semuanya terdokumentasi.
4. Uji `GET /api/v1/stalls/{id}` dengan `id` acak, misalnya `999`. Kali ini jawabannya `404`,
   **bukan** `403` — karena route itu memang publik dan tidak picky role. Bandingkan dengan
   `DELETE /api/v1/stalls/{id}`: panggil juga tanpa token, dan jawabannya `401` karena route
   itu terlindungi.
5. Bandingkan dengan `DELETE /api/v1/stalls/{id}` memakai token customer. Di spec-nya Anda akan
   melihat description yang menyebutkan hanya `admin`, plus kode `403` di daftar response.

### Rangkuman kasus uji

| Kasus                                              | Who  | Token        | Expected | Kenapa                                                     |
| -------------------------------------------------- | ---- | ------------ | -------- | ---------------------------------------------------------- |
| Daftar warung tanpa login                           | anon | tidak ada    | 200      | Route publik                                               |
| `GET /auth/me` tanpa header                          | anon | tidak ada    | 401      | `authenticate` menolak                                     |
| `GET /auth/me` dengan token ngawur                   | anon | rusak        | 401      | Signature tidak cocok                                      |
| `GET /auth/me` dengan token customer                 | cust | valid        | 200      | `authenticate` cukup, role tidak relevan                   |
| `GET /admin/reports` dengan token customer            | cust | valid        | 403      | Role tidak ada di `authorize('admin')`                     |
| `GET /admin/reports` dengan token owner               | owner| valid        | 403      | Role tidak cukup                                           |
| `GET /admin/reports` dengan token admin               | admin| valid        | 200      | Semua syarat terpenuhi                                     |
| `POST /stalls` dengan token customer                 | cust | valid        | 403      | Butuh `owner` atau `admin`                                 |
| `POST /stalls` dengan `ownerId` di body              | owner| valid        | 400      | `.strict()` menolak kunci tak dikenal                      |
| `POST /stalls` dengan token owner                     | owner| valid        | 201      | `ownerId` diambil dari token                               |
| `PUT /stalls/3` warung milik orang lain               | owner| valid        | 403      | Otorisasi tingkat objek                                    |
| `PUT /stalls/3` oleh admin                            | admin| valid        | 200      | Admin bebas                                                |
| `POST /stalls/4/reviews` review pertama untuk warung itu  | cust | valid        | 201      | Identitas diambil dari token                             |
| `POST /stalls/4/reviews` review kedua                 | cust | valid        | 409      | Sudah pernah mereview warung itu                          |
| `POST /stalls/4/reviews` dengan `userId` di body      | cust | valid        | 400      | Identitas hanya dari token                                 |

## Troubleshooting

| Gejala                                                                   | Penyebab & Solusi                                                                                                  |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Semua endpoint terlindungi balas `401` padahal token sudah dikirim       | Header-nya salah. Harus persis `Bearer <token>` — huruf besar B, satu spasi. Cek juga `Trim()` tidak mengubah isi. |
| `authorize` selalu balas `403`, bahkan untuk admin                        | Role di payload token berbeda dari yang diharapkan. Decode token, pastikan `role` benar dan `JWT_SECRET` sama seperti saat login. |
| `403` padahal seharusnya `200`                                            | Urutan middleware terbalik: `authorize` dipasang sebelum `authenticate`. Karena `req.user` belum ada, hasilnya 401 — cek juga apakah `JWT_SECRET` berubah setelah token dibuat. |
| Pesan `authorize() harus menerima minimal satu role`                      | Ada route yang menulis `authorize()` tanpa argumen. Tulis role-nya.                                                 |
| `Cannot read properties of undefined (reading 'role')`                   | Ada handler yang membaca `req.user` langsung tanpa `getUser()`. Pakai `getUser(req)`.                              |
| `req as AuthRequest` masih ada setelah Langkah 4                          | Ada file yang belum dirapikan. Jalankan `Select-String -Path src\**\*.ts -Pattern 'as AuthRequest'`.               |
| `authorize('adminn')` tidak dikompilasi                                   | Ini memang perilaku yang benar. `UserRole` hanya berisi tiga nilai, typo langsung tertangkap.              |
| Tombol **Authorize** tidak muncul di Swagger                             | `registry.registerComponent('securitySchemes', ...)` belum dipanggil, atau `security: secured` belum diisi di `registerPath`. |
| Review selalu `409`, padahal warung berbeda                               | `findByStallAndUser` salah membandingkan kolom. Pastikan `stallId` **dan** `userId` ikut.                            |
| `avg_rating` di warung tidak berubah setelah review                        | `refreshStallSummary` tidak dipanggil setelah `create`. Pastikan baris itu ada di `createReview`.                   |
| `401` dengan pesan `JWT_SECRET belum diset di .env`                       | `JWT_SECRET` kosong di `.env`. Isi, lalu **login ulang** — token yang sudah dibuat dengan secret lain jadi tidak valid. |

## Struktur Project

```
hands-on-2-middleware-otorisasi/
├── .env.example                 # konfigurasi (JWT_SECRET, DB)
├── drizzle.config.ts
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts                 # entry point; mendaftarkan authRouter, stallRouter, adminRouter
    ├── db/
    │   ├── index.ts             # koneksi SQL Server + instance Drizzle
    │   └── schema.ts            # definisi tabel USERS, STALLS, REVIEWS, ...
    ├── errors/
    │   ├── AppError.ts          # error dasar yang membawa status code
    │   ├── NotFoundError.ts     # 404
    │   ├── UnauthorizedError.ts # 401 (dari Hands-on 1)
    │   ├── ForbiddenError.ts    # 403  <-- BARU
    │   └── ValidationError.ts   # 400 (dari Hands-on 1)
    ├── middlewares/
    │   ├── auth.ts              # authenticate + getUser  <-- BARU
    │   ├── authorize.ts         # authorize(...roles)    <-- BARU
    │   ├── errorHandler.ts      # satu pintu keluar untuk semua error
    │   ├── notFound.ts          # 404 untuk rute tak dikenal
    │   └── validate.ts          # validasi berbasis zod
    ├── types/
    │   └── express.d.ts         # augmentasi Express.Request  <-- BARU
    ├── repositories/
    │   ├── userRepository.ts
    │   ├── stallRepository.ts
    │   ├── menuItemRepository.ts
    │   └── reviewRepository.ts  # <-- BARU
    ├── services/
    │   ├── tokenService.ts      # sign & verify JWT
    │   ├── authService.ts       # register & login
    │   ├── stallService.ts      # + cek kepemilikan saat update
    │   ├── reviewService.ts     # <-- BARU
    │   └── reportService.ts     # <-- BARU
    ├── controllers/
    │   ├── authController.ts    # + getMe
    │   ├── profileController.ts # <-- BARU
    │   ├── stallController.ts   # ownerId dari req.user
    │   ├── reviewController.ts  # <-- BARU
    │   └── adminController.ts   # <-- BARU
    ├── routes/
    │   ├── authRouter.ts        # + /me dan /profile
    │   ├── stallRouter.ts       # + authenticate & authorize per route
    │   └── adminRouter.ts       # <-- BARU
    ├── schemas/
    │   ├── authSchema.ts
    │   ├── stallSchema.ts       # ownerId DIHAPUS dari body
    │   └── reviewSchema.ts      # <-- BARU
    ├── dtos/
    │   ├── authDto.ts
    │   ├── stallDto.ts
    │   ├── reviewDto.ts         # <-- BARU
    │   └── reportDto.ts         # <-- BARU
    └── docs/
        └── openapi.ts           # + securitySchemes & respons 401/403
```

## Bacaan Lanjutan

- **OWASP Authentication Cheat Sheet** — urutan yang benar antara authentication dan
  authorization: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- **OWASP Authorization Cheat Sheet** — pola `deny by default` dan prinsip least privilege:
  https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- **OWASP ASVS** — daftar pemeriksaan keamanan API yang bisa dipakai untuk audit sendiri:
  https://owasp.org/www-project-application-security-verification-standard/
- **RFC 7519 — JSON Web Token** — spesifikasi resmi JWT, termasuk makna `exp`, `iat`, dan `sub`:
  https://datatracker.ietf.org/doc/html/rfc7519
- **OWASP Password Storage Cheat Sheet** — kenapa bcrypt dipakai, dan kenapa argon2 lebih
  direkomendasikan di produksi: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

### Yang belum dibahas di hands-on ini

Sistem ini sudah cukup untuk praktikum, tapi ada beberapa hal penting di produksi yang
sengaja tidak dibahas — kami sebutkan supaya kamu tahu batasannya:

- **Refresh token & access token terpisah.** Token sekarang berlaku 2 jam dan tidak bisa dicabut.
  Di produksi biasanya ada access token berumur pendek plus refresh token yang bisa di-revoke.
- **Blacklist / denylist token.** Role di dalam token bisa basi — kalau ada admin yang
  di-demosi, token lamanya masih berlaku sampai `exp`. Solusinya: simpan `jti` di daftar
  pencabutan, atau shorten `exp` plus refresh token.
- **Rate limiting di endpoint login.** Tanpa pembatasan, `POST /auth/login` adalah pintu
  masuk serangan brute-force.
- **HTTPS tanpa pengecualian.** Token di header `Authorization` aman diTTPS karena terenkripsi
  di dalam channel, tapi akan terbaca jelas oleh siapa pun yang mengintip jaringan. Ini
  alasannya `Authorization: Bearer` **tidak boleh** dikirim lewat `http://` di produksi.