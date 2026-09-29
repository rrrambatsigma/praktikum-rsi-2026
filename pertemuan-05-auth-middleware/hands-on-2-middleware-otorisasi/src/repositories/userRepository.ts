import { eq } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { users } from '../db/schema.ts';

/** Sama dengan enum kolom `role` di tabel USERS (drizzle sudah meng-infer-nya). */
export type UserRole = 'admin' | 'owner' | 'customer';

export interface CreateUserInput {
  name: string;
  email: string;
  /** Sudah di-hash oleh AuthService — repository tidak pernah hashing sendiri. */
  passwordHash: string;
  role: UserRole;
}

export class UserRepository {
  async findByEmail(email: string) {
    const db = await getDb();
    const rows = await db.select().from(users).where(eq(users.email, email));
    return rows[0];
  }

  async findById(id: number) {
    const db = await getDb();
    const rows = await db.select().from(users).where(eq(users.id, id));
    return rows[0];
  }

  // MSSQL: pengembalian baris hasil insert memakai .output() (bukan .returning()).
  // created_at tidak diisi di sini karena sudah punya DEFAULT SYSDATETIME() di DDL.
  async create(input: CreateUserInput) {
    const db = await getDb();
    const rows = await db
      .insert(users)
      .output()
      .values({
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role,
      });
    return rows[0];
  }
}