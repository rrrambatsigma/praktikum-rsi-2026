# Maem Bolo - Frontend Hands-On 2

Frontend React 19 + TypeScript + Vite untuk integrasi Axios, cookie JWT, RBAC, dan CRUD.

## Menjalankan

```bash
npm install
npm run dev
```

Salin `.env.example` menjadi `.env` bila backend tidak berada di `http://localhost:3000/api`:

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api
```

Pastikan `CORS_ORIGIN` backend sama dengan origin Vite, misalnya `http://localhost:5173`.

## Perintah

```bash
npm run dev
npm run lint
npm run build
npm run preview
```

## Halaman

| Route | Akses | Fungsi |
|---|---|---|
| `/` | publik | Daftar dan pencarian warung |
| `/stalls/:id` | publik | Detail menu/review, review/like/flag untuk customer |
| `/login` | publik | Login cookie JWT |
| `/register` | publik | Register customer |
| `/profile` | login | Ubah profil dan password |
| `/reviews` | customer | Kelola review sendiri |
| `/owner` | owner | Warung, menu, dan moderasi review milik sendiri |
| `/admin` | admin | User, warung, flag/review, audit log |
| `/forbidden` | login | Role tidak sesuai |
| `*` | publik | Halaman 404 |

## Integrasi

- `src/lib/http.ts`: Axios instance dengan `withCredentials: true`.
- Reset sesi hanya dipicu oleh `401` dari endpoint selain login/register/me.
- `403` menampilkan akses ditolak tanpa menghapus sesi.
- `src/context/AuthContext.tsx`: restore sesi melalui `GET /auth/me`.
- Tidak ada token di `localStorage` atau `sessionStorage`.

## Keterbatasan

- Dependency baru (`axios`, `react-router-dom`, Tailwind v4, Lucide) harus diinstal dengan `npm install`.
- Belum ada automated test.
- Halaman admin/owner memuat beberapa endpoint sekaligus; belum ada pagination.
