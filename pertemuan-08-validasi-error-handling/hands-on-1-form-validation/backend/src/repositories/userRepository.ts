import sql from 'mssql';
import { getPool } from '../db/pool.ts';
import type { UserRole } from '../types/user.ts';

export interface UserRow {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

const userSelect = `
  SELECT
    id,
    name,
    email,
    password_hash AS passwordHash,
    role
  FROM dbo.USERS
`;

export class UserRepository {
  async findByEmail(email: string): Promise<UserRow | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('email', sql.NVarChar(150), email)
      .query<UserRow>(`${userSelect} WHERE email = @email`);

    return result.recordset[0] ?? null;
  }

  async findById(id: number): Promise<UserRow | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query<UserRow>(`${userSelect} WHERE id = @id`);

    return result.recordset[0] ?? null;
  }
}
