import assert from 'node:assert/strict'
import test from 'node:test'
import {
  EMPTY_CHECKOUT_FORM,
  EMPTY_LOGIN_FORM,
  EMPTY_MENU_FORM,
  EMPTY_REGISTER_FORM,
  firstCheckoutErrorField,
  firstErrorField,
  firstLoginErrorField,
  firstRegisterErrorField,
  normalizePhone,
  passwordChecks,
  toMenuPayload,
  validateCheckoutForm,
  validateLoginForm,
  validateMenuForm,
  validateRegisterForm,
  type MenuFormValues,
} from '../src/lib/validation.ts'

const validValues: MenuFormValues = {
  stallId: '1',
  name: 'Pisang Goreng',
  category: 'camilan',
  price: '5000',
  description: 'Pisang goreng hangat.',
  isAvailable: true,
}

function withValues(overrides: Partial<MenuFormValues>): MenuFormValues {
  return { ...validValues, ...overrides }
}

function expectError(values: MenuFormValues, field: keyof MenuFormValues): string {
  const errors = validateMenuForm(values)
  const message = errors[field as keyof typeof errors]

  assert.equal(typeof message, 'string', `field ${field} seharusnya memiliki error`)
  return message as string
}

test('form kosong menandai warung, nama, kategori, dan harga', () => {
  const errors = validateMenuForm(EMPTY_MENU_FORM)

  assert.ok(errors.stallId)
  assert.ok(errors.name)
  assert.ok(errors.category)
  assert.ok(errors.price)
  assert.equal(errors.description, undefined)
})

test('form valid tidak menghasilkan error', () => {
  assert.deepEqual(validateMenuForm(validValues), {})
})

test('nama hanya spasi ditolak', () => {
  assert.equal(expectError(withValues({ name: '   ' }), 'name'), 'Nama menu wajib diisi.')
})

test('nama satu karakter ditolak', () => {
  assert.match(expectError(withValues({ name: 'A' }), 'name'), /minimal 2 karakter/)
})

test('nama lebih dari 100 karakter ditolak', () => {
  assert.match(
    expectError(withValues({ name: 'A'.repeat(101) }), 'name'),
    /maksimal 100 karakter/,
  )
})

test('kategori placeholder dan kategori asing ditolak', () => {
  assert.match(expectError(withValues({ category: '' }), 'category'), /Pilih kategori/)
  assert.match(
    expectError(withValues({ category: 'dessert' }), 'category'),
    /tidak valid/,
  )
})

test('harga kosong ditolak sebagai kosong, bukan nol', () => {
  assert.equal(expectError(withValues({ price: '' }), 'price'), 'Harga wajib diisi.')
})

test('harga bukan angka ditolak', () => {
  assert.match(expectError(withValues({ price: 'abc' }), 'price'), /angka bulat/)
})

test('harga nol dan negatif ditolak', () => {
  assert.match(expectError(withValues({ price: '0' }), 'price'), /lebih dari 0/)
  assert.match(expectError(withValues({ price: '-1000' }), 'price'), /angka bulat/)
})

test('harga desimal dan notasi ilmiah ditolak', () => {
  assert.match(expectError(withValues({ price: '1.5' }), 'price'), /angka bulat/)
  assert.match(expectError(withValues({ price: '1e3' }), 'price'), /angka bulat/)
})

test('harga Infinity dan NaN ditolak', () => {
  assert.match(expectError(withValues({ price: 'Infinity' }), 'price'), /angka bulat/)
  assert.match(expectError(withValues({ price: 'NaN' }), 'price'), /angka bulat/)
})

test('harga lebih dari 1.000.000 ditolak', () => {
  assert.match(expectError(withValues({ price: '1000001' }), 'price'), /maksimal/)
})

test('harga 15000 valid', () => {
  assert.equal(validateMenuForm(withValues({ price: '15000' })).price, undefined)
})

test('deskripsi lebih dari 255 karakter ditolak', () => {
  assert.match(
    expectError(withValues({ description: 'A'.repeat(256) }), 'description'),
    /maksimal 255 karakter/,
  )
})

test('stallId kosong dan tidak valid ditolak', () => {
  assert.match(expectError(withValues({ stallId: '' }), 'stallId'), /Pilih warung/)
  assert.match(expectError(withValues({ stallId: 'abc' }), 'stallId'), /tidak valid/)
})

test('firstErrorField mengikuti urutan field form', () => {
  const errors = validateMenuForm(EMPTY_MENU_FORM)
  assert.equal(firstErrorField(errors), 'stallId')

  const onlyPrice = validateMenuForm(withValues({ price: '0' }))
  assert.equal(firstErrorField(onlyPrice), 'price')

  assert.equal(firstErrorField({}), null)
})

test('toMenuPayload melakukan trim dan konversi tipe', () => {
  const payload = toMenuPayload(
    withValues({
      name: '  Pisang Goreng  ',
      price: ' 5000 ',
      description: '  Camilan hangat.  ',
      stallId: '3',
    }),
  )

  assert.deepEqual(payload, {
    stallId: 3,
    name: 'Pisang Goreng',
    category: 'camilan',
    price: 5000,
    description: 'Camilan hangat.',
    isAvailable: true,
  })

  assert.equal(typeof payload.stallId, 'number')
  assert.equal(typeof payload.price, 'number')
})

/* ------------------------------------------------------------------ */
/* Validasi login Owner                                                */
/* ------------------------------------------------------------------ */

test('login kosong menandai email dan password', () => {
  const errors = validateLoginForm(EMPTY_LOGIN_FORM)

  assert.equal(errors.email, 'Email wajib diisi.')
  assert.equal(errors.password, 'Password wajib diisi.')
})

test('login dengan email berformat salah ditolak', () => {
  for (const email of ['bukan-email', 'tini@', '@kantin.test', 'tini@kantin']) {
    const errors = validateLoginForm({ email, password: 'rahasia123' })
    assert.equal(errors.email, 'Format email tidak valid.', `email: ${email}`)
  }
})

test('login tidak mengirim request bila validasi dasar gagal', () => {
  const errors = validateLoginForm({ email: 'tini@kantin.test', password: 'rahasia' })

  assert.equal(errors.password, 'Password minimal 8 karakter.')
  assert.equal(firstLoginErrorField(errors), 'password')
})

test('login valid dengan email berisi spasi di tepi', () => {
  const errors = validateLoginForm({
    email: '  tini@kantin.test ',
    password: 'rahasia123',
  })

  assert.deepEqual(errors, {})
})

test('password tepat 8 karakter dan lebih dari 72 karakter', () => {
  assert.deepEqual(
    validateLoginForm({ email: 'tini@kantin.test', password: '12345678' }),
    {},
  )

  const tooLong = validateLoginForm({
    email: 'tini@kantin.test',
    password: 'a'.repeat(73),
  })

  assert.match(tooLong.password ?? '', /maksimal 72 karakter/)
})

test('firstLoginErrorField mengutamakan email', () => {
  const errors = validateLoginForm({ email: '', password: '' })
  assert.equal(firstLoginErrorField(errors), 'email')
  assert.equal(firstLoginErrorField({}), null)
})

/* ------------------------------------------------------------------ */
/* Validasi register customer                                          */
/* ------------------------------------------------------------------ */

test('register kosong menandai semua field', () => {
  const errors = validateRegisterForm(EMPTY_REGISTER_FORM)

  assert.equal(errors.name, 'Nama wajib diisi.')
  assert.equal(errors.email, 'Email wajib diisi.')
  assert.equal(errors.password, 'Password wajib diisi.')
  assert.equal(errors.confirmPassword, 'Konfirmasi password wajib diisi.')
  assert.equal(firstRegisterErrorField(errors), 'name')
})

test('register menolak password tanpa huruf atau angka', () => {
  const noLetter = validateRegisterForm({
    name: 'Customer',
    email: 'baru@student.test',
    password: '12345678',
    confirmPassword: '12345678',
  })
  assert.match(noLetter.password ?? '', /mengandung huruf/)

  const noNumber = validateRegisterForm({
    name: 'Customer',
    email: 'baru@student.test',
    password: 'abcdefgh',
    confirmPassword: 'abcdefgh',
  })
  assert.match(noNumber.password ?? '', /mengandung angka/)
})

test('register menolak konfirmasi password yang berbeda', () => {
  const errors = validateRegisterForm({
    name: 'Customer',
    email: 'baru@student.test',
    password: 'rahasia123',
    confirmPassword: 'rahasia124',
  })

  assert.equal(errors.confirmPassword, 'Konfirmasi password tidak sama.')
})

test('register valid dengan spasi di tepi nama dan email', () => {
  const errors = validateRegisterForm({
    name: '  Customer Baru  ',
    email: '  baru@student.test ',
    password: 'rahasia123',
    confirmPassword: 'rahasia123',
  })

  assert.deepEqual(errors, {})
})

test('passwordChecks menandai syarat yang sudah terpenuhi', () => {
  const checks = passwordChecks('rahasia123')

  assert.equal(checks.every((check) => check.valid), true)
  assert.equal(passwordChecks('123').some((check) => !check.valid), true)
})

/* ------------------------------------------------------------------ */
/* Validasi checkout                                                   */
/* ------------------------------------------------------------------ */

test('checkout kosong menandai nama, telepon, dan metode bayar', () => {
  const errors = validateCheckoutForm({ ...EMPTY_CHECKOUT_FORM, paymentMethod: '' })

  assert.equal(errors.customerName, 'Nama penerima wajib diisi.')
  assert.equal(errors.phone, 'Nomor telepon wajib diisi.')
  assert.equal(errors.paymentMethod, 'Metode pembayaran tidak valid.')
  assert.equal(firstCheckoutErrorField(errors), 'customerName')
})

test('checkout menolak nomor telepon terlalu pendek', () => {
  const errors = validateCheckoutForm({
    customerName: 'Bagas',
    phone: '0812',
    paymentMethod: 'qris',
    note: '',
  })

  assert.equal(errors.phone, 'Nomor telepon minimal 9 digit.')
})

test('checkout menolak catatan lebih dari 200 karakter', () => {
  const errors = validateCheckoutForm({
    customerName: 'Bagas',
    phone: '081234567890',
    paymentMethod: 'cash',
    note: 'A'.repeat(201),
  })

  assert.equal(errors.note, 'Catatan maksimal 200 karakter.')
})

test('checkout valid dan normalizePhone membuang karakter non-digit', () => {
  const errors = validateCheckoutForm({
    customerName: '  Bagas Pratama  ',
    phone: ' 0812-3456-7890 ',
    paymentMethod: 'transfer',
    note: '  Tanpa sambal.  ',
  })

  assert.deepEqual(errors, {})
  assert.equal(normalizePhone('+62 812-3456-7890'), '6281234567890')
})

test('firstCheckoutErrorField mengutamakan nama penerima', () => {
  const errors = validateCheckoutForm({
    customerName: '',
    phone: '',
    paymentMethod: '',
    note: '',
  })

  assert.equal(firstCheckoutErrorField(errors), 'customerName')
  assert.equal(firstCheckoutErrorField({}), null)
})
