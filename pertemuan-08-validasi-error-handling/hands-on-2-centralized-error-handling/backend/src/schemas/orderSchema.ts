import { z } from 'zod';
import { ValidationError } from '../errors/ValidationError.ts';

export const MAX_ORDER_ITEMS = 20;
export const MAX_ITEM_QUANTITY = 20;

const phoneSchema = z
  .string({
    required_error: 'Nomor telepon wajib diisi.',
    invalid_type_error: 'Nomor telepon harus berupa teks.',
  })
  .trim()
  .min(1, 'Nomor telepon wajib diisi.')
  .max(20, 'Nomor telepon maksimal 20 karakter.')
  .regex(/^[0-9+\-\s]+$/, 'Nomor telepon hanya boleh berisi angka, spasi, +, atau -.')
  .transform((value) => value.replace(/\D/g, ''))
  .refine((value) => value.length >= 9, 'Nomor telepon minimal 9 digit.')
  .refine((value) => value.length <= 15, 'Nomor telepon maksimal 15 digit.');

export const orderItemSchema = z
  .object({
    menuId: z
      .number({
        required_error: 'Menu wajib dipilih.',
        invalid_type_error: 'Menu tidak valid.',
      })
      .int('Menu tidak valid.')
      .positive('Menu tidak valid.'),
    quantity: z
      .number({
        required_error: 'Jumlah wajib diisi.',
        invalid_type_error: 'Jumlah harus berupa angka.',
      })
      .int('Jumlah harus berupa bilangan bulat.')
      .min(1, 'Jumlah minimal 1.')
      .max(MAX_ITEM_QUANTITY, `Jumlah maksimal ${MAX_ITEM_QUANTITY}.`),
  })
  .strict('Item hanya boleh berisi menuId dan quantity.');

export const createOrderSchema = z
  .object({
    customerName: z
      .string({
        required_error: 'Nama penerima wajib diisi.',
        invalid_type_error: 'Nama penerima harus berupa teks.',
      })
      .trim()
      .min(1, 'Nama penerima wajib diisi.')
      .min(2, 'Nama penerima minimal 2 karakter.')
      .max(80, 'Nama penerima maksimal 80 karakter.'),
    phone: phoneSchema,
    paymentMethod: z.enum(['cash', 'qris', 'transfer'], {
      required_error: 'Metode pembayaran wajib dipilih.',
      invalid_type_error: 'Metode pembayaran tidak valid.',
    }),
    note: z
      .string({
        invalid_type_error: 'Catatan harus berupa teks.',
      })
      .trim()
      .max(200, 'Catatan maksimal 200 karakter.')
      .optional()
      .default(''),
    items: z
      .array(orderItemSchema, {
        required_error: 'Pesanan minimal berisi satu menu.',
        invalid_type_error: 'Daftar pesanan tidak valid.',
      })
      .min(1, 'Pesanan minimal berisi satu menu.')
      .max(MAX_ORDER_ITEMS, `Maksimal ${MAX_ORDER_ITEMS} jenis menu per pesanan.`)
      .superRefine((items, context) => {
        const seen = new Set<number>();

        items.forEach((item, index) => {
          if (seen.has(item.menuId)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: [index, 'menuId'],
              message: 'Menu yang sama tidak boleh dikirim dua kali.',
            });
          }

          seen.add(item.menuId);
        });
      }),
  })
  .strict('Body hanya boleh berisi customerName, phone, paymentMethod, note, dan items.');

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z
  .object({
    status: z.enum(['completed', 'cancelled'], {
      required_error: 'Status pesanan wajib dipilih.',
      invalid_type_error: 'Status pesanan tidak valid.',
    }),
  })
  .strict('Body hanya boleh berisi status.');

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export function parseOrderId(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const id = Number(raw);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError(
      [{ field: 'id', message: 'ID pesanan tidak valid.' }],
      'ID pesanan tidak valid.',
    );
  }

  return id;
}

export function parseCreateOrderInput(value: unknown): CreateOrderInput {
  const result = createOrderSchema.safeParse(value);

  if (!result.success) {
    const details = result.error.issues.map((issue) => {
      if (issue.code === 'unrecognized_keys') {
        return {
          field: 'body',
          message: `Field tidak dikenal: ${issue.keys.join(', ')}.`,
        };
      }

      const first = issue.path[0];

      return {
        field:
          first === 'items'
            ? 'items'
            : issue.path.length > 0
              ? String(first)
              : 'body',
        message: issue.message,
      };
    });

    throw new ValidationError(details, 'Data pesanan tidak valid.');
  }

  return result.data;
}
