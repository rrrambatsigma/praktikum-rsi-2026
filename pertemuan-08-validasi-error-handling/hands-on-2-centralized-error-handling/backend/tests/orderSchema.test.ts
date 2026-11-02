import assert from 'node:assert/strict';
import test from 'node:test';
import { ValidationError } from '../src/errors/ValidationError.ts';
import {
  parseCreateOrderInput,
  parseOrderId,
  updateOrderStatusSchema,
} from '../src/schemas/orderSchema.ts';

const validPayload = {
  customerName: '  Bagas Pratama  ',
  phone: ' 0812-3456-7890 ',
  paymentMethod: 'qris',
  note: '  Tanpa sambal.  ',
  items: [{ menuId: 1, quantity: 2 }],
};

function expectValidationError(payload: unknown): ValidationError {
  try {
    parseCreateOrderInput(payload);
  } catch (error) {
    assert.ok(error instanceof ValidationError);
    return error;
  }

  assert.fail('Payload seharusnya ditolak.');
}

test('payload pesanan valid dinormalisasi', () => {
  const result = parseCreateOrderInput(validPayload);

  assert.equal(result.customerName, 'Bagas Pratama');
  assert.equal(result.phone, '081234567890');
  assert.equal(result.paymentMethod, 'qris');
  assert.equal(result.note, 'Tanpa sambal.');
  assert.equal(result.items[0]?.quantity, 2);
});

test('nama penerima wajib dan minimal 2 karakter', () => {
  for (const customerName of ['', '   ', 'A', undefined]) {
    const error = expectValidationError({ ...validPayload, customerName });
    assert.ok(error.details?.some((detail) => detail.field === 'customerName'));
  }
});

test('nomor telepon wajib, minimal 9 digit, dan hanya karakter aman', () => {
  for (const phone of ['', '12345', '0812-ABCD', undefined]) {
    const error = expectValidationError({ ...validPayload, phone });
    assert.ok(error.details?.some((detail) => detail.field === 'phone'));
  }
});

test('nomor telepon +62 dinormalisasi menjadi digit', () => {
  const result = parseCreateOrderInput({ ...validPayload, phone: '+62 812 3456 7890' });
  assert.equal(result.phone, '6281234567890');
});

test('metode pembayaran harus dikenal', () => {
  for (const paymentMethod of ['', 'bitcoin', undefined]) {
    const error = expectValidationError({ ...validPayload, paymentMethod });
    assert.ok(error.details?.some((detail) => detail.field === 'paymentMethod'));
  }
});

test('catatan maksimal 200 karakter', () => {
  const error = expectValidationError({ ...validPayload, note: 'A'.repeat(201) });
  assert.ok(error.details?.some((detail) => detail.field === 'note'));
});

test('pesanan minimal berisi satu item', () => {
  const error = expectValidationError({ ...validPayload, items: [] });
  assert.ok(error.details?.some((detail) => detail.field === 'items'));
});

test('quantity harus 1 sampai 20', () => {
  for (const quantity of [0, 21, 1.5, '2']) {
    const error = expectValidationError({
      ...validPayload,
      items: [{ menuId: 1, quantity }],
    });
    assert.ok(error.details?.some((detail) => detail.field === 'items'));
  }
});

test('menu yang sama tidak boleh dikirim dua kali', () => {
  const error = expectValidationError({
    ...validPayload,
    items: [
      { menuId: 1, quantity: 1 },
      { menuId: 1, quantity: 2 },
    ],
  });

  assert.ok(error.details?.some((detail) => detail.field === 'items'));
});

test('field asing ditolak, termasuk harga/total dari client', () => {
  for (const extra of [{ total: 1 }, { price: 1000 }, { customerId: 12 }]) {
    const error = expectValidationError({ ...validPayload, ...extra });
    assert.ok(error.details?.some((detail) => detail.field === 'body'));
  }
});

test('parseCreateOrderInput memakai pesan data pesanan', () => {
  assert.throws(
    () => parseCreateOrderInput({}),
    (error: unknown) => {
      const detail = error as { code?: string; message?: string };
      return detail.code === 'VALIDATION_ERROR' && detail.message === 'Data pesanan tidak valid.';
    },
  );
});

test('admin hanya boleh mengubah status menjadi completed atau cancelled', () => {
  for (const status of ['completed', 'cancelled']) {
    const result = updateOrderStatusSchema.safeParse({ status });
    assert.equal(result.success, true);
  }

  for (const status of ['confirmed', 'pending', '', undefined]) {
    const result = updateOrderStatusSchema.safeParse({ status });
    assert.equal(result.success, false);
  }

  const extraField = updateOrderStatusSchema.safeParse({
    status: 'completed',
    total: 1,
  });
  assert.equal(extraField.success, false);
});

test('parseOrderId menerima id positif dan menolak id tidak valid', () => {
  assert.equal(parseOrderId('12'), 12);
  assert.equal(parseOrderId(['7', '8']), 7);

  for (const value of ['0', '-1', 'abc', '1.5', undefined]) {
    assert.throws(
      () => parseOrderId(value),
      (error: unknown) => {
        const detail = error as { code?: string; details?: { field: string }[] };
        return (
          detail.code === 'VALIDATION_ERROR' &&
          detail.details?.some((item) => item.field === 'id') === true
        );
      },
    );
  }
});
