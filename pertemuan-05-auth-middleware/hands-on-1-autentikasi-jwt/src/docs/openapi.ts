import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  createStallSchema,
  idParamSchema,
  stallQuerySchema,
  updateStallSchema,
} from '../schemas/stallSchema.ts';
import { loginSchema, registerSchema } from '../schemas/authSchema.ts';

const registry = new OpenAPIRegistry();

// ----------------------------------------------------------------- schema
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

// ------------------------------------------------------------------ routes
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
    404: {
      description: 'Warung tidak ditemukan',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/stalls/{id}',
  summary: 'Hapus warung',
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

// ----------------------------------------------------------------- generate
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
      '(@asteasolutions/zod-to-openapi) — satu sumber kebenaran untuk validasi dan dokumentasi.',
  },
  servers: [{ url: 'http://localhost:3000' }],
});