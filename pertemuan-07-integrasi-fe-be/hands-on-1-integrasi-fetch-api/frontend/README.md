# Frontend Maem Bolo - Hands-On 1 Integrasi Fetch API

Dashboard manajemen menu kantin Maem Bolo. Frontend React + TypeScript + Vite ini memakai Fetch API untuk seluruh operasi CRUD ke backend Express.

## Menjalankan

Dari folder `frontend`:

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Default API:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Pastikan backend sudah berjalan di `http://localhost:3000`. Dokumentasi API tersedia di `http://localhost:3000/api-docs`.

## Perintah

```powershell
npm run dev
npm run build
npm run lint
npm run preview
```

## Teknologi

- React 19
- TypeScript
- Vite
- Tailwind CSS v4 melalui `@tailwindcss/vite`
- Lucide React
- Fetch API bawaan browser

Tidak ada Axios, React Query, router, atau state management eksternal.

## Design System

Arah visual: **Warm Editorial + Modern SaaS Dashboard**.

- Font: Plus Jakarta Sans dari Google Fonts, fallback `"Plus Jakarta Sans", Inter, system-ui, sans-serif`.
- Warna utama: terracotta `#B94716`.
- Background halaman: warm cream `#FFF8F3`.
- Permukaan kartu: putih `#FFFFFF`.
- Teks: `#29231F`, teks sekunder `#796D65`.
- Border: `#EDE1D8`.
- Radius: kontrol 10 px, kartu 12 px, dialog 16 px.
- Target kontrol: 40-44 px.
- Spacing mengikuti basis 4 px.

Token warna, font, radius, dan shadow didefinisikan melalui `@theme` di `src/index.css`. Tailwind v4 tidak memakai file `tailwind.config.js`.

## Struktur

```text
src/
├─ components/
│  ├─ AppHeader.tsx
│  ├─ ConfirmDialog.tsx
│  ├─ MenuFilters.tsx
│  ├─ MenuFormModal.tsx
│  ├─ MenuTable.tsx
│  ├─ Modal.tsx
│  ├─ StatePanel.tsx
│  ├─ StatsGrid.tsx
│  └─ Toast.tsx
├─ hooks/
│  └─ useMenuData.ts
├─ lib/
│  ├─ api.ts
│  ├─ format.ts
│  └─ validation.ts
├─ types/
│  └─ menu.ts
├─ App.tsx
├─ index.css
└─ main.tsx
```

## Alur Data

1. `App` memanggil `useMenuData` saat halaman dimuat.
2. `useMenuData` mengambil menu dan warung secara paralel.
3. Request dikirim oleh `lib/api.ts` memakai Fetch API.
4. Data disimpan di state React dan diturunkan menjadi statistik serta daftar terfilter.
5. Create, update, dan delete memanggil API, menampilkan toast sukses, lalu memuat ulang data.
6. Error validasi atau operasi ditampilkan di form atau dialog yang sedang aktif.

## State UI

- Loading: skeleton untuk statistik dan tabel.
- Empty: pesan saat belum ada menu atau hasil filter kosong.
- Error: pesan, tombol coba lagi, dan detail status HTTP.
- Success: toast singkat setelah create, update, atau delete.
- Operation error: pesan inline di modal atau confirm dialog.

## Aksesibilitas

- Setiap input memiliki label.
- Dialog memakai `role="dialog"`, `aria-modal`, focus trap, dan mengembalikan fokus setelah ditutup.
- Tombol ikon memiliki `aria-label`.
- Fokus keyboard terlihat jelas.
- Animasi dikurangi saat `prefers-reduced-motion` aktif.
- Tabel berubah menjadi card pada layar kecil agar tetap terbaca.

## Integrasi API

| Method | Endpoint | Kegunaan |
|---|---|---|
| GET | `/api/menu` | Mengambil semua menu |
| GET | `/api/menu/:id` | Mengambil detail menu |
| POST | `/api/menu` | Menambah menu |
| PUT | `/api/menu/:id` | Mengubah menu |
| DELETE | `/api/menu/:id` | Menghapus menu |
| GET | `/api/stalls` | Mengambil daftar warung |
| GET | `/health` | Memeriksa koneksi backend dan database |

`DELETE` mengembalikan `204 No Content`. Endpoint lain mengembalikan JSON dengan envelope `{ status, data }` untuk sukses dan `{ status, message, errors? }` untuk error.

## Troubleshooting

### `Tidak dapat terhubung ke server`

Backend belum berjalan atau `VITE_API_BASE_URL` salah.

### CORS error

Pastikan `CORS_ORIGIN` di backend sama dengan origin frontend, biasanya `http://localhost:5173`, lalu restart backend.

### Tailwind tidak berjalan

Pastikan `@tailwindcss/vite` terpasang, plugin `tailwindcss()` ada di `vite.config.ts`, dan `src/index.css` diimport dari `main.tsx`.

### Font tidak tampil

Periksa koneksi ke Google Fonts. Browser akan memakai fallback Inter atau `system-ui` jika font gagal dimuat.

Dokumentasi lengkap ada di `../README.md`.
