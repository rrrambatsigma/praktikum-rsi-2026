import assert from 'node:assert/strict';
import test from 'node:test';
import { loginSchema, parseLoginInput } from '../src/schemas/authSchema.ts';

test('login valid menormalkan email menjadi huruf kecil dan trim', () => {
  const input = parseLoginInput({
    email: '  Tini@Kantin.Test ',
    password: 'rahasia123',
  });

  assert.equal(input.email, 'tini@kantin.test');
  assert.equal(input.password, 'rahasia123');
});

test('email kosong ditolak', () => {
  const result = loginSchema.safeParse({ email: '   ', password: 'rahasia123' });
  assert.equal(result.success, false);
});

test('format email tidak valid ditolak', () => {
  const result = loginSchema.safeParse({ email: 'bukan-email', password: 'rahasia123' });
  assert.equal(result.success, false);
});

test('password kurang dari 8 karakter ditolak', () => {
  const result = loginSchema.safeParse({
    email: 'tini@kantin.test',
    password: 'rahasia',
  });

  assert.equal(result.success, false);

  if (!result.success) {
    assert.ok(
      result.error.issues.some((issue) => issue.path[0] === 'password'),
    );
  }
});

test('password kosong ditolak', () => {
  const result = loginSchema.safeParse({ email: 'tini@kantin.test', password: '' });
  assert.equal(result.success, false);
});

test('field asing pada body login ditolak', () => {
  const result = loginSchema.safeParse({
    email: 'tini@kantin.test',
    password: 'rahasia123',
    role: 'admin',
  });

  assert.equal(result.success, false);
});

test('parseLoginInput melempar VALIDATION_ERROR dengan pesan login', () => {
  assert.throws(
    () => parseLoginInput({ email: 'salah', password: 'x' }),
    (error: unknown) => {
      const detail = error as { code?: string; message?: string };
      return detail.code === 'VALIDATION_ERROR' && detail.message === 'Data login tidak valid.';
    },
  );
});
