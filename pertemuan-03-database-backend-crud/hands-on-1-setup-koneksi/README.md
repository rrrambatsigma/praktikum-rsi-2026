# Hands-on 1 — Setup Database & Koneksi dari Backend

Hands-on ini menyiapkan database **SQL Server** untuk aplikasi "Review Kantin Kampus",
membuat user khusus aplikasi, lalu menghubungkan backend **Node.js + Express** ke
database memakai driver **`mssql`**.

> File ini adalah sumber langkah utama. Situs materi mengikuti isi file ini.

## Prasyarat

- Node.js **>= 22.18.0** dan npm
- SQL Server aktif (default instance `localhost`, atau named instance seperti `.\SQLEXPRESS`)
- Akses **Windows Authentication** sebagai sysadmin (dipakai untuk setup awal saja)
- PowerShell / Terminal (opsional: SSMS atau Azure Data Studio)

---

## Bagian A — Setup Database (sekali saja)

### Langkah 1 — Aktifkan SQL Authentication & buat login admin

Buka `../db/00-setup-sql-auth.sql`. Script ini:

1. mengecek apakah instance masih **Windows-only**,
2. mengaktifkan **mixed mode** (SQL Server + Windows Authentication),
3. membuat login admin `rsi_admin`.

Jalankan sebagai sysadmin memakai Windows Authentication:

```powershell
sqlcmd -S localhost -E -i ..\db\00-setup-sql-auth.sql
```

> `-E` = koneksi Windows (trusted). Untuk named instance ganti server, mis. `-S .\SQLEXPRESS`.

Script mengubah `LoginMode` di registry. Agar berlaku, **restart service SQL Server**
(dari PowerShell **Administrator**):

```powershell
Restart-Service -Name MSSQLSERVER          # default instance
# Restart-Service -Name 'MSSQL$SQLEXPRESS' # named instance
```

> Alternatif: `..\db\setup-database.ps1` menjalankan sekaligus aktifasi mixed mode,
> aktifasi TCP/IP 1433, pembuatan DB/user, dan restart service (jalankan sebagai Administrator).

Kalau `windows_only` sudah bernilai `0` (mixed mode sudah aktif), langkah registry bisa dilewati.
Untuk named instance, cara paling aman mengaktifkan mixed mode adalah lewat SSMS:
*Server Properties → Security → **SQL Server and Windows Authentication mode***, lalu restart.

### Langkah 2 — Buat database & user aplikasi

Buka `../db/01-create-database.sql`. Script ini membuat database `review_kantin`
dan login/user `praktikum_user` dengan hak baca-tulis (`db_datareader`, `db_datawriter`).

```powershell
sqlcmd -S localhost -E -i ..\db\01-create-database.sql
```

Uji login aplikasi (bukti SQL Authentication bekerja):

```powershell
sqlcmd -S localhost -U praktikum_user -P "Praktikum2026!" -d review_kantin -C -Q "SELECT DB_NAME() AS db, SUSER_SNAME() AS login;"
```

---

## Bagian B — Menghubungkan Backend ke Database

### Langkah 3 — Buat project & install dependencies

```bash
npm init -y
npm install express mssql dotenv
npm install -D typescript @types/express @types/node @types/mssql tsx
```

- **express** — web framework (sudah dikenal dari pertemuan 2).
- **mssql** — driver SQL Server untuk Node.js.
- **dotenv** — membaca konfigurasi dari file `.env`.

### Langkah 4 — Atur `package.json`

Kita menjalankan TypeScript lewat **tsx** (tanpa kompilasi terpisah).

```json
{
  "main": "src/index.ts",
  "scripts": {
    "start": "tsx src/index.ts",
    "dev": "tsx watch src/index.ts"
  },
  "type": "commonjs"
}
```

### Langkah 5 — Konfigurasi `.env`

Salin `.env.example` menjadi `.env`, lalu sesuaikan bila perlu:

```powershell
Copy-Item .env.example .env
```

```
DB_SERVER=localhost
DB_PORT=1433
DB_USER=praktikum_user
DB_PASSWORD=Praktikum2026!
DB_NAME=review_kantin
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

> Untuk SQL Server lokal, biasanya `DB_ENCRYPT=false` dan `DB_TRUST_SERVER_CERTIFICATE=true`
> karena sertifikat lokal tidak tepercaya. **Jangan commit `.env`.**
>
> Nilai yang mengandung `#` **wajib** dibungkus tanda kutip, karena `dotenv`
> menganggap `#` sebagai awal komentar — mis. `DB_PASSWORD="Pswd#123"`. Password
> contoh di atas sengaja tanpa `#` agar aman.

### Langkah 6 — Buat connection pool (`src/config/database.ts`)

Kita membuat pool sekali, lalu memakainya kembali. Isi file:

```ts
import 'dotenv/config';
import sql from 'mssql';

const config: sql.config = {
  server: process.env.DB_SERVER ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 1433),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config).connect().catch((error) => {
      poolPromise = null;
      throw error;
    });
  }
  return poolPromise;
}
```

Konsep penting:

- **Driver** (`mssql`) menjembatani Node.js dengan SQL Server lewat protokol TDS.
- **Connection string/config** berisi alamat server, kredensial, dan database tujuan.
- **Connection pool** menyimpan beberapa koneksi siap pakai, sehingga tiap request tidak
  perlu membuka koneksi baru dari nol.

### Langkah 7 — Tambah endpoint `GET /health` (`src/index.ts`)

```ts
import express, { type Request, type Response } from 'express';
import { getPool } from './config/database.ts';

const app = express();
const PORT: number = 3000;

app.use(express.json());

app.get('/health', async (req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT 1 AS ok');

    res.status(200).json({
      status: 'success',
      message: 'Server dan database terhubung',
      database: result.recordset[0],
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Gagal terhubung ke database',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
```

### Langkah 8 — Jalankan & uji

```bash
npm run dev
```

Buka `http://localhost:3000/health` di browser. Hasil yang diharapkan:

```json
{
  "status": "success",
  "message": "Server dan database terhubung",
  "database": { "ok": 1 },
  "timestamp": "2026-09-14T00:00:00.000Z"
}
```

---

## Troubleshooting

| Gejala | Kemungkinan penyebab & solusi |
| --- | --- |
| `Login failed for user 'praktikum_user'` | Mixed mode belum aktif / service belum direstart, atau password salah. Cek `SERVERPROPERTY('IsIntegratedSecurityOnly')` = 0. |
| `Failed to connect ... ECONNREFUSED` / `Could not connect (sequence)` | Service tidak jalan, atau **TCP/IP belum aktif di port 1433**. Aktifkan lewat SQL Server Configuration Manager → *SQL Server Network Configuration → Protocols → TCP/IP → Enabled*, lalu restart service. |
| `Login failed for user 'praktikum_user'` tapi DB sudah ada | Mixed mode belum benar-benar aktif — **service belum direstart** setelah `00-setup-sql-auth.sql`. |
| `self signed certificate` / error SSL | Set `DB_ENCRYPT=false` dan `DB_TRUST_SERVER_CERTIFICATE=true`. |
| `Environment variable DB_USER belum diisi` | File `.env` belum dibuat atau belum diisi. |
| `Cannot connect to localhost` (named instance) | Ganti `DB_SERVER=.\SQLEXPRESS` dan pastikan port statis/TCP aktif. |

## Struktur Project

```
hands-on-1-setup-koneksi/
├─ .env.example
├─ package.json
├─ tsconfig.json
└─ src/
   ├─ config/database.ts
   └─ index.ts
```
