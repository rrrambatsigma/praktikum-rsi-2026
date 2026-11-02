import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { after, before, test } from 'node:test';
import { app } from '../src/app.ts';
import { closePool, getPool } from '../src/db/pool.ts';

let server: Server;
let baseUrl = '';
let ownerCookie = '';
let ownerId = 0;
let foreignStallId = 0;
const createdMenuIds: number[] = [];

// Akun ini benar-benar ada di database setelah db/03-auth-seed.sql dijalankan.
const OWNER_EMAIL = 'tini@kantin.test';
const OWNER_PASSWORD = 'rahasia123';

const validPayload = {
  stallId: 1,
  name: `TEST-HO1-${Date.now()}`,
  category: 'camilan',
  price: 5000,
  description: 'Menu untuk integration test.',
  isAvailable: true,
};

interface RequestOptions {
  method?: string;
  body?: unknown;
  cookie?: string;
  rawBody?: string;
}

async function request(path: string, options: RequestOptions = {}): Promise<Response> {
  const headers: Record<string, string> = {};

  if (options.body !== undefined || options.rawBody !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.cookie) {
    headers.Cookie = options.cookie;
  }

  return fetch(`${baseUrl}${path}`, {
    method: options.method ?? (options.body !== undefined || options.rawBody !== undefined ? 'POST' : 'GET'),
    headers,
    body:
      options.rawBody !== undefined
        ? options.rawBody
        : options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
  });
}

function postJson(path: string, body: unknown, cookie = ownerCookie): Promise<Response> {
  return request(path, { method: 'POST', body, cookie });
}

function readCookie(response: Response): string {
  const setCookies =
    typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : [response.headers.get('set-cookie') ?? ''];

  const cookie = setCookies.find((value) => value.startsWith('kantin_session='));
  return cookie ? cookie.split(';')[0] : '';
}

async function login(email: string, password: string): Promise<Response> {
  return request('/api/auth/login', { method: 'POST', body: { email, password } });
}

before(async () => {
  await getPool();
  server = app.listen(0);
  await once(server, 'listening');

  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Alamat server test tidak valid.');
  }

  baseUrl = `http://127.0.0.1:${address.port}`;

  const response = await login(OWNER_EMAIL, OWNER_PASSWORD);

  if (response.status !== 200) {
    throw new Error(
      'Login owner gagal. Jalankan pertemuan-08-validasi-error-handling\\db\\03-auth-seed.sql terlebih dahulu.',
    );
  }

  const loginBody = (await response.json()) as { data: { id: number } };
  ownerId = loginBody.data.id;
  ownerCookie = readCookie(response);

  if (!ownerCookie) {
    throw new Error('Cookie sesi tidak diterima dari endpoint login.');
  }

  // Form tambah menu memakai warung milik owner ini, bukan id yang di-hardcode.
  const myStallsResponse = await request('/api/stalls/mine', { cookie: ownerCookie });
  const myStallsBody = (await myStallsResponse.json()) as {
    data: { id: number; ownerId: number }[];
  };

  if (myStallsBody.data.length === 0) {
    throw new Error('Owner tidak memiliki warung. Jalankan db/02-menu-seed.sql.');
  }

  validPayload.stallId = myStallsBody.data[0].id;

  // Cari warung milik owner lain untuk menguji object-level authorization.
  const stallsResponse = await request('/api/stalls');
  const stallsBody = (await stallsResponse.json()) as {
    data: { id: number; ownerId: number }[];
  };
  const foreign = stallsBody.data.find((stall) => stall.ownerId !== ownerId);

  if (!foreign) {
    throw new Error('Tidak ada warung milik owner lain untuk menguji RBAC.');
  }

  foreignStallId = foreign.id;
});

after(async () => {
  if (createdMenuIds.length > 0) {
    const pool = await getPool();

    for (const id of createdMenuIds) {
      await pool
        .request()
        .input('id', id)
        .query('DELETE FROM dbo.MENU_ITEMS WHERE id = @id');
    }
  }

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  await closePool();
});

test('GET /health mengembalikan 200 dan status database', async () => {
  const response = await request('/health');
  const body = (await response.json()) as {
    status: string;
    database: { ok: number };
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, 'success');
  assert.equal(body.database.ok, 1);
});

test('GET /api/stalls mengembalikan daftar warung beserta pemiliknya', async () => {
  const response = await request('/api/stalls');
  const body = (await response.json()) as {
    status: string;
    data: { id: number; ownerId: number }[];
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, 'success');
  assert.ok(Array.isArray(body.data));
  assert.ok(body.data.length > 0);
  assert.ok(body.data.every((stall) => typeof stall.ownerId === 'number'));
});

test('GET /api/stalls/mine tanpa sesi mengembalikan 401', async () => {
  const response = await request('/api/stalls/mine');
  const body = (await response.json()) as { code: string };

  assert.equal(response.status, 401);
  assert.equal(body.code, 'UNAUTHORIZED');
});

test('GET /api/stalls/mine hanya mengembalikan warung milik owner', async () => {
  const response = await request('/api/stalls/mine', { cookie: ownerCookie });
  const body = (await response.json()) as {
    status: string;
    data: { id: number; ownerId: number }[];
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, 'success');
  assert.ok(body.data.length > 0);
  assert.ok(body.data.every((stall) => stall.ownerId === ownerId));
});

test('GET /api/menu mengembalikan daftar menu', async () => {
  const response = await request('/api/menu');
  const body = (await response.json()) as {
    status: string;
    data: unknown[];
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, 'success');
  assert.ok(Array.isArray(body.data));
  assert.ok(body.data.length > 0);
});

test('POST /api/auth/login menolak email yang formatnya tidak valid', async () => {
  const response = await login('bukan-email', OWNER_PASSWORD);
  const body = (await response.json()) as {
    status: string;
    code: string;
    errors: { field: string }[];
  };

  assert.equal(response.status, 400);
  assert.equal(body.status, 'fail');
  assert.equal(body.code, 'VALIDATION_ERROR');
  assert.ok(body.errors.some((detail) => detail.field === 'email'));
});

test('POST /api/auth/login menolak password kurang dari 8 karakter', async () => {
  const response = await login(OWNER_EMAIL, 'rahasia');
  const body = (await response.json()) as {
    code: string;
    errors: { field: string }[];
  };

  assert.equal(response.status, 400);
  assert.equal(body.code, 'VALIDATION_ERROR');
  assert.ok(body.errors.some((detail) => detail.field === 'password'));
});

test('POST /api/auth/login menolak kredensial yang salah', async () => {
  for (const [email, password] of [
    [OWNER_EMAIL, 'password-salah'],
    ['tidak-ada@kantin.test', OWNER_PASSWORD],
  ]) {
    const response = await login(email, password);
    const body = (await response.json()) as {
      status: string;
      code: string;
      message: string;
    };

    assert.equal(response.status, 401);
    assert.equal(body.status, 'fail');
    assert.equal(body.code, 'UNAUTHORIZED');
    assert.equal(body.message, 'Email atau password tidak sesuai.');
  }
});

test('POST /api/auth/login berhasil mengembalikan user dan cookie httpOnly', async () => {
  const response = await login(OWNER_EMAIL, OWNER_PASSWORD);
  const body = (await response.json()) as {
    status: string;
    message: string;
    data: { id: number; email: string; role: string; passwordHash?: string };
  };

  assert.equal(response.status, 200);
  assert.equal(body.status, 'success');
  assert.equal(body.message, 'Berhasil masuk ke MaemBolo.');
  assert.equal(body.data.email, OWNER_EMAIL);
  assert.equal(body.data.role, 'owner');
  assert.equal(body.data.passwordHash, undefined);

  const setCookieHeader = response.headers.get('set-cookie') ?? '';
  assert.match(setCookieHeader, /HttpOnly/i);
  assert.match(setCookieHeader, /kantin_session=/);
});

test('GET /api/auth/me membutuhkan sesi dan mengembalikan user saat login', async () => {
  const withoutSession = await request('/api/auth/me');
  assert.equal(withoutSession.status, 401);

  const withSession = await request('/api/auth/me', { cookie: ownerCookie });
  const body = (await withSession.json()) as {
    status: string;
    data: { email: string; role: string };
  };

  assert.equal(withSession.status, 200);
  assert.equal(body.status, 'success');
  assert.equal(body.data.email, OWNER_EMAIL);
  assert.equal(body.data.role, 'owner');
});

test('POST /api/auth/logout menghapus cookie sesi', async () => {
  const response = await request('/api/auth/logout', {
    method: 'POST',
    cookie: ownerCookie,
  });
  const body = (await response.json()) as { status: string };

  assert.equal(response.status, 200);
  assert.equal(body.status, 'success');
  assert.match(response.headers.get('set-cookie') ?? '', /kantin_session=;/);
});

test('POST /api/menu tanpa sesi login mengembalikan 401', async () => {
  const response = await request('/api/menu', {
    method: 'POST',
    body: validPayload,
  });
  const body = (await response.json()) as { code: string };

  assert.equal(response.status, 401);
  assert.equal(body.code, 'UNAUTHORIZED');
});

test('POST /api/menu valid mengembalikan 201 dan menyimpan data', async () => {
  const response = await postJson('/api/menu', validPayload);
  const body = (await response.json()) as {
    status: string;
    message: string;
    data: { id: number; name: string; price: number; category: string };
  };

  assert.equal(response.status, 201);
  assert.equal(body.status, 'success');
  assert.equal(body.message, 'Menu berhasil ditambahkan.');
  assert.equal(body.data.name, validPayload.name);
  assert.equal(body.data.price, validPayload.price);
  assert.equal(body.data.category, validPayload.category);

  createdMenuIds.push(body.data.id);

  const pool = await getPool();
  const stored = await pool
    .request()
    .input('id', body.data.id)
    .query<{ id: number }>('SELECT id FROM dbo.MENU_ITEMS WHERE id = @id');

  assert.equal(stored.recordset[0]?.id, body.data.id);
});

test('POST /api/menu ke warung milik owner lain ditolak 403 dan tidak menyimpan', async () => {
  const name = `${validPayload.name}-foreign`;

  const response = await postJson('/api/menu', {
    ...validPayload,
    name,
    stallId: foreignStallId,
  });
  const body = (await response.json()) as {
    status: string;
    code: string;
    message: string;
    errors?: { field: string; message: string }[];
  };

  assert.equal(response.status, 403);
  assert.equal(body.status, 'fail');
  assert.equal(body.code, 'STALL_FORBIDDEN');
  assert.equal(
    body.message,
    'Anda hanya dapat menambah menu pada warung milik Anda.',
  );
  assert.ok(body.errors?.some((detail) => detail.field === 'stallId'));

  const pool = await getPool();
  const stored = await pool
    .request()
    .input('name', name)
    .query<{ id: number }>('SELECT id FROM dbo.MENU_ITEMS WHERE name = @name');

  assert.equal(stored.recordset.length, 0, 'Menu warung orang lain tidak boleh tersimpan');
});

test('POST body kosong mengembalikan 400 dengan field errors', async () => {
  const response = await postJson('/api/menu', {});
  const body = (await response.json()) as {
    status: string;
    code: string;
    errors: { field: string; message: string }[];
  };

  assert.equal(response.status, 400);
  assert.equal(body.status, 'fail');
  assert.equal(body.code, 'VALIDATION_ERROR');
  assert.ok(body.errors.some((detail) => detail.field === 'name'));
  assert.ok(body.errors.some((detail) => detail.field === 'price'));
});

test('POST nama hanya spasi ditolak', async () => {
  const response = await postJson('/api/menu', { ...validPayload, name: '   ' });
  const body = (await response.json()) as {
    code: string;
    errors: { field: string }[];
  };

  assert.equal(response.status, 400);
  assert.equal(body.code, 'VALIDATION_ERROR');
  assert.ok(body.errors.some((detail) => detail.field === 'name'));
});

test('POST harga 0 dan negatif ditolak', async () => {
  for (const price of [0, -1000]) {
    const response = await postJson('/api/menu', { ...validPayload, price });
    const body = (await response.json()) as {
      code: string;
      errors: { field: string }[];
    };

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
    assert.ok(body.errors.some((detail) => detail.field === 'price'));
  }
});

test('POST harga berupa string ditolak', async () => {
  const response = await postJson('/api/menu', {
    ...validPayload,
    price: '5000',
  });
  const body = (await response.json()) as {
    errors: { field: string }[];
  };

  assert.equal(response.status, 400);
  assert.ok(body.errors.some((detail) => detail.field === 'price'));
});

test('POST kategori tidak dikenal ditolak', async () => {
  const response = await postJson('/api/menu', {
    ...validPayload,
    category: 'lainnya',
  });
  const body = (await response.json()) as {
    errors: { field: string }[];
  };

  assert.equal(response.status, 400);
  assert.ok(body.errors.some((detail) => detail.field === 'category'));
});

test('POST warung tidak ditemukan mengembalikan 404', async () => {
  const response = await postJson('/api/menu', {
    ...validPayload,
    name: `${validPayload.name}-stall`,
    stallId: 999_999,
  });
  const body = (await response.json()) as {
    status: string;
    code: string;
    errors: { field: string }[];
  };

  assert.equal(response.status, 404);
  assert.equal(body.status, 'fail');
  assert.equal(body.code, 'STALL_NOT_FOUND');
  assert.ok(body.errors.some((detail) => detail.field === 'stallId'));
});

test('POST field asing ditolak', async () => {
  const response = await postJson('/api/menu', {
    ...validPayload,
    total: 5000,
  });
  const body = (await response.json()) as {
    errors: { field: string }[];
  };

  assert.equal(response.status, 400);
  assert.ok(body.errors.some((detail) => detail.field === 'body'));
});

test('POST JSON rusak mengembalikan 400 INVALID_JSON', async () => {
  const response = await request('/api/menu', {
    method: 'POST',
    rawBody: '{',
    cookie: ownerCookie,
  });
  const body = (await response.json()) as { code: string };

  assert.equal(response.status, 400);
  assert.equal(body.code, 'INVALID_JSON');
});

test('route tidak ditemukan mengembalikan 404 ROUTE_NOT_FOUND', async () => {
  const response = await request('/api/tidak-ada');
  const body = (await response.json()) as { code: string };

  assert.equal(response.status, 404);
  assert.equal(body.code, 'ROUTE_NOT_FOUND');
});

test('error server mengembalikan 500 tanpa stack trace', async () => {
  const response = await request('/api/dev/force-error', { method: 'POST' });
  const body = (await response.json()) as {
    status: string;
    code: string;
    message: string;
    stack?: string;
  };

  assert.equal(response.status, 500);
  assert.equal(body.status, 'error');
  assert.equal(body.code, 'INTERNAL_ERROR');
  assert.equal(body.stack, undefined);
  assert.ok(!body.message.includes('at '));
});
