import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  createStallSchema,
  idParamSchema,
  stallQuerySchema,
  updateStallSchema,
} from '../schemas/stallSchema.ts';
import { loginSchema, registerSchema } from '../schemas/authSchema.ts';
import { createReviewSchema } from '../schemas/reviewSchema.ts';

const registry = new OpenAPIRegistry();

// Komponen keamanan.
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

// Komponen schema untuk RESPONS (dibuat khusus di sini). Schema untuk BODY
// (createStallSchema, updateStallSchema) sudah didefinisikan di stallSchema.ts
// dan hanya "didaftarkan" agar dipakai ulang lewat $ref.
const stallSchema = registry.register(
  'Stall',
  z.object({
    id: z.number().openapi({ example: 1 }),
    ownerId: z.number().openapi({ example: 2 }),
    name: z.string().openapi({ example: 'Warung Bu Tini' }),
    category: z.string().nullable().openapi({ example: 'Kwetiau' }),
    location: z.string().nullable().openapi({ example: 'Kantin FKIP' }),
    description: z.string().nullable().openapi({ example: 'Kedai kwetiau goreng & kuah' }),
    avgRating: z.number().openapi({ example: 4.5 }),
    reviewCount: z.number().openapi({ example: 2 }),
    isPopular: z.boolean().openapi({ example: false }),
  }),
);

const menuSchema = registry.register(
  'Menu',
  z.object({
    id: z.number().openapi({ example: 1 }),
    stallId: z.number().openapi({ example: 2 }),
    name: z.string().openapi({ example: 'Kwetiau Goreng Spesial' }),
    price: z.number().openapi({ example: 15000 }),
    isAvailable: z.boolean().openapi({ example: true }),
  }),
);

const errorSchema = registry.register(
  'ErrorResponse',
  z.object({
    status: z.string().openapi({ example: 'fail' }),
    message: z.string().openapi({ example: 'Validasi gagal' }),
    errors: z
      .array(z.object({ field: z.string(), message: z.string() }))
      .optional()
      .openapi({ example: [{ field: 'name', message: 'name minimal 3 karakter' }] }),
  }),
);

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

const authUserResponse = registry.register(
  'AuthUserResponse',
  z.object({
    status: z.literal('success'),
    data: authUserSchema,
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

// Schema body yang DIPAKAI VALIDASI di-handler juga didaftarkan sebagai komponen
// (single source of truth: satu schema bertugas untuk validasi + dokumentasi).
// Nilai kembalian `register` dipakai sebagai referensi ($ref) di requestBody.
const stallInput = registry.register('StallInput', createStallSchema);
const stallUpdate = registry.register('StallUpdate', updateStallSchema);

const stallListResponse = registry.register(
  'StallListResponse',
  z.object({
    status: z.literal('success'),
    meta: z.object({
      page: z.number().openapi({ example: 1 }),
      limit: z.number().openapi({ example: 10 }),
      total: z.number().openapi({ example: 10 }),
    }),
    data: z.array(stallSchema),
  }),
);

const stallDetailResponse = registry.register(
  'StallDetailResponse',
  z.object({
    status: z.literal('success'),
    data: stallSchema,
  }),
);

const menuListResponse = registry.register(
  'MenuListResponse',
  z.object({
    status: z.literal('success'),
    data: z.array(menuSchema),
  }),
);

// Definisi route.
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
  path: '/api/v1/auth/profile',
  summary: 'Profil terbaru dari database',
  description:
    'Route terlindungi (authenticate). `req.user.id` dipakai untuk memuat ulang ' +
    'user dari database, jadi mencerminkan perubahan role terbaru.',
  security: secured,
  responses: {
    200: {
      description: 'Data user terbaru dari database',
      content: { 'application/json': { schema: authUserResponse } },
    },
    ...unauthorizedResponse,
    404: {
      description: 'Token valid tapi user sudah tidak ada',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/stalls/{id}/reviews',
  summary: 'Beri review untuk sebuah warung',
  description:
    'Route terlindungi (authenticate), semua role boleh. Identitas penulis ' +
    'diambil dari `req.user`, bukan dari body — field `userId` tidak ada di ' +
    'schema sehingga `.strict()` akan menolaknya.',
  security: secured,
  request: {
    params: idParamSchema,
    body: {
      description: 'Isi review',
      content: { 'application/json': { schema: reviewInput } },
    },
  },
  responses: {
    201: {
      description: 'Review tersimpan',
      content: { 'application/json': { schema: reviewResponse } },
    },
    400: {
      description: 'Body/parameter tidak valid',
      content: { 'application/json': { schema: errorSchema } },
    },
    ...unauthorizedResponse,
    404: {
      description: 'Warung tidak ditemukan',
      content: { 'application/json': { schema: errorSchema } },
    },
    409: {
      description: 'User ini sudah pernah memberi review untuk warung tersebut',
      content: { 'application/json': { schema: errorSchema } },
    },
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

registry.registerPath({
  method: 'get',
  path: '/health',
  summary: 'Cek kesehatan server & database',
  responses: {
    200: {
      description: 'Server dan database terhubung',
      content: {
        'application/json': {
          schema: z.object({
            status: z.literal('success'),
            message: z.string(),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/stalls',
  summary: 'Daftar warung',
  description: 'Daftar warung dengan filter `search`/`category` dan pagination.',
  request: { query: stallQuerySchema },
  responses: {
    200: {
      description: 'Daftar warung + meta pagination',
      content: { 'application/json': { schema: stallListResponse } },
    },
    400: {
      description: 'Query parameter tidak valid',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
});

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

registry.registerPath({
  method: 'get',
  path: '/api/v1/stalls/{id}',
  summary: 'Detail warung',
  request: { params: idParamSchema },
  responses: {
    200: {
      description: 'Detail warung',
      content: { 'application/json': { schema: stallDetailResponse } },
    },
    400: {
      description: 'Parameter id tidak valid',
      content: { 'application/json': { schema: errorSchema } },
    },
    404: {
      description: 'Warung tidak ditemukan',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/stalls/{id}',
  summary: 'Update warung',
  description:
    'Butuh `owner` atau `admin`. Selain cek role, service juga memastikan warung ' +
    'yang diubah milik user tersebut — token `owner` milik orang lain akan 403.',
  security: secured,
  request: {
    params: idParamSchema,
    body: {
      description: 'Data warung yang diubah (boleh sebagian)',
      content: { 'application/json': { schema: stallUpdate } },
    },
  },
  responses: {
    200: {
      description: 'Warung ter-update',
      content: { 'application/json': { schema: stallDetailResponse } },
    },
    400: {
      description: 'Body/parameter tidak valid',
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

registry.registerPath({
  method: 'delete',
  path: '/api/v1/stalls/{id}',
  summary: 'Hapus warung (admin)',
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

registry.registerPath({
  method: 'get',
  path: '/api/v1/stalls/{id}/menus',
  summary: 'Daftar menu sebuah warung',
  request: { params: idParamSchema },
  responses: {
    200: {
      description: 'Daftar menu milik warung',
      content: { 'application/json': { schema: menuListResponse } },
    },
    400: {
      description: 'Parameter id tidak valid',
      content: { 'application/json': { schema: errorSchema } },
    },
    404: {
      description: 'Warung tidak ditemukan',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
});

// Dokumen OpenAPI 3.0 dihasilkan IN-MEMORY (tanpa file), lalu disajikan
// swagger-ui-express di /docs — selalu sinkron dengan schema terbaru.
const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiDocument = generator.generateDocument({
  openapi: '3.0.0',
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
  servers: [{ url: 'http://localhost:3000' }],
});