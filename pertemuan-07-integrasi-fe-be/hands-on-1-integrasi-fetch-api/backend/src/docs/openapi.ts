import { env } from '../config/env.ts';

const menuExample = {
  id: 1,
  stallId: 1,
  stallName: 'Warung Bu Tini',
  name: 'Kwetiau Goreng Spesial',
  price: 15000,
  isAvailable: true,
};

const stallExample = {
  id: 1,
  name: 'Warung Bu Tini',
  category: 'Kwetiau',
  location: 'Kantin FKIP',
};

const validationErrorExample = {
  status: 'fail',
  message: 'Validasi gagal',
  errors: [
    {
      field: 'price',
      message: 'price wajib berupa bilangan bulat minimal 0',
    },
  ],
};

const validationErrorResponse = {
  description: 'Input tidak valid.',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: validationErrorExample,
    },
  },
};

const notFoundResponse = {
  description: 'Data yang diminta tidak ditemukan.',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: {
        status: 'fail',
        message: 'Menu tidak ditemukan',
      },
    },
  },
};

const conflictResponse = {
  description: 'Data bertentangan dengan constraint database.',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: {
        status: 'fail',
        message: 'Data bentrok dengan data yang sudah ada',
      },
    },
  },
};

const serverErrorResponse = {
  description: 'Terjadi kesalahan yang tidak terduga.',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: {
        status: 'error',
        message: 'Terjadi kesalahan pada server',
      },
    },
  },
};

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Maem Bolo API',
    version: '1.0.0',
    description:
      'REST API untuk manajemen menu kantin Maem Bolo. API ini tidak memakai autentikasi dan digunakan untuk pembelajaran integrasi frontend dan backend.',
  },
  servers: [
    {
      url: `http://localhost:${env.port}`,
      description: 'Local development server',
    },
  ],
  tags: [
    {
      name: 'Health',
      description: 'Pemeriksaan koneksi server dan database.',
    },
    {
      name: 'Menu',
      description: 'Operasi CRUD data menu kantin.',
    },
    {
      name: 'Stall',
      description: 'Data warung yang menjadi relasi menu.',
    },
  ],
  security: [],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Cek kesehatan server dan database',
        description:
          'Menjalankan query ringan untuk memastikan server dan koneksi database tersedia.',
        operationId: 'getHealth',
        responses: {
          200: {
            description: 'Server dan database terhubung.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse',
                },
                example: {
                  status: 'success',
                  message: 'Server dan database terhubung',
                  database: { ok: 1 },
                  timestamp: '2026-10-24T08:00:00.000Z',
                },
              },
            },
          },
          500: {
            description: 'Server tidak dapat terhubung ke database.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  status: 'error',
                  message: 'Gagal terhubung ke database',
                },
              },
            },
          },
        },
      },
    },
    '/api/menu': {
      get: {
        tags: ['Menu'],
        summary: 'Ambil semua menu',
        description:
          'Mengembalikan seluruh menu yang terdaftar beserta nama warung. Data diurutkan dari ID terbesar.',
        operationId: 'listMenus',
        responses: {
          200: {
            description: 'Daftar menu berhasil diambil.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MenuListResponse' },
                example: {
                  status: 'success',
                  data: [menuExample],
                },
              },
            },
          },
          500: serverErrorResponse,
        },
      },
      post: {
        tags: ['Menu'],
        summary: 'Tambah menu',
        description:
          'Membuat menu baru. `stallId` harus merujuk ke warung yang tersedia. `isAvailable` boleh dihilangkan dan akan bernilai `true`.',
        operationId: 'createMenu',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MenuCreateInput' },
              example: {
                stallId: 1,
                name: 'Kwetiau Goreng Spesial',
                price: 15000,
                isAvailable: true,
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Menu berhasil dibuat.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MenuResponse' },
                example: {
                  status: 'success',
                  data: menuExample,
                },
              },
            },
          },
          400: validationErrorResponse,
          404: {
            description: 'Warung dengan `stallId` tersebut tidak ditemukan.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  status: 'fail',
                  message: 'Warung tidak ditemukan',
                },
              },
            },
          },
          409: conflictResponse,
          500: serverErrorResponse,
        },
      },
    },
    '/api/menu/{id}': {
      parameters: [{ $ref: '#/components/parameters/MenuId' }],
      get: {
        tags: ['Menu'],
        summary: 'Ambil detail menu',
        description: 'Mengembalikan satu menu berdasarkan ID.',
        operationId: 'getMenuById',
        responses: {
          200: {
            description: 'Detail menu berhasil diambil.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MenuResponse' },
                example: {
                  status: 'success',
                  data: menuExample,
                },
              },
            },
          },
          400: validationErrorResponse,
          404: notFoundResponse,
          500: serverErrorResponse,
        },
      },
      put: {
        tags: ['Menu'],
        summary: 'Perbarui menu',
        description:
          'Memperbarui seluruh data menu. Payload harus lengkap dan `stallId` harus merujuk ke warung yang tersedia.',
        operationId: 'updateMenu',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MenuUpdateInput' },
              example: {
                stallId: 1,
                name: 'Kwetiau Goreng Jumbo',
                price: 18000,
                isAvailable: false,
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Menu berhasil diperbarui.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MenuResponse' },
                example: {
                  status: 'success',
                  data: {
                    ...menuExample,
                    name: 'Kwetiau Goreng Jumbo',
                    price: 18000,
                    isAvailable: false,
                  },
                },
              },
            },
          },
          400: validationErrorResponse,
          404: notFoundResponse,
          409: conflictResponse,
          500: serverErrorResponse,
        },
      },
      delete: {
        tags: ['Menu'],
        summary: 'Hapus menu',
        description: 'Menghapus menu berdasarkan ID.',
        operationId: 'deleteMenu',
        responses: {
          204: {
            description: 'Menu berhasil dihapus. Response tidak memiliki body.',
          },
          400: validationErrorResponse,
          404: notFoundResponse,
          500: serverErrorResponse,
        },
      },
    },
    '/api/stalls': {
      get: {
        tags: ['Stall'],
        summary: 'Ambil semua warung',
        description:
          'Mengembalikan seluruh warung yang dapat dipilih pada form menu.',
        operationId: 'listStalls',
        responses: {
          200: {
            description: 'Daftar warung berhasil diambil.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StallListResponse' },
                example: {
                  status: 'success',
                  data: [stallExample],
                },
              },
            },
          },
          500: serverErrorResponse,
        },
      },
    },
  },
  components: {
    parameters: {
      MenuId: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'ID menu berupa bilangan bulat lebih dari 0.',
        schema: {
          type: 'integer',
          minimum: 1,
          example: 1,
        },
      },
    },
    schemas: {
      Menu: {
        type: 'object',
        required: [
          'id',
          'stallId',
          'stallName',
          'name',
          'price',
          'isAvailable',
        ],
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          stallId: {
            type: 'integer',
            example: 1,
          },
          stallName: {
            type: 'string',
            example: 'Warung Bu Tini',
          },
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            example: 'Kwetiau Goreng Spesial',
          },
          price: {
            type: 'integer',
            minimum: 0,
            maximum: 1000000000,
            example: 15000,
          },
          isAvailable: {
            type: 'boolean',
            example: true,
          },
        },
      },
      MenuCreateInput: {
        type: 'object',
        required: ['stallId', 'name', 'price'],
        properties: {
          stallId: {
            type: 'integer',
            minimum: 1,
            description: 'ID warung yang harus sudah ada di tabel STALLS.',
            example: 1,
          },
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            description: 'Nama menu setelah di-trim.',
            example: 'Kwetiau Goreng Spesial',
          },
          price: {
            type: 'integer',
            minimum: 0,
            maximum: 1000000000,
            description: 'Harga dalam rupiah.',
            example: 15000,
          },
          isAvailable: {
            type: 'boolean',
            default: true,
            description: 'Status ketersediaan menu. Default true.',
            example: true,
          },
        },
      },
      MenuUpdateInput: {
        type: 'object',
        required: ['stallId', 'name', 'price', 'isAvailable'],
        properties: {
          stallId: {
            type: 'integer',
            minimum: 1,
            description: 'ID warung yang harus sudah ada di tabel STALLS.',
            example: 1,
          },
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            description: 'Nama menu setelah di-trim.',
            example: 'Kwetiau Goreng Jumbo',
          },
          price: {
            type: 'integer',
            minimum: 0,
            maximum: 1000000000,
            description: 'Harga dalam rupiah.',
            example: 18000,
          },
          isAvailable: {
            type: 'boolean',
            description: 'Status ketersediaan menu.',
            example: false,
          },
        },
      },
      Stall: {
        type: 'object',
        required: ['id', 'name', 'category', 'location'],
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          name: {
            type: 'string',
            example: 'Warung Bu Tini',
          },
          category: {
            type: 'string',
            nullable: true,
            example: 'Kwetiau',
          },
          location: {
            type: 'string',
            nullable: true,
            example: 'Kantin FKIP',
          },
        },
      },
      MenuListResponse: {
        type: 'object',
        required: ['status', 'data'],
        properties: {
          status: {
            type: 'string',
            enum: ['success'],
            example: 'success',
          },
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Menu' },
          },
        },
      },
      MenuResponse: {
        type: 'object',
        required: ['status', 'data'],
        properties: {
          status: {
            type: 'string',
            enum: ['success'],
            example: 'success',
          },
          data: { $ref: '#/components/schemas/Menu' },
        },
      },
      StallListResponse: {
        type: 'object',
        required: ['status', 'data'],
        properties: {
          status: {
            type: 'string',
            enum: ['success'],
            example: 'success',
          },
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Stall' },
          },
        },
      },
      HealthResponse: {
        type: 'object',
        required: ['status', 'message', 'database', 'timestamp'],
        properties: {
          status: {
            type: 'string',
            enum: ['success'],
            example: 'success',
          },
          message: {
            type: 'string',
            example: 'Server dan database terhubung',
          },
          database: {
            type: 'object',
            required: ['ok'],
            properties: {
              ok: {
                type: 'integer',
                example: 1,
              },
            },
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2026-10-24T08:00:00.000Z',
          },
        },
      },
      ValidationIssue: {
        type: 'object',
        required: ['field', 'message'],
        properties: {
          field: {
            type: 'string',
            example: 'price',
          },
          message: {
            type: 'string',
            example: 'price wajib berupa bilangan bulat minimal 0',
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        required: ['status', 'message'],
        properties: {
          status: {
            type: 'string',
            enum: ['fail', 'error'],
            example: 'fail',
          },
          message: {
            type: 'string',
            example: 'Validasi gagal',
          },
          errors: {
            type: 'array',
            description: 'Daftar kesalahan validasi jika ada.',
            items: { $ref: '#/components/schemas/ValidationIssue' },
          },
        },
      },
    },
  },
};
