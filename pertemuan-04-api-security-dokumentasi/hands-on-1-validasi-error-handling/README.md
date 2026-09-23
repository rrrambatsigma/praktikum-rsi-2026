# Hands-on 1 — Validasi Input (zod) & Error Handling Terstruktur

<!--
  CATATAN UNTUK DEVELOPER SITUS (markdown comment ini TIDAK akan tampil di Astro/GitHub):
  - File ini adalah sumber konten halaman web — narasi + kode, siap disalin.
  - Setiap blok kode memiliki label file yang ditulis di kalimat SEBELUMNYA (mis.
    `src/schemas/stallSchema.ts`). Saat mengonversi ke komponen Astro, pakai
    `<Code title="<path>" lang="..." />` supaya label file muncul di atas kode.
  - Blok dengan label "Terminal: ..." = perintah yang dijalankan mahasiswa (bukan kode aplikasi).
  - Blok JSON bernomor = contoh OUTPUT respons API (bukan kode yang diketik mahasiswa).
  - Paragraf teks bebas = narasi, silakan diedit ringan.
  - Tabel "Kasus uji" boleh dirender apa adanya.
-->

Hands-on ini membangun di atas **project pertemuan-03 `hands-on-2`** (CRUD warung,
Drizzle ORM). Setiap input dari client (**body, query, params**) **divalidasi dengan
zod** sebelum masuk ke lapisan berikutnya, lalu semua kegagalan dialihkan ke
**satu error handler terpusat** sehingga respons gagal konsisten:
`{ status, message, errors }`.

> File ini adalah sumber langkah utama.
> Topik ini bagian dari Pertemuan 04 — **API Security dan Dokumentasi**.

## Yang dipelajari

- **Validasi & sanitasi input** dengan `zod` (schema untuk body/query/params,
  `.trim()`, `.strict()`, `z.coerce`, default, `z.infer`).
- **Error handling terstruktur**: custom error class (`AppError`/`NotFoundError`/
  `ValidationError`), middleware validasi, 404 otomatis, dan **error handler terpusat**
  (error middleware Express).
- Perilaku **Express 5**: handler async yang `reject` otomatis diteruskan ke error handler —
  controller **tidak perlu `try/catch`**.

## Prasyarat

- Node.js **>= 22.18.0**, npm
- SQL Server aktif + database `review_kantin` sudah dibuat & di-seed di pertemuan-03
  (skrip `db/*.sql` dijalankan **sekali saja** di pertemuan-03):

```powershell
cd ..\..\pertemuan-03-database-backend-crud
sqlcmd -S localhost -E -C -i db\00-setup-mixed-mode.sql   # sekali saja (perlu restart service)
sqlcmd -S localhost -E -C -i db\01-create-database-and-user.sql
sqlcmd -S localhost -E -C -i db\02-schema.sql
sqlcmd -S localhost -E -C -i db\03-seed.sql
```

---

### Dari string error ke error handling terstruktur

Di pertemuan-03, kegagalan ditangani **per-controller**: service melempar
`throw new Error('STALL_NOT_FOUND')`, lalu controller menerjemahkan pesan string itu
ke status code secara manual lewat `handleError`. Pendekatan ini rapuh:

- **Status code bisa salah.** Pesan string diterjemahkan manual; satu typo = client
  dapat `500` padahal seharusnya `404`.
- **Tanpa validasi input.** `req.body`, `req.query`, dan `req.params` direkam mentah —
  tipe salah (`page=abc`), kolom tak dikenal, atau whitespace ikut tersimpan, dan layanan
  lain baru bermasalah saat query ke database.
- **Logika error terduplikasi.** Tiap controller punya `handleError` sendiri; konsistensi
  respons `{ status, message }` tidak dijamin.

Hands-on ini menggantinya dengan **tiga lapisan**:

- **Schema zod** — satu definisi untuk validasi + sanitasi + tipe TypeScript (`z.infer`).
  Controller hanya menerima data yang *sudah lolos*.
- **Custom error class** — setiap galat punya `statusCode` sungguhan (`404`, `400`, dst).
- **Error handler terpusat** — semua error (validasi, not-found, constraint DB, JSON rusak)
  lewat **satu** middleware, jadi respons gagal selalu `{ status, message, errors }`.

Yang **tidak berubah** dari pertemuan-03: `db/`, `dtos/`, `repositories/`, dan struktur
Repository → Service → Controller → Router. Yang berubah hanya bagian *antara controller
dan dunia luar*: input di-validasi dulu, dan error tidak lagi ditangani per-controller.

### Titik awal: project pertemuan-03 hands-on-2

Kita tidak membuat project dari nol — `db`, `dto`, dan `repository` sudah jadi. Salin
folder pertemuan-03 `hands-on-2-orm-drizzle`, lalu ubah hanya bagian yang berkaitan:

Terminal: Salin project pertemuan-03 sebagai titik awal

```powershell
Copy-Item -Recurse ..\..\pertemuan-03-database-backend-crud\hands-on-2-orm-drizzle .
Rename-Item hands-on-2-orm-drizzle hands-on-1-validasi-error-handling
Set-Location hands-on-1-validasi-error-handling
```

Folder `.env` ikut terbawa — dan itu berarti **koneksi database tidak perlu dikonfigurasi
ulang**: tetap `review_kantin` + user `praktikum_user` yang sama (skema tabel Drizzle
menunjuk tabel yang sama persis dengan `02-schema.sql`).

Struktur project setelah dilengkapi:

```
hands-on-1-validasi-error-handling/
├─ package.json  tsconfig.json  drizzle.config.ts
├─ .env                          # SAMA — reuse database pertemuan-03 (review_kantin)
└─ src/
   ├─ index.ts                   # UBAH — +404 dan error handler paling akhir
   ├─ db/  dtos/  repositories/  # SAMA — tak disentuh
   ├─ services/stallService.ts   # UBAH — throw NotFoundError (bukan string)
   ├─ controllers/  routes/      # UBAH — tanpa try/catch + middleware validate
   ├─ schemas/stallSchema.ts     # BARU — schema zod body/query/params + z.infer
   ├─ errors/                    # BARU — AppError, NotFoundError, ValidationError
   └─ middlewares/               # BARU — validate, notFound, errorHandler
```

----------

## Langkah 1 — Install zod & bersihkan swagger

Project salinan masih membawa dependensi Swagger pertemuan-03. Kita tambah **zod**
dan buang yang tidak dipakai lagi:

Terminal: Install zod, uninstall swagger

```bash
npm install zod
npm uninstall swagger-autogen swagger-ui-express @types/swagger-ui-express
```

`zod` = validator berbasis schema yang sekaligus menjadi sumber tipe TypeScript lewat
`z.infer`. Di hands-on 2, schema yang sama ini akan dipakai lagi untuk membangkitkan
dokumentasi OpenAPI (single source of truth).

> **Perhatian:** `npm uninstall` hanya membersihkan blok `dependencies`/`devDependencies`.
> Bagian `scripts` pada `package.json` hasil salinan masih membawa
> `prestart`/`predev`/`docs:gen` dari pertemuan-03 yang memanggil `tsx src/docs/swagger.ts`.
> Bila dibiarkan, `npm run dev` akan memicu `predev` → `docs:gen` → error (file sudah
> dihapus). Edit `package.json` dan **hapus ketiga script itu secara manual** — sisakan
> hanya `start` & `dev` (sama seperti blok hasil akhir di bawah).

Bersihkan sisa folder dokumentasi pertemuan-03 (sudah tidak dipakai):

Terminal: Hapus folder docs lama

```powershell
Remove-Item -Recurse src\docs
```

Isi akhir `package.json` (sengaja sudah tidak ada dependensi swagger). Blok ini adalah
**hasil akhir** dari `npm init` di pertemuan-03 + perintah install/uninstall di atas —
tidak perlu diketik manual; cukup samakan bila editor kamu menghasilkan nama/versi berbeda:

```json
{
  "name": "hands-on-1",
  "version": "1.0.0",
  "private": true,
  "description": "Hands-on 1 Pertemuan 04 - validasi input dengan zod dan error handling terstruktur",
  "main": "src/index.ts",
  "scripts": {
    "start": "tsx src/index.ts",
    "dev": "tsx watch src/index.ts"
  },
  "type": "commonjs",
  "dependencies": {
    "dotenv": "^17.4.2",
    "drizzle-orm": "^1.0.0-rc.5-5935859",
    "express": "^5.2.1",
    "mssql": "^11.0.2",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/express": "^5.0.6",
    "@types/mssql": "^9.1.11",
    "@types/node": "^26.5.1",
    "drizzle-kit": "^1.0.0-rc.5-5935859",
    "tsx": "^4.23.13",
    "typescript": "^7.0.2"
  }
}
```

## Langkah 2 — Konfigurasi `.env`

`.env` sudah terbawa saat menyalin project. Bila belum ada, buat dari contoh:

Terminal: Salin .env

```powershell
Copy-Item .env.example .env
```

Isinya — **persis sama dengan pertemuan-03**, tidak perlu mengubah apa pun:

```
DB_SERVER=localhost
DB_PORT=1433
DB_USER=praktikum_user
DB_PASSWORD=Praktikum2026!
DB_NAME=review_kantin

DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

## Langkah 3 — Schema validasi dengan zod (`src/schemas/stallSchema.ts`)

Satu file berisi schema untuk **params, query, dan body**. Perhatikan pola-pola penting:

- `z.coerce.number()` — query/path selalu berbentuk string; coerce mengubahnya ke `number`
  (bukan sekadar validasi, melainkan konversi).
- `.default(1)` — nilai dipakai bila client tidak mengirim (halaman default 1).
- `.trim()` — sanitasi whitespace di awal/akhir.
- `.strict()` — **membuang kunci yang tidak dikenal** dari body (anti payload asing).
- `.partial()` — untuk PUT, artinya sebagian kolom saja boleh dikirim.
- `z.infer` — tipe TypeScript menurun otomatis dari schema; tidak perlu menulis ulang.

```ts
import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: 'id harus berupa angka' })
    .int('id harus bilangan bulat')
    .positive('id harus lebih dari 0'),
});

export const stallQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(50).optional(),
  page: z.coerce.number().int().min(1, 'page minimal 1').default(1),
  limit: z.coerce.number().int().min(1, 'limit minimal 1').max(100, 'limit maksimal 100').default(10),
});

const optionalNullableText = (max: number) =>
  z.string().trim().max(max).nullable().optional();

export const createStallSchema = z
  .object({
    ownerId: z
      .number({ invalid_type_error: 'ownerId harus berupa angka' })
      .int('ownerId harus bilangan bulat')
      .positive('ownerId harus lebih dari 0'),
    name: z
      .string({ required_error: 'name wajib diisi' })
      .trim()
      .min(3, 'name minimal 3 karakter')
      .max(100, 'name maksimal 100 karakter'),
    category: optionalNullableText(50),
    location: optionalNullableText(100),
    description: optionalNullableText(1000),
  })
  .strict();

export const updateStallSchema = createStallSchema.partial();

export type IdParam = z.infer<typeof idParamSchema>;
export type StallQuery = z.infer<typeof stallQuerySchema>;
export type CreateStallInput = z.infer<typeof createStallSchema>;
export type UpdateStallInput = z.infer<typeof updateStallSchema>;
```

Berkat `z.infer`, tipe `CreateStallInput`/`UpdateStallInput` yang dipakai service & controller
**selalu selaras** dengan schema. Ubah schema → tipe ikut berubah; TypeScript langsung
menegur bila kode lain belum menyesuaikan.

## Langkah 4 — Custom error class

Sebelumnya error hanya `new Error('pesan')` tanpa status code. Sekarang kita punya
hierarki error yang masing-masing membawa **status code HTTP**.

`src/errors/AppError.ts` — basis error yang membawa **status code HTTP**:

```ts
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

`src/errors/NotFoundError.ts` — resource tidak ditemukan → `404`:

```ts
export class NotFoundError extends AppError {
  constructor(message = 'Data tidak ditemukan') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}
```

`src/errors/ValidationError.ts` — membawa daftar `issues` → `400`:

```ts
export interface ValidationIssue {
  field: string;
  message: string;
}

export class ValidationError extends AppError {
  constructor(public readonly issues: ValidationIssue[]) {
    super(400, 'Validasi gagal', issues);
    this.name = 'ValidationError';
  }
}
```

> **Kenapa class, bukan `throw new Error('STALL_NOT_FOUND')`?** Jenis error terdata rapi
> (`instanceof` bisa dibedakan), punya properti `statusCode` sungguhan, dan bisa membawa
> detail tambahan (`errors`). Error handler cukup mengecek `instanceof` — tidak ada lagi
> penerjemahan string manual yang rawan typo.

## Langkah 5 — Middleware validasi (`src/middlewares/validate.ts`)

Ini **factory middleware**: ia menerima schema + sumber (`body`/`query`/`params`) lalu
mengembalikan handler Express. Sukses → data lolos disimpan di
`res.locals.validated[source]` untuk dibaca controller. Gagal → `ZodError` diubah menjadi
`ValidationError(issues)` lalu diteruskan via `next(error)`.

```ts
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodSchema } from 'zod';
import { ValidationError, type ValidationIssue } from '../errors/ValidationError.ts';

export type RequestSource = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, source: RequestSource): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const issues: ValidationIssue[] = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || source,
        message: issue.message,
      }));
      return next(new ValidationError(issues));
    }

    const validated = (res.locals.validated ?? {}) as Record<RequestSource, unknown>;
    validated[source] = result.data;
    res.locals.validated = validated;
    return next();
  };
}

export function getValidated<T>(res: Response, source: RequestSource): T {
  const validated = (res.locals.validated ?? {}) as Record<RequestSource, unknown>;
  return validated[source] as T;
}
```

> **Kenapa `safeParse`, bukan `parse`?** `safeParse` mengembalikan objek
> `{ success, data | error }` tanpa melempar exception, jadi kita mengontrol alurnya
> sendiri: map `issue` → `{ field, message }` → lempar `ValidationError`. Alur program
> lebih jelas daripada bergantung pada `try/catch` di sekitar `parse`.
>
> Di controller, data valid dibaca dengan `getValidated<T>(res, 'body')` — **bukan dari
> `req.body`**. Controller dijamin hanya memproses data yang sudah lolos validasi.

## Langkah 6 — Not-found & error handler terpusat

**Error middleware** Express punya **4 parameter** `(error, req, res, next)` — Express
mengenali jenis middleware ini dari banyaknya parameter. Di sinilah semua error bermuara.

`src/middlewares/errorHandler.ts` — semua error dipetakan menjadi JSON konsisten:

```ts
import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/AppError.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';
import { ValidationError } from '../errors/ValidationError.ts';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  // 1) Body JSON yang rusak (express.json otomatis melempar SyntaxError).
  const bodyError = error as SyntaxError & { status?: number; type?: string };
  if (
    error instanceof SyntaxError &&
    bodyError.status === 400 &&
    bodyError.type === 'entity.parse.failed'
  ) {
    res.status(400).json({ status: 'fail', message: 'JSON pada body tidak valid' });
    return;
  }

  // 2) Error aplikasi yang disengaja.
  if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AppError) {
    res.status(error.statusCode).json({
      status: 'fail',
      message: error.message,
      ...(error.details !== undefined ? { errors: error.details } : {}),
    });
    return;
  }

  // 3) Konflik constraint database mssql: 2627 = unique, 547 = foreign key.
  const dbError = error as { number?: number };
  if (dbError.number === 2627 || dbError.number === 547) {
    res.status(409).json({ status: 'fail', message: 'Data bentrok dengan data yang sudah ada' });
    return;
  }

  // 4) Fallback: detail error TIDAK dibocorkan ke client.
  console.error('Unhandled error:', error);
  res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
};
```

Keterangan empat cabang di atas:

1. **JSON rusak** — `express.json()` melempar `SyntaxError` bila body bukan JSON valid
   (mis. `{bad json`). Kita tangkap agar balas `400` yang ramah (sebelumnya bakal `500`).
2. **Error aplikasi** — `ValidationError`, `NotFoundError`, atau `AppError` lain → pakai
   `statusCode` + `message`, plus `errors` bila membawa detail.
3. **Constraint database** — error mssql kode `2627` (unique) / `547` (foreign key)
   diterjemahkan jadi `409 Conflict`.
4. **Fallback `500`** — error tak terduga di-log ke terminal; detail internal **tidak**
   dibocorkan ke client (keamanan).

404 otomatis untuk rute yang tidak dikenal — `src/middlewares/notFound.ts`:

```ts
import type { Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    status: 'fail',
    message: `Route tidak ditemukan: ${req.method} ${req.originalUrl}`,
  });
}
```

## Langkah 7 — Refactor controller, router & service

Controller **tanpa `try/catch`**: input sudah valid, dan bila service melempar
`NotFoundError` (atau error lain), **Express 5 otomatis** meneruskan rejection handler
async ke `errorHandler`. Logika di controller jadi sesederhana mungkin:

`src/controllers/stallController.ts` — hanya membaca data valid + memanggil service:

```ts
import type { Request, Response } from 'express';
import { StallService } from '../services/stallService.ts';
import { getValidated } from '../middlewares/validate.ts';
import type { CreateStallInput, IdParam, StallQuery, UpdateStallInput } from '../schemas/stallSchema.ts';

export class StallController {
  private stallService: StallService;

  constructor(stallService: StallService = new StallService()) {
    this.stallService = stallService;
  }

  getStalls = async (_req: Request, res: Response): Promise<void> => {
    const query = getValidated<StallQuery>(res, 'query');
    const { data, total } = await this.stallService.getAllStalls({ ...query });
    res.status(200).json({ status: 'success', meta: { page: query.page, limit: query.limit, total }, data });
  };

  createStall = async (_req: Request, res: Response): Promise<void> => {
    const body = getValidated<CreateStallInput>(res, 'body');
    const stall = await this.stallService.createStall(body);
    res.status(201).json({ status: 'success', data: stall });
  };
  // getStallById / getStallMenus / updateStall / deleteStall serupa.
}
```

> **Kenapa `async` + tanpa try/catch tetap aman?** Di Express 5, handler async yang
> melempar otomatis diteruskan ke error middleware berikutnya. Inilah kenapa `errorHandler`
> ada di paling akhir — satu tempat, tanpa duplikasi di tiap controller.

Router memasang middleware `validate` **sebelum** controller — `src/routes/stallRouter.ts`:

```ts
import { Router } from 'express';
import { StallController } from '../controllers/stallController.ts';
import { validate } from '../middlewares/validate.ts';
import { createStallSchema, idParamSchema, stallQuerySchema, updateStallSchema } from '../schemas/stallSchema.ts';

const stallRouter = Router();
const stallController = new StallController();

stallRouter.get('/', validate(stallQuerySchema, 'query'), stallController.getStalls);
stallRouter.post('/', validate(createStallSchema, 'body'), stallController.createStall);
stallRouter.get('/:id', validate(idParamSchema, 'params'), stallController.getStallById);
stallRouter.put(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateStallSchema, 'body'),
  stallController.updateStall,
);
stallRouter.delete('/:id', validate(idParamSchema, 'params'), stallController.deleteStall);
stallRouter.get('/:id/menus', validate(idParamSchema, 'params'), stallController.getStallMenus);

export { stallRouter };
```

Service melempar `NotFoundError` (bukan `Error('STALL_NOT_FOUND')` lagi) —
`src/services/stallService.ts`:

```ts
async getStallById(id: number): Promise<StallResponseDto> {
  const row = await this.stallRepository.findById(id);
  if (!row) throw new NotFoundError('Warung tidak ditemukan');
  return this.toDto(row);
}
```

## Langkah 8 — Rakit di entry point (`src/index.ts`)

Urutan middleware **penting**: JSON parser → route → **404** → **error handler**
(paling akhir). Error handler di tengah atau sebelum route tidak akan pernah mendeteksi
error dari route.

```ts
import express, { type Application } from 'express';
import { sql } from 'drizzle-orm';
import { getDb } from './db/index.ts';
import { stallRouter } from './routes/stallRouter.ts';
import { notFoundHandler } from './middlewares/notFound.ts';
import { errorHandler } from './middlewares/errorHandler.ts';

const app: Application = express();
const PORT: number = 3000;

app.use(express.json());

app.get('/health', async (_req, res) => {
  const db = await getDb();
  await db.execute(sql`SELECT 1 AS ok`);
  res.status(200).json({ status: 'success', message: 'Server dan database terhubung' });
});

app.use('/api/v1/stalls', stallRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
```

> **Kenapa 404 di dekat akhir?** `notFoundHandler` hanya akan menangkap rute yang tidak
> cocok dengan rute mana pun. Karena `Router` sudah dipasang lebih dulu, request valid
> akan dijawab di sana; sisanya — rute tidak dikenal — baru jatuh ke sini.

## Langkah 9 — Jalankan & uji

Terminal: Jalankan server (development)

```bash
npm run dev
```

Kasus uji **valid** — balas `200`/`201`:

Terminal: Request valid

```bash
# PowerShell memakai kutip tunggal untuk body JSON (\" bukan escape di PowerShell).
curl.exe "http://localhost:3000/api/v1/stalls?page=1&limit=2"
curl.exe -X POST http://localhost:3000/api/v1/stalls -H "Content-Type: application/json" -d '{"ownerId":2,"name":"Warung Baru"}'
```

Contoh respons list (`GET /api/v1/stalls?page=1&limit=2`):

```json
{
  "status": "success",
  "meta": { "page": 1, "limit": 2, "total": 9 },
  "data": [
    { "id": 1, "ownerId": 2, "name": "Warung Bu Tini", "category": "Kwetiau", "isPopular": false },
    { "id": 2, "ownerId": 2, "name": "Kopi Senja", "category": "Minuman", "isPopular": false }
  ]
}
```

Contoh respons `POST` (`201`) — kolom opsional diisi `null` oleh database:

```json
{
  "status": "success",
  "data": {
    "id": 12,
    "ownerId": 2,
    "name": "Warung Baru",
    "category": null,
    "location": null,
    "description": null,
    "avgRating": 0,
    "reviewCount": 0,
    "isPopular": false
  }
}
```

Kasus uji **invalid** — semua harus balas `400` dengan daftar `errors`:

Terminal: Request invalid

```bash
# query: page bukan angka & limit melebihi batas
curl.exe "http://localhost:3000/api/v1/stalls?page=abc"
curl.exe "http://localhost:3000/api/v1/stalls?limit=500"

# params: id bukan angka
curl.exe "http://localhost:3000/api/v1/stalls/abc"

# body: field wajib kosong / dua error sekaligus
curl.exe -X POST http://localhost:3000/api/v1/stalls -H "Content-Type: application/json" -d '{"ownerId":2}'
curl.exe -X POST http://localhost:3000/api/v1/stalls -H "Content-Type: application/json" -d '{"ownerId":-1,"name":"ab"}'

# body: JSON rusak (express.json melempar SyntaxError)
curl.exe -X POST http://localhost:3000/api/v1/stalls -H "Content-Type: application/json" -d '{bad json'
```

Contoh respons invalid — dua error dilaporkan **sekaligus** (bukan gagal cepat di yang pertama):

```json
{
  "status": "fail",
  "message": "Validasi gagal",
  "errors": [
    { "field": "ownerId", "message": "ownerId harus lebih dari 0" },
    { "field": "name", "message": "name minimal 3 karakter" }
  ]
}
```

Contoh respons error lainnya:

- `400` — `{ "status": "fail", "message": "JSON pada body tidak valid" }`
- `404` — `{ "status": "fail", "message": "Warung tidak ditemukan" }`
- `404` rute asing — `{ "status": "fail", "message": "Route tidak ditemukan: GET /api/v1/xyz" }`

### Rangkuman kasus uji

| Method | Endpoint | Perilaku |
| --- | --- | --- |
| GET | `/health` | `200` koneksi DB OK; error DB → `500` via error handler |
| GET | `/api/v1/stalls?...` | `200`; query invalid → `400` |
| GET/PUT/DELETE | `/api/v1/stalls/:id` | `404` bila tak ada; `id` non-angka → `400` |
| POST | `/api/v1/stalls` | `201`; body invalid → `400` |
| GET | `/api/v1/stalls/:id/menus` | `200`; `404` bila warung tak ada |
| rute lain | apa pun | `404` via `notFoundHandler` |

## Troubleshooting

| Gejala | Kemungkinan penyebab & solusi |
| --- | --- |
| `400 JSON pada body tidak valid` padahal JSON tampak benar | Di PowerShell, `{"a":1}` butuh tanda kutip **single**: `-d '{"a":1}'` — backslash `\"` bukan escape di PowerShell, jadi JSON-nya rusak. |
| `500 Terjadi kesalahan pada server` | Error tak terduga; cek log terminal (`console.error`). Kalau soal DB, cek kembali prasyarat pertemuan-03. |
| Pesan validasi default Inggris (mis. `Expected number, received nan`) | Itu pesan bawaan zod untuk **coerce** gagal. Untuk custom, beri argumen pesan: `.number({ invalid_type_error: '...' })` atau `.min(1, '...')`. |
| `Cannot connect to localhost` | Server/instans SQL Server tidak aktif, TCP belum aktif, atau `.env` salah. Ingat DB **tidak** perlu dibuat ulang — sudah di-setup di pertemuan-03. |
| Error `ERESOLVE` saat install | Versi `typescript` dkk bentrok; pastikan mengikuti `package.json` di atas, lalu `npm install` ulang. |

## Struktur Project

```
hands-on-1-validasi-error-handling/
├─ README.md
├─ .env.example
├─ drizzle.config.ts          # referensi drizzle-kit (tidak dipakai di hands-on ini)
├─ package.json  tsconfig.json
└─ src/
   ├─ index.ts                # entry: parser JSON -> route -> 404 -> error handler
   ├─ errors/
   │  ├─ AppError.ts          # basis error dengan statusCode
   │  ├─ NotFoundError.ts     # 404
   │  └─ ValidationError.ts   # 400 + daftar issues
   ├─ schemas/stallSchema.ts  # schema zod (body/query/params) + tipe infer
   ├─ middlewares/
   │  ├─ validate.ts          # parse & validasi, simpan ke res.locals.validated
   │  ├─ notFound.ts          # 404 route tak dikenal
   │  └─ errorHandler.ts      # error handling terpusat
   ├─ db/{schema.ts, index.ts}      # Drizzle schema & koneksi
   ├─ dtos/stallDto.ts
   ├─ repositories/{stallRepository.ts, menuItemRepository.ts}
   ├─ services/stallService.ts
   ├─ controllers/stallController.ts
   └─ routes/stallRouter.ts
```

## Bacaan Lanjutan

- [zod](https://zod.dev): dokumentasi schema, `safeParse`, `z.coerce`, `z.infer`, `strict`.
- [Express — Error Handling](https://expressjs.com/en/guide/error-handling.html): error middleware (4 argumen), urutan pendaftaran, async error.