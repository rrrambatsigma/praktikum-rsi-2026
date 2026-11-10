import assert from 'node:assert/strict';
import test from 'node:test';
import { ValidationError } from '../src/errors/ValidationError.ts';
import { parseAuditLogQuery } from '../src/schemas/auditLogSchema.ts';

function expectValidationError(raw: unknown): ValidationError {
  try {
    parseAuditLogQuery(raw);
  } catch (error) {
    assert.ok(error instanceof ValidationError);
    return error;
  }

  assert.fail('Query seharusnya ditolak.');
}

test('default page dan pageSize dipakai saat query kosong', () => {
  const query = parseAuditLogQuery({});

  assert.equal(query.page, 1);
  assert.equal(query.pageSize, 20);
});

test('page dan pageSize berupa string dikonversi ke angka', () => {
  const query = parseAuditLogQuery({ page: '3', pageSize: '50' });

  assert.equal(query.page, 3);
  assert.equal(query.pageSize, 50);
});

test('page di bawah 1 dan pageSize di luar rentang ditolak', () => {
  for (const raw of [{ page: '0' }, { page: '-1' }, { pageSize: '0' }, { pageSize: '101' }]) {
    const error = expectValidationError(raw);
    assert.ok(
      error.details?.some((detail) => detail.field === 'page' || detail.field === 'pageSize'),
      `query ${JSON.stringify(raw)} seharusnya ditolak`,
    );
  }
});

test('format tanggal selain YYYY-MM-DD ditolak', () => {
  for (const value of ['10-11-2026', '2026/11/10', 'kemarin']) {
    const error = expectValidationError({ from: value });
    assert.ok(error.details?.some((detail) => detail.field === 'from'));
  }
});

test('tanggal yang tidak ada di kalender ditolak', () => {
  for (const value of ['2026-02-31', '2026-13-01', '2026-04-31']) {
    const error = expectValidationError({ to: value });
    assert.ok(
      error.details?.some((detail) => detail.field === 'to'),
      `tanggal ${value} seharusnya ditolak`,
    );
  }
});

test('tanggal awal setelah tanggal akhir ditolak', () => {
  const error = expectValidationError({ from: '2026-11-10', to: '2026-11-01' });

  assert.ok(error.details?.some((detail) => detail.field === 'from'));
});

test('parameter asing ditolak', () => {
  const error = expectValidationError({ foo: 'bar' });

  assert.ok(error.details?.some((detail) => detail.field === 'query'));
});

test('filter aksi dan target di-trim', () => {
  const query = parseAuditLogQuery({
    action: '  LOGIN  ',
    targetTable: '  USERS  ',
    from: '2026-11-01',
    to: '2026-11-10',
  });

  assert.equal(query.action, 'LOGIN');
  assert.equal(query.targetTable, 'USERS');
  assert.equal(query.from, '2026-11-01');
  assert.equal(query.to, '2026-11-10');
});
