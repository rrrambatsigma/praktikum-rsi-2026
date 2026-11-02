import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { after, before, test } from 'node:test';
import { app } from '../src/app.ts';
import { closePool, getPool } from '../src/db/pool.ts';

let server: Server;
let baseUrl = '';
let ownerCookie = '';
let adminCookie = '';
let customerCookie = '';
let ownerId = 0;
let ownerStallId = 0;
let foreignStallId = 0;
let foreignMenuId = 0;
let foreignAvailableMenuId = 0;
let foreignAvailableMenuPrice = 0;
let unavailableMenuId = 0;
let availableMenuId = 0;
let availableMenuPrice = 0;
let registeredEmail = '';
const createdMenuIds: number[] = [];
const createdOrderIds: number[] = [];

const OWNER_EMAIL = 'tini@kantin.test';
const OWNER_PASSWORD = 'rahasia123';
const ADMIN_EMAIL = 'admin@kantin.test';
const ADMIN_PASSWORD = 'admin123';
const CUSTOMER_EMAIL = 'bagas@student.test';
const CUSTOMER_PASSWORD = 'rahasia123';

interface RequestOptions {
  method?: string;
  body?: unknown;
  cookie?: string;
  rawBody?: string;
  headers?: Record<string, string>;
}

async function request(path: string, options: RequestOptions = {}): Promise<Response> {
  const headers: Record<string, string> = { ...options.headers };

  if (options.body !== undefined || options.rawBody !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.cookie) {
    headers.Cookie = options.cookie;
  }

  return fetch(`${baseUrl}${path}`, {
    method:
      options.method ??
      (options.body !== undefined || options.rawBody !== undefined ? 'POST' : 'GET'),
    headers,
    body:
      options.rawBody !== undefined
        ? options.rawBody
        : options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
  });
}

function readCookie(response: Response): string {
  const setCookies =
    typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : [response.headers.get('set-cookie') ?? ''];

  const cookie = setCookies.find((value) => value.startsWith('kantin_session_ho2='));
  return cookie ? cookie.split(';')[0] : '';
}

async function login(email: string, password: string): Promise<{ response: Response; cookie: string; id: number }> {
  const response = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  const body = (await response.json()) as { data?: { id: number } };
  return { response, cookie: readCookie(response), id: body.data?.id ?? 0 };
}

async function json<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
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

  const owner = await login(OWNER_EMAIL, OWNER_PASSWORD);
  assert.equal(
    owner.response.status,
    200,
    'Login owner gagal. Jalankan db/03-auth-seed.sql dan db/05-demo-accounts.sql.',
  );
  ownerCookie = owner.cookie;
  ownerId = owner.id;

  const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  assert.equal(
    admin.response.status,
    200,
    'Login admin gagal. Jalankan db/05-demo-accounts.sql.',
  );
  adminCookie = admin.cookie;

  const customer = await login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
  assert.equal(
    customer.response.status,
    200,
    'Login customer gagal. Jalankan db/05-demo-accounts.sql.',
  );
  customerCookie = customer.cookie;

  assert.ok(ownerCookie && adminCookie && customerCookie);

  const myStallsResponse = await request('/api/stalls/mine', { cookie: ownerCookie });
  const myStalls = await json<{ data: { id: number; ownerId: number }[] }>(myStallsResponse);
  assert.ok(myStalls.data.length > 0, 'Owner tidak memiliki warung.');
  ownerStallId = myStalls.data[0].id;

  const stallsResponse = await request('/api/stalls');
  const stalls = await json<{ data: { id: number; ownerId: number }[] }>(stallsResponse);
  const foreignStall = stalls.data.find((stall) => stall.ownerId !== ownerId);
  assert.ok(foreignStall, 'Tidak ada warung owner lain untuk uji RBAC.');
  foreignStallId = foreignStall.id;

  const menusResponse = await request('/api/menu');
  const menus = await json<{
    data: { id: number; name: string; stallId: number; price: number; isAvailable: boolean }[];
  }>(menusResponse);

  const foreignMenu = menus.data.find((menu) => menu.stallId === foreignStallId);
  assert.ok(foreignMenu, 'Tidak ada menu warung owner lain.');
  foreignMenuId = foreignMenu.id;

  const foreignAvailable = menus.data.find(
    (menu) => menu.stallId === foreignStallId && menu.isAvailable,
  );
  assert.ok(foreignAvailable, 'Tidak ada menu tersedia dari warung owner lain.');
  foreignAvailableMenuId = foreignAvailable.id;
  foreignAvailableMenuPrice = foreignAvailable.price;

  const unavailable = menus.data.find(
    (menu) => menu.stallId === ownerStallId && !menu.isAvailable,
  );
  assert.ok(unavailable, 'Tidak ada menu habis. Jalankan db/02-menu-seed.sql.');
  unavailableMenuId = unavailable.id;

  const available = menus.data.find(
    (menu) => menu.stallId === ownerStallId && menu.isAvailable,
  );
  assert.ok(available, 'Tidak ada menu tersedia.');
  availableMenuId = available.id;
  availableMenuPrice = available.price;
});

after(async () => {
  const pool = await getPool();

  for (const orderId of createdOrderIds) {
    await pool.request().input('id', orderId).query('DELETE FROM dbo.ORDER_ITEMS WHERE order_id = @id');
    await pool.request().input('id', orderId).query('DELETE FROM dbo.ORDERS WHERE id = @id');
  }

  for (const id of createdMenuIds) {
    await pool.request().input('id', id).query('DELETE FROM dbo.MENU_ITEMS WHERE id = @id');
  }

  if (registeredEmail) {
    await pool
      .request()
      .input('email', registeredEmail)
      .query('DELETE FROM dbo.USERS WHERE email = @email');
  }

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  await closePool();
});

test('GET /health mengembalikan status database', async () => {
  const response = await request('/health');
  const body = await json<{ status: string; database: { ok: number } }>(response);

  assert.equal(response.status, 200);
  assert.equal(body.status, 'success');
  assert.equal(body.database.ok, 1);
});

test('setiap respons error memiliki requestId dan header X-Request-Id', async () => {
  const response = await request('/api/tidak-ada');
  const body = await json<{ code: string; requestId: string }>(response);

  assert.equal(response.status, 404);
  assert.equal(body.code, 'ROUTE_NOT_FOUND');
  assert.equal(typeof body.requestId, 'string');
  assert.equal(response.headers.get('x-request-id'), body.requestId);
});

test('register customer berhasil, tidak auto-login, lalu bisa login', async () => {
  registeredEmail = `ho2-${Date.now()}@student.test`;

  const registerResponse = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: '  Customer Baru  ',
      email: `  ${registeredEmail.toUpperCase()} `,
      password: 'rahasia123',
      confirmPassword: 'rahasia123',
    },
  });
  const registerBody = await json<{
    status: string;
    message: string;
    data: { name: string; email: string; role: string; passwordHash?: string };
  }>(registerResponse);

  assert.equal(registerResponse.status, 201);
  assert.equal(registerBody.status, 'success');
  assert.equal(registerBody.message, 'Akun berhasil dibuat. Silakan masuk.');
  assert.equal(registerBody.data.name, 'Customer Baru');
  assert.equal(registerBody.data.email, registeredEmail);
  assert.equal(registerBody.data.role, 'customer');
  assert.equal(registerBody.data.passwordHash, undefined);
  assert.equal(readCookie(registerResponse), '', 'Register tidak boleh auto-login');

  const loginResult = await login(registeredEmail, 'rahasia123');
  assert.equal(loginResult.response.status, 200);
  assert.ok(loginResult.cookie);
  assert.equal(loginResult.id > 0, true);
});

test('register menolak password lemah, konfirmasi beda, dan email duplikat', async () => {
  const weak = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Lemah',
      email: `weak-${Date.now()}@student.test`,
      password: 'rahasia',
      confirmPassword: 'rahasia',
    },
  });
  const weakBody = await json<{ code: string; errors: { field: string }[] }>(weak);
  assert.equal(weak.status, 400);
  assert.equal(weakBody.code, 'VALIDATION_ERROR');
  assert.ok(weakBody.errors.some((detail) => detail.field === 'password'));

  const mismatch = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Beda',
      email: `mismatch-${Date.now()}@student.test`,
      password: 'rahasia123',
      confirmPassword: 'rahasia124',
    },
  });
  const mismatchBody = await json<{ errors: { field: string }[] }>(mismatch);
  assert.equal(mismatch.status, 400);
  assert.ok(mismatchBody.errors.some((detail) => detail.field === 'confirmPassword'));

  const duplicate = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Duplikat',
      email: registeredEmail,
      password: 'rahasia123',
      confirmPassword: 'rahasia123',
    },
  });
  const duplicateBody = await json<{ code: string; errors: { field: string }[] }>(duplicate);
  assert.equal(duplicate.status, 409);
  assert.equal(duplicateBody.code, 'EMAIL_TAKEN');
  assert.ok(duplicateBody.errors.some((detail) => detail.field === 'email'));
});

test('login menerima ketiga role dan menolak kredensial salah', async () => {
  for (const [email, password, role] of [
    [OWNER_EMAIL, OWNER_PASSWORD, 'owner'],
    [ADMIN_EMAIL, ADMIN_PASSWORD, 'admin'],
    [CUSTOMER_EMAIL, CUSTOMER_PASSWORD, 'customer'],
  ]) {
    const response = await request('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    const body = await json<{ data: { role: string } }>(response);
    assert.equal(response.status, 200, `login ${role}`);
    assert.equal(body.data.role, role);
  }

  const wrong = await request('/api/auth/login', {
    method: 'POST',
    body: { email: OWNER_EMAIL, password: 'password-salah' },
  });
  const wrongBody = await json<{ code: string; message: string }>(wrong);
  assert.equal(wrong.status, 401);
  assert.equal(wrongBody.code, 'UNAUTHORIZED');
  assert.equal(wrongBody.message, 'Email atau password tidak sesuai.');
});

test('RBAC backend menolak role yang tidak berwenang', async () => {
  const cases: Array<[string, string, string, number, string]> = [
    ['POST', '/api/menu', customerCookie, 403, 'FORBIDDEN'],
    ['POST', '/api/menu', adminCookie, 403, 'FORBIDDEN'],
    ['POST', '/api/orders', ownerCookie, 403, 'FORBIDDEN'],
    ['POST', '/api/orders', adminCookie, 403, 'FORBIDDEN'],
    ['GET', '/api/orders', customerCookie, 403, 'FORBIDDEN'],
    ['GET', '/api/orders', ownerCookie, 403, 'FORBIDDEN'],
    ['GET', '/api/orders/mine', customerCookie, 403, 'FORBIDDEN'],
    ['GET', '/api/orders/mine', adminCookie, 403, 'FORBIDDEN'],
    ['GET', '/api/orders/1', customerCookie, 403, 'FORBIDDEN'],
    ['GET', '/api/orders/1', ownerCookie, 403, 'FORBIDDEN'],
    ['PATCH', '/api/orders/1/status', customerCookie, 403, 'FORBIDDEN'],
    ['PATCH', '/api/orders/1/status', ownerCookie, 403, 'FORBIDDEN'],
    ['GET', '/api/stalls/mine', adminCookie, 403, 'FORBIDDEN'],
  ];

  for (const [method, path, cookie, status, code] of cases) {
    const response = await request(path, {
      method,
      cookie,
      body: method === 'POST' ? {} : undefined,
    });
    const body = await json<{ code: string }>(response);
    assert.equal(response.status, status, `${method} ${path}`);
    assert.equal(body.code, code, `${method} ${path}`);
  }

  const noSession = await request('/api/orders', { method: 'POST', body: {} });
  const noSessionBody = await json<{ code: string }>(noSession);
  assert.equal(noSession.status, 401);
  assert.equal(noSessionBody.code, 'UNAUTHORIZED');
});

test('admin dapat membaca semua order, customer tidak', async () => {
  const adminResponse = await request('/api/orders', { cookie: adminCookie });
  const adminBody = await json<{ status: string; data: unknown[] }>(adminResponse);
  assert.equal(adminResponse.status, 200);
  assert.equal(adminBody.status, 'success');
  assert.ok(Array.isArray(adminBody.data));

  const customerResponse = await request('/api/orders', { cookie: customerCookie });
  assert.equal(customerResponse.status, 403);
});

test('owner dapat create, update, dan delete menu miliknya', async () => {
  const name = `TEST-HO2-${Date.now()}`;
  const createResponse = await request('/api/menu', {
    method: 'POST',
    cookie: ownerCookie,
    body: {
      stallId: ownerStallId,
      name,
      category: 'camilan',
      price: 7000,
      description: 'Menu integration test HO2.',
      isAvailable: true,
    },
  });
  const createBody = await json<{ data: { id: number; name: string } }>(createResponse);
  assert.equal(createResponse.status, 201);
  assert.equal(createBody.data.name, name);
  createdMenuIds.push(createBody.data.id);

  const updateResponse = await request(`/api/menu/${createBody.data.id}`, {
    method: 'PUT',
    cookie: ownerCookie,
    body: {
      stallId: ownerStallId,
      name: `${name}-UPDATED`,
      category: 'makanan',
      price: 9000,
      description: 'Sudah diperbarui.',
      isAvailable: false,
    },
  });
  const updateBody = await json<{ data: { name: string; price: number; isAvailable: boolean } }>(
    updateResponse,
  );
  assert.equal(updateResponse.status, 200);
  assert.equal(updateBody.data.name, `${name}-UPDATED`);
  assert.equal(updateBody.data.price, 9000);
  assert.equal(updateBody.data.isAvailable, false);

  const deleteResponse = await request(`/api/menu/${createBody.data.id}`, {
    method: 'DELETE',
    cookie: ownerCookie,
  });
  assert.equal(deleteResponse.status, 204);

  const missingResponse = await request(`/api/menu/${createBody.data.id}`);
  assert.equal(missingResponse.status, 404);
});

test('owner tidak dapat mengubah/menghapus menu owner lain', async () => {
  const updateResponse = await request(`/api/menu/${foreignMenuId}`, {
    method: 'PUT',
    cookie: ownerCookie,
    body: {
      stallId: foreignStallId,
      name: 'Tidak Boleh',
      category: 'makanan',
      price: 10000,
      description: '',
      isAvailable: true,
    },
  });
  const updateBody = await json<{ code: string }>(updateResponse);
  assert.equal(updateResponse.status, 403);
  assert.equal(updateBody.code, 'MENU_FORBIDDEN');

  const deleteResponse = await request(`/api/menu/${foreignMenuId}`, {
    method: 'DELETE',
    cookie: ownerCookie,
  });
  const deleteBody = await json<{ code: string }>(deleteResponse);
  assert.equal(deleteResponse.status, 403);
  assert.equal(deleteBody.code, 'MENU_FORBIDDEN');
});

test('owner tidak dapat menambah menu ke warung owner lain', async () => {
  const response = await request('/api/menu', {
    method: 'POST',
    cookie: ownerCookie,
    body: {
      stallId: foreignStallId,
      name: `TEST-FOREIGN-${Date.now()}`,
      category: 'makanan',
      price: 10000,
      description: '',
      isAvailable: true,
    },
  });
  const body = await json<{ code: string; errors: { field: string }[] }>(response);
  assert.equal(response.status, 403);
  assert.equal(body.code, 'STALL_FORBIDDEN');
  assert.ok(body.errors.some((detail) => detail.field === 'stallId'));
});

test('nama menu duplikat di warung yang sama ditolak 409', async () => {
  const name = `TEST-DUP-${Date.now()}`;
  const first = await request('/api/menu', {
    method: 'POST',
    cookie: ownerCookie,
    body: {
      stallId: ownerStallId,
      name,
      category: 'camilan',
      price: 5000,
      description: '',
      isAvailable: true,
    },
  });
  const firstBody = await json<{ data: { id: number } }>(first);
  assert.equal(first.status, 201);
  createdMenuIds.push(firstBody.data.id);

  const second = await request('/api/menu', {
    method: 'POST',
    cookie: ownerCookie,
    body: {
      stallId: ownerStallId,
      name,
      category: 'camilan',
      price: 6000,
      description: '',
      isAvailable: true,
    },
  });
  const secondBody = await json<{ code: string; errors: { field: string }[] }>(second);
  assert.equal(second.status, 409);
  assert.equal(secondBody.code, 'MENU_NAME_TAKEN');
  assert.ok(secondBody.errors.some((detail) => detail.field === 'name'));
});

test('checkout customer menghitung total dari database dan menyimpan item', async () => {
  const response = await request('/api/orders', {
    method: 'POST',
    cookie: customerCookie,
    body: {
      customerName: 'Bagas Pratama',
      phone: '0812-3456-7890',
      paymentMethod: 'qris',
      note: 'Tanpa sambal.',
      items: [{ menuId: availableMenuId, quantity: 2 }],
    },
  });
  const body = await json<{
    status: string;
    data: {
      id: number;
      orderCode: string;
      total: number;
      status: string;
      phone: string;
      items: { menuId: number; unitPrice: number; quantity: number; subtotal: number }[];
    };
  }>(response);

  assert.equal(response.status, 201);
  assert.equal(body.status, 'success');
  assert.equal(body.data.status, 'confirmed');
  assert.equal(body.data.phone, '081234567890');
  assert.equal(body.data.total, availableMenuPrice * 2);
  assert.equal(body.data.items.length, 1);
  assert.equal(body.data.items[0]?.unitPrice, availableMenuPrice);
  assert.equal(body.data.items[0]?.subtotal, availableMenuPrice * 2);
  assert.match(body.data.orderCode, /^ORD-/);

  createdOrderIds.push(body.data.id);

  const adminResponse = await request('/api/orders', { cookie: adminCookie });
  const adminBody = await json<{ data: { id: number; total: number }[] }>(adminResponse);
  assert.ok(adminBody.data.some((order) => order.id === body.data.id));
});

test('satu order lintas warung menyimpan tiket per warung dan hanya owner terkait yang melihatnya', async () => {
  const response = await request('/api/orders', {
    method: 'POST',
    cookie: customerCookie,
    body: {
      customerName: 'Bagas Pratama',
      phone: '081234567890',
      paymentMethod: 'cash',
      note: 'Pisahkan tiket per warung.',
      items: [
        { menuId: availableMenuId, quantity: 1 },
        { menuId: foreignAvailableMenuId, quantity: 2 },
      ],
    },
  });
  const body = await json<{
    data: {
      id: number;
      total: number;
      items: {
        menuId: number;
        stallId: number;
        stallName: string;
        unitPrice: number;
        quantity: number;
        subtotal: number;
      }[];
    };
  }>(response);

  assert.equal(response.status, 201);
  assert.equal(body.data.items.length, 2);
  assert.equal(
    body.data.total,
    availableMenuPrice + foreignAvailableMenuPrice * 2,
  );

  const stallIds = new Set(body.data.items.map((item) => item.stallId));
  assert.equal(stallIds.size, 2, 'Order harus memuat item dari dua warung.');
  assert.ok(body.data.items.every((item) => item.stallName.length > 0));

  createdOrderIds.push(body.data.id);

  const ownerResponse = await request('/api/orders/mine', { cookie: ownerCookie });
  const ownerBody = await json<{
    data: {
      id: number;
      ownerTotal: number;
      items: { menuId: number; stallId: number; subtotal: number }[];
    }[];
  }>(ownerResponse);
  assert.equal(ownerResponse.status, 200);

  const ownerOrder = ownerBody.data.find((order) => order.id === body.data.id);
  assert.ok(ownerOrder, 'Order lintas warung harus muncul di tiket owner terkait.');
  assert.ok(ownerOrder.items.every((item) => item.stallId === ownerStallId));
  assert.ok(ownerOrder.items.some((item) => item.menuId === availableMenuId));
  assert.ok(!ownerOrder.items.some((item) => item.menuId === foreignAvailableMenuId));
  assert.equal(ownerOrder.ownerTotal, availableMenuPrice);

  const adminDetail = await request(`/api/orders/${body.data.id}`, {
    cookie: adminCookie,
  });
  const adminDetailBody = await json<{
    data: { id: number; items: { stallId: number }[]; total: number };
  }>(adminDetail);
  assert.equal(adminDetail.status, 200);
  assert.equal(adminDetailBody.data.items.length, 2);
  assert.equal(adminDetailBody.data.total, body.data.total);

  const customerDetail = await request(`/api/orders/${body.data.id}`, {
    cookie: customerCookie,
  });
  assert.equal(customerDetail.status, 403);

  const completeResponse = await request(`/api/orders/${body.data.id}/status`, {
    method: 'PATCH',
    cookie: adminCookie,
    body: { status: 'completed' },
  });
  const completeBody = await json<{ message: string; data: { status: string } }>(
    completeResponse,
  );
  assert.equal(completeResponse.status, 200);
  assert.equal(completeBody.data.status, 'completed');
  assert.equal(completeBody.message, 'Status pesanan berhasil diperbarui.');

  const finalResponse = await request(`/api/orders/${body.data.id}/status`, {
    method: 'PATCH',
    cookie: adminCookie,
    body: { status: 'cancelled' },
  });
  const finalBody = await json<{ code: string }>(finalResponse);
  assert.equal(finalResponse.status, 409);
  assert.equal(finalBody.code, 'ORDER_STATUS_FINAL');
});

test('admin menolak status selain completed/cancelled', async () => {
  const response = await request('/api/orders/1/status', {
    method: 'PATCH',
    cookie: adminCookie,
    body: { status: 'confirmed' },
  });
  const body = await json<{ code: string; errors: { field: string }[] }>(response);
  assert.equal(response.status, 400);
  assert.equal(body.code, 'VALIDATION_ERROR');
  assert.ok(body.errors.some((detail) => detail.field === 'status'));
});

test('checkout menolak menu habis, menu tidak ada, dan payload tidak valid', async () => {
  const unavailable = await request('/api/orders', {
    method: 'POST',
    cookie: customerCookie,
    body: {
      customerName: 'Bagas Pratama',
      phone: '081234567890',
      paymentMethod: 'cash',
      items: [{ menuId: unavailableMenuId, quantity: 1 }],
    },
  });
  const unavailableBody = await json<{ code: string; errors: { field: string }[] }>(unavailable);
  assert.equal(unavailable.status, 409);
  assert.equal(unavailableBody.code, 'MENU_UNAVAILABLE');
  assert.ok(unavailableBody.errors.some((detail) => detail.field === 'items'));

  const missing = await request('/api/orders', {
    method: 'POST',
    cookie: customerCookie,
    body: {
      customerName: 'Bagas Pratama',
      phone: '081234567890',
      paymentMethod: 'cash',
      items: [{ menuId: 999_999, quantity: 1 }],
    },
  });
  const missingBody = await json<{ code: string }>(missing);
  assert.equal(missing.status, 404);
  assert.equal(missingBody.code, 'MENU_NOT_FOUND');

  const empty = await request('/api/orders', {
    method: 'POST',
    cookie: customerCookie,
    body: {
      customerName: 'Bagas Pratama',
      phone: '081234567890',
      paymentMethod: 'cash',
      items: [],
    },
  });
  assert.equal(empty.status, 400);

  const duplicate = await request('/api/orders', {
    method: 'POST',
    cookie: customerCookie,
    body: {
      customerName: 'Bagas Pratama',
      phone: '081234567890',
      paymentMethod: 'cash',
      items: [
        { menuId: availableMenuId, quantity: 1 },
        { menuId: availableMenuId, quantity: 2 },
      ],
    },
  });
  assert.equal(duplicate.status, 400);

  const badPhone = await request('/api/orders', {
    method: 'POST',
    cookie: customerCookie,
    body: {
      customerName: 'Bagas Pratama',
      phone: '12ab',
      paymentMethod: 'cash',
      items: [{ menuId: availableMenuId, quantity: 1 }],
    },
  });
  assert.equal(badPhone.status, 400);
});

test('error contract: invalid JSON dan 500 tidak membocorkan stack', async () => {
  const invalidJson = await request('/api/menu', {
    method: 'POST',
    cookie: ownerCookie,
    rawBody: '{',
  });
  const invalidBody = await json<{ code: string; requestId: string }>(invalidJson);
  assert.equal(invalidJson.status, 400);
  assert.equal(invalidBody.code, 'INVALID_JSON');
  assert.equal(typeof invalidBody.requestId, 'string');

  const serverError = await request('/api/dev/force-error', { method: 'POST' });
  const serverBody = await json<{
    code: string;
    message: string;
    requestId: string;
    stack?: string;
  }>(serverError);
  assert.equal(serverError.status, 500);
  assert.equal(serverBody.code, 'INTERNAL_ERROR');
  assert.equal(serverBody.stack, undefined);
  assert.equal(typeof serverBody.requestId, 'string');
  assert.ok(!serverBody.message.includes('at '));
});
