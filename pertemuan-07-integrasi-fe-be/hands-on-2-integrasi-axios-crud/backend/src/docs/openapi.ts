const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const json = (schema: unknown) => ({
  'application/json': { schema },
});

const success = (schema: unknown) => ({
  description: 'Berhasil',
  content: json({
    type: 'object',
    required: ['status', 'data'],
    properties: {
      status: { type: 'string', example: 'success' },
      data: schema,
    },
  }),
});

const listSuccess = (schema: unknown) =>
  success({ type: 'array', items: schema });

const dataBody = (schema: unknown) => ({
  required: true,
  content: json(schema),
});

const error = (description: string) => ({
  description,
  content: json(ref('Error')),
});

const idParameter = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'integer', minimum: 1 },
};

const ok = (description: string) => ({ description });

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Maem Bolo API - Hands-On 2',
    version: '1.0.0',
    description:
      'API integrasi frontend-backend untuk autentikasi cookie JWT, CRUD warung/menu/review, like, flag, dan audit log.',
  },
  servers: [{ url: 'http://localhost:3000' }],
  tags: [
    { name: 'Health', description: 'Status server dan database' },
    { name: 'Auth', description: 'Register, login, sesi, dan logout' },
    { name: 'Profile', description: 'Profil pengguna yang sedang login' },
    { name: 'Users', description: 'Manajemen user oleh admin' },
    { name: 'Stalls', description: 'Warung dan RBAC owner' },
    { name: 'Menu', description: 'Menu warung dan RBAC owner' },
    { name: 'Reviews', description: 'Review, moderasi, dan like' },
    { name: 'Flags', description: 'Laporan review dan moderasi admin' },
    { name: 'Audit', description: 'Audit log aktivitas admin' },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'kantin_session',
        description: 'JWT disimpan sebagai cookie HttpOnly setelah login.',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['status', 'message'],
        properties: {
          status: { type: 'string', enum: ['fail', 'error'], example: 'fail' },
          message: { type: 'string', example: 'Data tidak ditemukan' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'email' },
                message: { type: 'string', example: 'format email tidak valid' },
              },
            },
          },
        },
      },
      User: {
        type: 'object',
        required: ['id', 'name', 'email', 'role', 'createdAt'],
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Admin Kantin' },
          email: { type: 'string', format: 'email', example: 'admin@kantin.test' },
          role: { type: 'string', enum: ['admin', 'owner', 'customer'] },
          createdAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      Stall: {
        type: 'object',
        required: ['id', 'ownerId', 'ownerName', 'name', 'avgRating', 'reviewCount', 'isPopular'],
        properties: {
          id: { type: 'integer' },
          ownerId: { type: 'integer' },
          ownerName: { type: 'string' },
          name: { type: 'string' },
          category: { type: 'string', nullable: true },
          location: { type: 'string', nullable: true },
          description: { type: 'string', nullable: true },
          avgRating: { type: 'number', example: 4.5 },
          reviewCount: { type: 'integer', example: 2 },
          isPopular: { type: 'boolean', example: false },
          createdAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      Menu: {
        type: 'object',
        required: ['id', 'stallId', 'stallName', 'name', 'price', 'isAvailable'],
        properties: {
          id: { type: 'integer' },
          stallId: { type: 'integer' },
          stallName: { type: 'string' },
          name: { type: 'string' },
          price: { type: 'integer', example: 15000 },
          isAvailable: { type: 'boolean' },
        },
      },
      Review: {
        type: 'object',
        required: ['id', 'stallId', 'userId', 'rating', 'likeCount', 'likedByMe'],
        properties: {
          id: { type: 'integer' },
          stallId: { type: 'integer' },
          stallName: { type: 'string' },
          userId: { type: 'integer' },
          userName: { type: 'string' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          comment: { type: 'string', nullable: true },
          likeCount: { type: 'integer' },
          likedByMe: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time', nullable: true },
          updatedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      LikeState: {
        type: 'object',
        required: ['reviewId', 'liked', 'likeCount'],
        properties: {
          reviewId: { type: 'integer' },
          liked: { type: 'boolean' },
          likeCount: { type: 'integer' },
        },
      },
      Flag: {
        type: 'object',
        required: ['id', 'reviewId', 'reportedBy', 'status'],
        properties: {
          id: { type: 'integer' },
          reviewId: { type: 'integer' },
          reportedBy: { type: 'integer' },
          reporterName: { type: 'string' },
          reviewComment: { type: 'string', nullable: true },
          stallId: { type: 'integer' },
          stallName: { type: 'string' },
          reason: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['pending', 'resolved', 'dismissed'] },
          createdAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      AuditLog: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          userId: { type: 'integer' },
          userName: { type: 'string' },
          action: { type: 'string' },
          targetTable: { type: 'string' },
          targetId: { type: 'integer' },
          metadata: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      RegisterInput: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 3, maxLength: 100 },
          email: { type: 'string', format: 'email', maxLength: 150 },
          password: { type: 'string', minLength: 8, maxLength: 72 },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      CreateOwnerInput: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 3, maxLength: 100 },
          email: { type: 'string', format: 'email', maxLength: 150 },
          password: { type: 'string', minLength: 8, maxLength: 72 },
        },
      },
      RoleInput: {
        type: 'object',
        required: ['role'],
        properties: {
          role: { type: 'string', enum: ['admin', 'owner', 'customer'] },
        },
      },
      ProfileInput: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 3, maxLength: 100 },
          email: { type: 'string', format: 'email', maxLength: 150 },
        },
      },
      PasswordInput: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 8, maxLength: 72 },
        },
      },
      StallCreateInput: {
        type: 'object',
        required: ['ownerId', 'name'],
        properties: {
          ownerId: { type: 'integer' },
          name: { type: 'string', minLength: 3, maxLength: 100 },
          category: { type: 'string', nullable: true, maxLength: 50 },
          location: { type: 'string', nullable: true, maxLength: 100 },
          description: { type: 'string', nullable: true, maxLength: 1000 },
        },
      },
      StallUpdateInput: {
        type: 'object',
        properties: {
          ownerId: { type: 'integer' },
          name: { type: 'string', minLength: 3, maxLength: 100 },
          category: { type: 'string', nullable: true, maxLength: 50 },
          location: { type: 'string', nullable: true, maxLength: 100 },
          description: { type: 'string', nullable: true, maxLength: 1000 },
        },
      },
      MenuInput: {
        type: 'object',
        required: ['stallId', 'name', 'price'],
        properties: {
          stallId: { type: 'integer' },
          name: { type: 'string', minLength: 2, maxLength: 100 },
          price: { type: 'integer', minimum: 0 },
          isAvailable: { type: 'boolean', default: true },
        },
      },
      ReviewInput: {
        type: 'object',
        required: ['rating'],
        properties: {
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          comment: { type: 'string', nullable: true, maxLength: 1000 },
        },
      },
      FlagInput: {
        type: 'object',
        properties: {
          reason: { type: 'string', nullable: true, maxLength: 255 },
        },
      },
      FlagStatusInput: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['resolved', 'dismissed'] },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Cek server dan koneksi database',
        responses: {
          200: ok('Server dan database terhubung'),
          500: error('Database tidak dapat dihubungi'),
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register customer',
        requestBody: dataBody(ref('RegisterInput')),
        responses: {
          201: success(ref('User')),
          400: error('Validasi gagal'),
          409: error('Email sudah terdaftar'),
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login dan set cookie HttpOnly',
        requestBody: dataBody(ref('LoginInput')),
        responses: {
          200: {
            description: 'Login berhasil; cookie sesi dikirim melalui Set-Cookie',
            content: json({
              type: 'object',
              properties: {
                status: { type: 'string', example: 'success' },
                data: ref('User'),
              },
            }),
          },
          401: error('Email atau password salah'),
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Ambil sesi user saat ini',
        security: [{ cookieAuth: [] }],
        responses: {
          200: success(ref('User')),
          401: error('Belum login atau cookie kedaluwarsa'),
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Hapus cookie sesi (tidak membutuhkan sesi aktif)',
        responses: { 204: ok('Cookie sesi dihapus') },
      },
    },
    '/api/profile': {
      get: {
        tags: ['Profile'],
        summary: 'Ambil profil sendiri',
        security: [{ cookieAuth: [] }],
        responses: {
          200: success(ref('User')),
          401: error('Belum login'),
        },
      },
      put: {
        tags: ['Profile'],
        summary: 'Ubah nama/email sendiri',
        security: [{ cookieAuth: [] }],
        requestBody: dataBody(ref('ProfileInput')),
        responses: {
          200: success(ref('User')),
          400: error('Validasi gagal'),
          401: error('Belum login'),
          409: error('Email sudah dipakai'),
        },
      },
    },
    '/api/profile/password': {
      patch: {
        tags: ['Profile'],
        summary: 'Ganti password sendiri dan akhiri sesi',
        security: [{ cookieAuth: [] }],
        requestBody: dataBody(ref('PasswordInput')),
        responses: {
          204: ok('Password berubah; cookie dihapus'),
          400: error('Validasi gagal atau password lama salah'),
          401: error('Belum login'),
        },
      },
    },
    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'Daftar user (admin)',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['admin', 'owner', 'customer'] } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: listSuccess(ref('User')),
          401: error('Belum login'),
          403: error('Bukan admin'),
        },
      },
    },
    '/api/users/owner': {
      post: {
        tags: ['Users'],
        summary: 'Buat akun owner (admin)',
        security: [{ cookieAuth: [] }],
        requestBody: dataBody(ref('CreateOwnerInput')),
        responses: {
          201: success(ref('User')),
          400: error('Validasi gagal'),
          401: error('Belum login'),
          403: error('Bukan admin'),
          409: error('Email sudah terdaftar'),
        },
      },
    },
    '/api/users/{id}/role': {
      patch: {
        tags: ['Users'],
        summary: 'Ubah role user (admin)',
        security: [{ cookieAuth: [] }],
        parameters: [idParameter],
        requestBody: dataBody(ref('RoleInput')),
        responses: {
          200: success(ref('User')),
          400: error('Validasi gagal'),
          401: error('Belum login'),
          403: error('Bukan admin atau menurunkan role sendiri'),
          404: error('User tidak ditemukan'),
          409: error('Minimal satu admin harus tersisa'),
        },
      },
    },
    '/api/stalls': {
      get: {
        tags: ['Stalls'],
        summary: 'Daftar warung',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: listSuccess(ref('Stall')) },
      },
      post: {
        tags: ['Stalls'],
        summary: 'Buat warung (admin)',
        security: [{ cookieAuth: [] }],
        requestBody: dataBody(ref('StallCreateInput')),
        responses: {
          201: success(ref('Stall')),
          400: error('Validasi gagal atau owner bukan role owner'),
          401: error('Belum login'),
          403: error('Bukan admin'),
          404: error('Owner tidak ditemukan'),
        },
      },
    },
    '/api/stalls/{id}': {
      get: {
        tags: ['Stalls'],
        summary: 'Detail warung',
        parameters: [idParameter],
        responses: {
          200: success(ref('Stall')),
          404: error('Warung tidak ditemukan'),
        },
      },
      put: {
        tags: ['Stalls'],
        summary: 'Ubah warung (admin/owner pemilik)',
        security: [{ cookieAuth: [] }],
        parameters: [idParameter],
        requestBody: dataBody(ref('StallUpdateInput')),
        responses: {
          200: success(ref('Stall')),
          400: error('Validasi gagal'),
          401: error('Belum login'),
          403: error('Bukan admin/pemilik'),
          404: error('Warung/owner tidak ditemukan'),
        },
      },
      delete: {
        tags: ['Stalls'],
        summary: 'Hapus warung beserta data anak (admin/owner pemilik)',
        security: [{ cookieAuth: [] }],
        parameters: [idParameter],
        responses: {
          204: ok('Warung dihapus'),
          401: error('Belum login'),
          403: error('Bukan admin/pemilik'),
          404: error('Warung tidak ditemukan'),
        },
      },
    },
    '/api/menu': {
      get: {
        tags: ['Menu'],
        summary: 'Daftar menu',
        parameters: [
          { name: 'stallId', in: 'query', schema: { type: 'integer' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'available', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
        ],
        responses: { 200: listSuccess(ref('Menu')) },
      },
      post: {
        tags: ['Menu'],
        summary: 'Tambah menu (admin/owner pemilik warung)',
        security: [{ cookieAuth: [] }],
        requestBody: dataBody(ref('MenuInput')),
        responses: {
          201: success(ref('Menu')),
          400: error('Validasi gagal'),
          401: error('Belum login'),
          403: error('Bukan admin/pemilik warung'),
          404: error('Warung tidak ditemukan'),
        },
      },
    },
    '/api/menu/{id}': {
      get: {
        tags: ['Menu'],
        summary: 'Detail menu',
        parameters: [idParameter],
        responses: {
          200: success(ref('Menu')),
          404: error('Menu tidak ditemukan'),
        },
      },
      put: {
        tags: ['Menu'],
        summary: 'Ubah menu (admin/owner pemilik warung)',
        security: [{ cookieAuth: [] }],
        parameters: [idParameter],
        requestBody: dataBody(ref('MenuInput')),
        responses: {
          200: success(ref('Menu')),
          400: error('Validasi gagal'),
          401: error('Belum login'),
          403: error('Bukan admin/pemilik warung'),
          404: error('Menu/warung tidak ditemukan'),
        },
      },
      delete: {
        tags: ['Menu'],
        summary: 'Hapus menu (admin/owner pemilik warung)',
        security: [{ cookieAuth: [] }],
        parameters: [idParameter],
        responses: {
          204: ok('Menu dihapus'),
          401: error('Belum login'),
          403: error('Bukan admin/pemilik warung'),
          404: error('Menu tidak ditemukan'),
        },
      },
    },
    '/api/stalls/{id}/reviews': {
      get: {
        tags: ['Reviews'],
        summary: 'Daftar review sebuah warung',
        parameters: [idParameter],
        responses: {
          200: listSuccess(ref('Review')),
          404: error('Warung tidak ditemukan'),
        },
      },
      post: {
        tags: ['Reviews'],
        summary: 'Buat review (customer)',
        security: [{ cookieAuth: [] }],
        parameters: [idParameter],
        requestBody: dataBody(ref('ReviewInput')),
        responses: {
          201: success(ref('Review')),
          400: error('Validasi gagal'),
          401: error('Belum login'),
          403: error('Bukan customer'),
          404: error('Warung tidak ditemukan'),
          409: error('Sudah pernah review warung ini'),
        },
      },
    },
    '/api/reviews/mine': {
      get: {
        tags: ['Reviews'],
        summary: 'Daftar review milik customer yang sedang login',
        security: [{ cookieAuth: [] }],
        responses: {
          200: listSuccess(ref('Review')),
          401: error('Belum login'),
          403: error('Bukan customer'),
        },
      },
    },
    '/api/reviews/manage': {
      get: {
        tags: ['Reviews'],
        summary: 'Daftar review untuk moderasi (admin/owner)',
        security: [{ cookieAuth: [] }],
        responses: {
          200: listSuccess(ref('Review')),
          401: error('Belum login'),
          403: error('Bukan admin/owner'),
        },
      },
    },
    '/api/reviews/{id}': {
      put: {
        tags: ['Reviews'],
        summary: 'Ubah review sendiri (customer)',
        security: [{ cookieAuth: [] }],
        parameters: [idParameter],
        requestBody: dataBody(ref('ReviewInput')),
        responses: {
          200: success(ref('Review')),
          400: error('Validasi gagal'),
          401: error('Belum login'),
          403: error('Bukan pemilik review'),
          404: error('Review tidak ditemukan'),
        },
      },
      delete: {
        tags: ['Reviews'],
        summary: 'Hapus review (customer pemilik, owner warung, admin)',
        security: [{ cookieAuth: [] }],
        parameters: [idParameter],
        responses: {
          204: ok('Review dihapus'),
          401: error('Belum login'),
          403: error('Tidak berhak menghapus review'),
          404: error('Review tidak ditemukan'),
        },
      },
    },
    '/api/reviews/{id}/like': {
      post: {
        tags: ['Reviews'],
        summary: 'Like review (customer)',
        security: [{ cookieAuth: [] }],
        parameters: [idParameter],
        responses: {
          200: success(ref('LikeState')),
          401: error('Belum login'),
          403: error('Bukan customer'),
          404: error('Review tidak ditemukan'),
          409: error('Sudah like'),
        },
      },
      delete: {
        tags: ['Reviews'],
        summary: 'Unlike review (customer)',
        security: [{ cookieAuth: [] }],
        parameters: [idParameter],
        responses: {
          200: success(ref('LikeState')),
          401: error('Belum login'),
          403: error('Bukan customer'),
          404: error('Review tidak ditemukan'),
        },
      },
    },
    '/api/reviews/{id}/flags': {
      post: {
        tags: ['Flags'],
        summary: 'Laporkan review (customer)',
        security: [{ cookieAuth: [] }],
        parameters: [idParameter],
        requestBody: dataBody(ref('FlagInput')),
        responses: {
          201: success(ref('Flag')),
          400: error('Validasi gagal'),
          401: error('Belum login'),
          403: error('Bukan customer'),
          404: error('Review tidak ditemukan'),
        },
      },
    },
    '/api/flags': {
      get: {
        tags: ['Flags'],
        summary: 'Daftar flag (admin)',
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['pending', 'resolved', 'dismissed'] },
          },
        ],
        responses: {
          200: listSuccess(ref('Flag')),
          401: error('Belum login'),
          403: error('Bukan admin'),
        },
      },
    },
    '/api/flags/{id}': {
      patch: {
        tags: ['Flags'],
        summary: 'Ubah status flag (admin)',
        security: [{ cookieAuth: [] }],
        parameters: [idParameter],
        requestBody: dataBody(ref('FlagStatusInput')),
        responses: {
          200: success(ref('Flag')),
          400: error('Validasi gagal'),
          401: error('Belum login'),
          403: error('Bukan admin'),
          404: error('Flag tidak ditemukan'),
        },
      },
    },
    '/api/audit-logs': {
      get: {
        tags: ['Audit'],
        summary: 'Daftar audit log (admin)',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'action', in: 'query', schema: { type: 'string' } },
          { name: 'targetTable', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: listSuccess(ref('AuditLog')),
          401: error('Belum login'),
          403: error('Bukan admin'),
        },
      },
    },
  },
} as const;
