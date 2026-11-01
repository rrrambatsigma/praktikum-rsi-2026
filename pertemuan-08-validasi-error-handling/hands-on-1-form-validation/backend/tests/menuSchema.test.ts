import assert from 'node:assert/strict';
import test from 'node:test';
import { ValidationError } from '../src/errors/ValidationError.ts';
import { parseCreateMenuInput } from '../src/schemas/menuSchema.ts';

const validPayload = {
  stallId: 1,
  name: '  Pisang Goreng  ',
  category: 'camilan',
  price: 5000,
  description: '  Camilan hangat.  ',
  isAvailable: true,
};

function expectValidationError(payload: unknown): ValidationError {
  try {
    parseCreateMenuInput(payload);
  } catch (error) {
    assert.ok(error instanceof ValidationError);
    return error;
  }

  assert.fail('Payload seharusnya ditolak.');
}

test('payload valid lolos dan dinormalisasi', () => {
  const result = parseCreateMenuInput(validPayload);

  assert.equal(result.stallId, 1);
  assert.equal(result.name, 'Pisang Goreng');
  assert.equal(result.category, 'camilan');
  assert.equal(result.price, 5000);
  assert.equal(result.description, 'Camilan hangat.');
  assert.equal(result.isAvailable, true);
});

test('body bukan objek ditolak', () => {
  const error = expectValidationError('bukan objek');
  assert.equal(error.details?.[0]?.field, 'body');
});

test('stallId wajib diisi', () => {
  const error = expectValidationError({ ...validPayload, stallId: undefined });
  assert.ok(error.details?.some((detail) => detail.field === 'stallId'));
});

test('stallId harus bilangan bulat positif', () => {
  for (const stallId of [0, -1, 1.5, '1']) {
    const error = expectValidationError({ ...validPayload, stallId });
    assert.ok(
      error.details?.some((detail) => detail.field === 'stallId'),
      `stallId ${String(stallId)} seharusnya ditolak`,
    );
  }
});

test('nama menu wajib diisi', () => {
  const error = expectValidationError({ ...validPayload, name: '   ' });
  assert.ok(error.details?.some((detail) => detail.field === 'name'));
});

test('nama menu minimal 2 karakter', () => {
  const error = expectValidationError({ ...validPayload, name: 'A' });
  assert.ok(error.details?.some((detail) => detail.field === 'name'));
});

test('nama menu maksimal 100 karakter', () => {
  const error = expectValidationError({
    ...validPayload,
    name: 'A'.repeat(101),
  });
  assert.ok(error.details?.some((detail) => detail.field === 'name'));
});

test('kategori wajib dan harus dikenal', () => {
  for (const category of ['', 'lainnya', undefined]) {
    const error = expectValidationError({ ...validPayload, category });
    assert.ok(
      error.details?.some((detail) => detail.field === 'category'),
      `kategori ${String(category)} seharusnya ditolak`,
    );
  }
});

test('harga wajib diisi', () => {
  const error = expectValidationError({ ...validPayload, price: undefined });
  assert.ok(error.details?.some((detail) => detail.field === 'price'));
});

test('harga harus berupa angka', () => {
  const error = expectValidationError({ ...validPayload, price: '5000' });
  assert.ok(error.details?.some((detail) => detail.field === 'price'));
});

test('harga harus lebih dari 0', () => {
  for (const price of [0, -1000]) {
    const error = expectValidationError({ ...validPayload, price });
    assert.ok(
      error.details?.some((detail) => detail.field === 'price'),
      `harga ${price} seharusnya ditolak`,
    );
  }
});

test('harga harus bilangan bulat', () => {
  const error = expectValidationError({ ...validPayload, price: 1500.5 });
  assert.ok(error.details?.some((detail) => detail.field === 'price'));
});

test('harga maksimal 1.000.000', () => {
  const error = expectValidationError({ ...validPayload, price: 1_000_001 });
  assert.ok(error.details?.some((detail) => detail.field === 'price'));
});

test('deskripsi maksimal 255 karakter', () => {
  const error = expectValidationError({
    ...validPayload,
    description: 'A'.repeat(256),
  });
  assert.ok(error.details?.some((detail) => detail.field === 'description'));
});

test('field asing ditolak', () => {
  const error = expectValidationError({
    ...validPayload,
    total: 5000,
  });
  assert.ok(error.details?.some((detail) => detail.field === 'body'));
});

test('isAvailable harus boolean', () => {
  const error = expectValidationError({
    ...validPayload,
    isAvailable: 'true',
  });
  assert.ok(error.details?.some((detail) => detail.field === 'isAvailable'));
});

test('isAvailable default true jika tidak dikirim', () => {
  const { isAvailable: _ignored, ...payload } = validPayload;
  const result = parseCreateMenuInput(payload);
  assert.equal(result.isAvailable, true);
});
