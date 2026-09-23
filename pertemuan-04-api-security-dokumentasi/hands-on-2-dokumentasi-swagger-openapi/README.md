# Hands-on 2 — Dokumentasi API dengan Swagger/OpenAPI

<!--
  CATATAN UNTUK DEVELOPER SITUS (markdown comment ini TIDAK akan tampil di Astro/GitHub):
  - File ini adalah sumber konten halaman web — narasi + kode, siap disalin.
  - Setiap blok kode memiliki label file di kalimat SEBELUMNYA (mis. `src/docs/openapi.ts`).
    Saat mengonversi ke komponen Astro, pakai <Code title="<path>" lang="..." />.
  - Blok "Terminal: ..." = perintah yang dijalankan mahasiswa.
  - Blok JSON bernomor = contoh OUTPUT (respons API atau hasil generate dokumen).
  - Tabel boleh dirender apa adanya.
-->

Hands-on ini menambahkan **dokumentasi API** pada project CRUD warung yang sudah punya
validasi (zod) dan error handling dari **hands-on 1**. Bedanya di sini dokumentasi
**tidak ditulis manual**: spek **OpenAPI 3.0** dibangkitkan otomatis dari skema zod
yang *sudah dipakai untuk validasi* — inilah **satu sumber kebenaran**
(*single source of truth*).

> File ini adalah sumber langkah utama.
> Topik ini bagian dari Pertemuan 04 — **API Security dan Dokumentasi**.

## Yang dipelajari

- Perbedaan **Swagger 2.0** (pertemuan-03, `swagger-autogen`) vs **OpenAPI 3.0**
  (`components/schemas`, `requestBody`, `$ref`).
- `@asteasolutions/zod-to-openapi`: `extendZodWithOpenApi`, `OpenAPIRegistry`,
  `registerPath`, `OpenApiGeneratorV3`.
- Metadata `.openapi({ example, description })` pada skema zod —
  **tidak** mengubah perilaku validasi.
- Menyajikan spek di **Swagger UI** (`swagger-ui-express`) di `/docs`, lalu menguji
  endpoint memakai **Try it out**.

## Prasyarat

- Node.js **>= 22.18.0**, npm
- SQL Server aktif + database `review_kantin` sudah dibuat & di-seed (pertemuan-03) —
  **sama dengan hands-on 1**, tidak ada konfigurasi database baru
- Paham isi **hands-on 1** (schema zod & middleware `validate`, error handler) —
  semua pola itu dipakai apa adanya di project ini.

---

### Dari anotasi manual ke satu sumber kebenaran

Di pertemuan-03 dokumentasi dibuat dengan `swagger-autogen`: tulis komentar
`#swagger.*` di route, lalu *generate* file `swagger-output.json` (otomatis lewat
`predev`). Pendekatan itu praktis, tapi punya dua kelemahan:

- **Dua sumber kebenaran.** Skema yang dipakai validasi (`schema.ts` Drizzle atau input
  controller) dan komentar dokumentasi adalah dua hal terpisah — mudah melenceng bila
  salah satu lupa diubah.
- **Spek bisa basi.** Dokumen adalah file hasil generate; lupa menjalankan langkah
  generate (atau urutan `predev` bermasalah) = dokumentasi tidak sinkron dengan kode.

`zod-to-openapi` membalik arah: **skema zod yang sama persis** yang memvalidasi request
digunakan untuk menyusun dokumen. Validasi dan dokumentasi tidak mungkin bertentangan.
Metadata `.openapi({ example, description })` hanyalah *pemanis* untuk contoh/tampilan
di Swagger UI — validasi & sanitasi tidak berubah. Plus, dokumen digenerate **di memori**
tiap server menyala, jadi selalu segar.

### Titik awal: project hands-on-1 pertemuan-04

Project ini dibangun dari **project hands-on-1** — semua validasi & error handler utuh.
Yang berubah hanya tiga file:

Terminal: Salin project hands-on 1 sebagai titik awal

```powershell
Copy-Item -Recurse ..\hands-on-1-validasi-error-handling .
Rename-Item hands-on-1-validasi-error-handling hands-on-2-dokumentasi-swagger-openapi
Set-Location hands-on-2-dokumentasi-swagger-openapi
```

`.env` ikut terbawa (database `review_kantin` yang sama — tetap tidak perlu konfigurasi
ulang). Daftar perubahan:

| File | Status | Perubahan |
| --- | --- | --- |
| `package.json` | UBAH | `+ @asteasolutions/zod-to-openapi`, `swagger-ui-express`, `@types/swagger-ui-express` |
| `src/schemas/stallSchema.ts` | UBAH | `+ extendZodWithOpenApi(z)` & metadata `.openapi()` (validasi tetap sama) |
| `src/docs/openapi.ts` | BARU | registri + generator spek OpenAPI 3.0 (in-memory) |
| `src/index.ts` | UBAH | `+ app.use('/docs', swaggerUi.serve, swaggerUi.setup(...))` |
| file lainnya | SAMA | errors/, middlewares/, db/, dto/, repository/, service/, controller/, router/ |

----------

## Langkah 1 — Install dependensi dokumentasi

Terminal: Install zod-to-openapi & swagger-ui-express

```bash
npm install @asteasolutions/zod-to-openapi@7.3.4 swagger-ui-express
npm install -D @types/swagger-ui-express
```

> **Kenapa versi dipatok `7.3.4`?** Pasangan stabil untuk **zod v3** adalah
> `zod-to-openapi` v7.x. Versi 8+ sudah migrasi ke zod **v4** — bila admin `npm install`
> tanpa patokan, pemasangan zod v4 akan mengubah perilaku validasi yang kita bangun di
> hands-on 1.

Isi akhir `package.json`:

```json
{
  "name": "hands-on-2",
  "version": "1.0.0",
  "private": true,
  "description": "Hands-on 2 Pertemuan 04 - dokumentasi API OpenAPI 3.0 yang dibangkitkan dari schema zod (zod-to-openapi)",
  "main": "src/index.ts",
  "scripts": {
    "start": "tsx src/index.ts",
    "dev": "tsx watch src/index.ts"
  },
  "type": "commonjs",
  "dependencies": {
    "@asteasolutions/zod-to-openapi": "^7.3.4",
    "dotenv": "^17.4.2",
    "drizzle-orm": "^1.0.0-rc.5-5935859",
    "express": "^5.2.1",
    "mssql": "^11.0.2",
    "swagger-ui-express": "^5.0.1",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/express": "^5.0.6",
    "@types/mssql": "^9.1.11",
    "@types/node": "^26.5.1",
    "@types/swagger-ui-express": "^4.1.8",
    "drizzle-kit": "^1.0.0-rc.5-5935859",
    "tsx": "^4.23.13",
    "typescript": "^7.0.2"
  }
}
```

Perhatikan: **tidak ada script `docs:gen`** seperti pertemuan-03. Dokumentasi dibangkitkan
di memori, jadi tidak perlu langkah generate ekstra.

## Langkah 2 — Konfigurasi `.env`

` .env` terbawa dari hands-on 1; isinya sama persis (bila perlu buat dari `.env.example`):

```
DB_SERVER=localhost
DB_PORT=1433
DB_USER=praktikum_user
DB_PASSWORD=Praktikum2026!
DB_NAME=review_kantin

DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

## Langkah 3 — Skema zod + metadata OpenAPI (`src/schemas/stallSchema.ts`)

Skemanya **sama persis** dengan hands-on 1, hanya ditambah dua hal:

1. `extendZodWithOpenApi(z)` — menambahkan method `.openapi()` ke semua tipe zod.
   Wajib dipanggil **sekali, sebelum** skema memakai `.openapi(...)`.
2. Metadata `.openapi({ example, description })` pada tiap field — ini yang dibaca
   generator untuk contoh & deskripsi di Swagger UI.

```ts
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const idParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: 'id harus berupa angka' })
    .int('id harus bilangan bulat')
    .positive('id harus lebih dari 0')
    .openapi({ example: 3, description: 'ID warung' }),
});

export const stallQuerySchema = z.object({
  search: z.string().trim().max(100).optional().openapi({ description: 'Cari berdasarkan nama warung' }),
  category: z.string().trim().max(50).optional().openapi({ description: 'Filter kategori warung', example: 'Minuman' }),
  page: z.coerce.number().int().min(1).default(1).openapi({ description: 'Nomor halaman (default 1)', example: 1 }),
  limit: z.coerce.number().int().min(1).max(100).default(10).openapi({ description: 'Jumlah data per halaman (maks 100)', example: 10 }),
});

const optionalNullableText = (max: number) => z.string().trim().max(max).nullable().optional();

export const createStallSchema = z
  .object({
    ownerId: z.number().int().positive().openapi({ example: 2, description: 'ID owner (USERS.id, role owner)' }),
    name: z.string().trim().min(3).max(100).openapi({ example: 'Warung Baru', description: 'Nama warung' }),
    category: optionalNullableText(50).openapi({ example: 'Nasi', description: 'Kategori warung' }),
    location: optionalNullableText(100).openapi({ example: 'Kantin FK', description: 'Lokasi warung' }),
    description: optionalNullableText(1000).openapi({ example: 'Nasi goreng dadakan', description: 'Deskripsi' }),
  })
  .strict();

export const updateStallSchema = createStallSchema.partial();
```

> **Kenapa validasi tidak berubah?** `.openapi()` hanyalah metadata tambahan di samping
> definisi zod; aturan `.min()`, `.max()`, `.strict()`, `.partial()` dst bekerja seperti
> biasa. Artinya dokumentasi dan validasi lahir dari **satu definisi yang sama** — ini
> inti *single source of truth*.

## Langkah 4 — Bangun dokumen OpenAPI (`src/docs/openapi.ts`)

Generator bekerja dalam tiga tahap:

1. **Daftar komponen** (`components/schemas`) ke `OpenAPIRegistry`.
2. **Daftar tiap endpoint** dengan `registerPath` (path, params, body, semua respons).
3. **Generate dokumen** `OpenApiGeneratorV3` di memori.

`src/docs/openapi.ts` — bagian 1: komponen skema. Perhatikan bahwa skema **body yang
dipakai validasi** (`createStallSchema`/`updateStallSchema`) ikut didaftarkan sebagai
komponen `StallInput`/`StallUpdate`, agar bisa dipakai ulang lewat `$ref` dan tidak
terduplikasi di tiap path:

```ts
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { createStallSchema, idParamSchema, stallQuerySchema, updateStallSchema } from '../schemas/stallSchema.ts';

const registry = new OpenAPIRegistry();

// Komponen respons.
const stallSchema = registry.register('Stall', z.object({
  id: z.number().openapi({ example: 1 }),
  ownerId: z.number().openapi({ example: 2 }),
  name: z.string().openapi({ example: 'Warung Bu Tini' }),
  category: z.string().nullable().openapi({ example: 'Kwetiau' }),
  location: z.string().nullable().openapi({ example: 'Kantin FKIP' }),
  description: z.string().nullable().openapi({ example: 'Kedai kwetiau goreng & kuah' }),
  avgRating: z.number().openapi({ example: 4.5 }),
  reviewCount: z.number().openapi({ example: 2 }),
  isPopular: z.boolean().openapi({ example: false }),
}));

const errorSchema = registry.register('ErrorResponse', z.object({
  status: z.string().openapi({ example: 'fail' }),
  message: z.string().openapi({ example: 'Validasi gagal' }),
  errors: z.array(z.object({ field: z.string(), message: z.string() })).optional(),
}));

// Skema BODY yang dipakai validasi — daftarkan, lalu $ref di requestBody.
const stallInput = registry.register('StallInput', createStallSchema);
const stallUpdate = registry.register('StallUpdate', updateStallSchema);

const stallDetail = registry.register('StallDetailResponse', z.object({
  status: z.literal('success'),
  data: stallSchema,
}));
```

`src/docs/openapi.ts` — bagian 2: daftarkan tiap endpoint. Setiap `registerPath` menyebut
method, summary, request (params/body), dan **semua kemungkinan respons**
(200/201/400/404/500) — persis yang sudah kita bangun di error handler:

```ts
registry.registerPath({
  method: 'post',
  path: '/api/v1/stalls',
  summary: 'Tambah warung',
  request: {
    body: {
      description: 'Data warung baru',
      content: { 'application/json': { schema: stallInput } },
    },
  },
  responses: {
    201: {
      description: 'Warung berhasil dibuat',
      content: { 'application/json': { schema: stallDetail } },
    },
    400: {
      description: 'Body tidak valid',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/stalls/{id}',
  summary: 'Detail warung',
  request: { params: idParamSchema },
  responses: {
    200: { description: 'Detail warung', content: { 'application/json': { schema: stallDetail } } },
    400: { description: 'Parameter id tidak valid', content: { 'application/json': { schema: errorSchema } } },
    404: { description: 'Warung tidak ditemukan', content: { 'application/json': { schema: errorSchema } } },
  },
});
```

`src/docs/openapi.ts` — bagian 3: bangkitkan dokumen **di memori** (tanpa file, tanpa
langkah `docs:gen`):

```ts
const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiDocument = generator.generateDocument({
  openapi: '3.0.0',
  info: { title: 'Review Kantin API', version: '1.0.0' },
  servers: [{ url: 'http://localhost:3000' }],
});
```

> **Kenapa `content.schema` diisi nilai kembalian `registry.register(...)`, bukan
> variabel skema aslinya?** `register` mengembalikan sebuah referensi yang diregistri —
> generator akan menerjemahkannya menjadi `{ "$ref": "#/components/schemas/StallInput" }`.
> Bila memakai skema mentah (`createStallSchema`), objek skema akan di-inline penuh di
> dalam `requestBody` (spek membengkak & repetitif).

Contoh hasil generate — fragmen spek untuk `POST /api/v1/stalls`
(dan komponen `StallInput` yang dipakai validasi):

```json
{
  "openapi": "3.0.0",
  "info": { "title": "Review Kantin API", "version": "1.0.0" },
  "paths": {
    "/api/v1/stalls": {
      "post": {
        "summary": "Tambah warung",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/StallInput" }
            }
          }
        },
        "responses": {
          "201": { "description": "Warung berhasil dibuat",
                   "content": { "application/json": { "schema": { "$ref": "#/components/schemas/StallDetailResponse" } } } },
          "400": { "description": "Body tidak valid",
                   "content": { "application/json": { "schema": { "$ref": "#/components/schemas/ErrorResponse" } } } }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "StallInput": {
        "type": "object",
        "properties": {
          "ownerId": { "type": "number", "example": 2 },
          "name": { "type": "string", "minLength": 3, "example": "Warung Baru" },
          "category": { "type": "string", "minLength": 1, "nullable": true }
        },
        "required": ["ownerId", "name"],
        "additionalProperties": false
      }
    }
  }
}
```

## Langkah 5 — Sajikan di Swagger UI (`src/index.ts`)

Kita pasang Swagger UI di `/docs` dengan dokumen yang kita bangkitkan. `openApiDocument`
sudah objek `OpenAPIV3.Document`, jadi tinggal diberikan ke `swaggerUi.setup(...)`:

```ts
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from './docs/openapi.ts';

app.use(express.json());

// Dokumentasi API OpenAPI 3.0 (dibangkitkan dari schema zod di memori).
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.get('/health', async (_req, res) => { /* ... */ });
app.use('/api/v1/stalls', stallRouter);
app.use(notFoundHandler);
app.use(errorHandler);
```

Struktur middleware lain (validasi, error handler) **tetap persis** seperti hands-on 1.
`/docs` ditempatkan **di atas** `notFoundHandler`/`errorHandler` agar tidak dianggap
rute asing.

## Langkah 6 — Jalankan & uji

Terminal: Jalankan server (development)

```bash
npm run dev
```

1. Buka **http://localhost:3000/docs** (atau `/docs/`) → halaman Swagger UI.
2. Pilih endpoint → **Try it out** → isi parameter/body → **Execute**.
   Request **benar-benar dikirim ke server**, jadi validasi & error handling tetap berlaku.
3. Coba kasus invalid untuk melihat respons `400` yang ter-dokumentasi, misalnya:

Terminal: Uji kasus invalid

```bash
curl.exe "http://localhost:3000/api/v1/stalls?page=abc"
curl.exe "http://localhost:3000/api/v1/stalls?limit=500"
curl.exe -X POST http://localhost:3000/api/v1/stalls -H "Content-Type: application/json" -d '{"ownerId":2}'
```

Respons `400` yang tampil di Swagger UI persis seperti di hands-on 1:

```json
{
  "status": "fail",
  "message": "Validasi gagal",
  "errors": [
    { "field": "name", "message": "name wajib diisi" }
  ]
}
```

> **Catatan:** Swagger UI browser memanggil `http://localhost:3000` langsung dari browser
> kamu — pastikan tidak ada proxy/CORS manager yang memblokir origin `localhost:3000`.

## Swagger 2.0 (pertemuan 3) vs OpenAPI 3.0 (pertemuan 4)

| Aspek | Pertemuan-03 `swagger-autogen` | Pertemuan-04 `zod-to-openapi` |
| --- | --- | --- |
| Versi spec | **Swagger 2.0** | **OpenAPI 3.0** |
| Generator | Scan file route + komentar `#swagger.*` | Dari **skema zod** (satu sumber) |
| Schema | `#/definitions/...` | `#/components/schemas/...` |
| Body request | `parameters[body]` / `definitions` | `requestBody` + `content` + `$ref` |
| Konsistensi dgn validasi | Perlu jaga dua tempat | Otomatis sinkron (single source of truth) |
| Dokumen | File `swagger-output.json` hasil generate | Objek JS di memori |

Keduanya valid — `swagger-autogen` cepat untuk prototype, `zod-to-openapi` lebih aman
karena spek tidak bisa melenceng dari skema validasi.

## Troubleshooting

| Gejala | Kemungkinan penyebab & solusi |
| --- | --- |
| `/docs` → `301` lalu kosong | Swagger UI me-redirect ke `/docs/`; buka langsung `http://localhost:3000/docs/`. |
| Error `UnsupportedZodType` saat generate | Tipe zod yang belum didukung (mis. versi zod v4). Pastikan pasangan versi: zod **v3** + `zod-to-openapi` **7.3.4**. |
| `requestBody` inline (bukan `$ref`) | Pakai **nilai kembalian** `registry.register('X', schema)` di `content.schema`, bukan variabel skema aslinya. |
| Contoh/deskripsi tidak muncul | Field belum di-`.openapi({ example, description })`. Metadata `example` lebih diutamakan daripada `examples`. |
| Validasi menolak request dari Swagger UI | Spek hanya dokumentasi; validasi & error handling tetap bekerja normal dari middleware `validate`. Pastikan isi body sesuai contoh. |
| Added `accept`/`content-type` header tak dikenal muncul di `req.params`? | Tidak — hanya `z.coerce` di `idParamSchema` yang dipakai untuk params; header lain tidak memengaruhi validasi. |

## Struktur Project

```
hands-on-2-dokumentasi-swagger-openapi/
├─ README.md
├─ .env.example
├─ drizzle.config.ts          # referensi drizzle-kit (tidak dipakai di sini)
├─ package.json  tsconfig.json
└─ src/
   ├─ index.ts                # + /docs (swagger-ui-express) di luar 404/error
   ├─ docs/openapi.ts         # registri & generator OpenAPI 3.0 (in-memory)
   ├─ errors/                 # AppError, NotFoundError, ValidationError  [SAMA dgn hands-on 1]
   ├─ schemas/stallSchema.ts  # skema zod (+ metadata .openapi)
   ├─ middlewares/            # validate, notFound, errorHandler
   ├─ db/{schema.ts, index.ts}
   ├─ dtos/stallDto.ts
   ├─ repositories/  services/  controllers/  routes/
```

## Bacaan Lanjutan

- [@asteasolutions/zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi):
  `OpenAPIRegistry`, `registerPath`, dan kumpulan contoh lengkap.
- [OpenAPI Specification 3.0.3](https://swagger.io/specification/): `components/schemas`,
  `requestBody`, `responses`, `$ref`.
- [swagger-ui-express](https://www.npmjs.com/package/swagger-ui-express): opsi
  penyajian Swagger UI di Express.