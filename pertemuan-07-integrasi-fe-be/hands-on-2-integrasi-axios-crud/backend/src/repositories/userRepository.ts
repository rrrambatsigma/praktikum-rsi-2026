import sql from 'mssql';
import { createRequest } from '../db/request.ts';
import type { UserRole } from '../types/user.ts';

export interface UserRow {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date | null;
}

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

export interface FindUsersParams {
  role?: UserRole;
  search?: string;
}

const userSelect = `
  SELECT
    id,
    name,
    email,
    password_hash AS passwordHash,
    role,
    created_at AS createdAt
  FROM dbo.USERS
`;

export class UserRepository {
  async findByEmail(email: string): Promise<UserRow | null> {
    const request = await createRequest();
    const result = await request
      .input('email', sql.NVarChar(150), email)
      .query<UserRow>(`${userSelect} WHERE email = @email`);

    return result.recordset[0] ?? null;
  }

  async findById(id: number): Promise<UserRow | null> {
    const request = await createRequest();
    const result = await request
      .input('id', sql.Int, id)
      .query<UserRow>(`${userSelect} WHERE id = @id`);

    return result.recordset[0] ?? null;
  }

  async findAll(params: FindUsersParams = {}): Promise<UserRow[]> {
    const request = await createRequest();
    const result = await request
      .input('role', sql.NVarChar(20), params.role ?? null)
      .input('search', sql.NVarChar(100), params.search ?? null)
      .query<UserRow>(`
        ${userSelect}
        WHERE (@role IS NULL OR role = @role)
          AND (
            @search IS NULL
            OR name LIKE '%' + @search + '%'
            OR email LIKE '%' + @search + '%'
          )
        ORDER BY id
      `);

    return result.recordset;
  }

  async create(input: CreateUserInput): Promise<UserRow | null> {
    const request = await createRequest();
    const result = await request
      .input('name', sql.NVarChar(100), input.name)
      .input('email', sql.NVarChar(150), input.email)
      .input('passwordHash', sql.NVarChar(255), input.passwordHash)
      .input('role', sql.NVarChar(20), input.role)
      .query<{ id: number }>(`
        INSERT INTO dbo.USERS (name, email, password_hash, role)
        OUTPUT INSERTED.id
        VALUES (@name, @email, @passwordHash, @role)
      `);

    const id = result.recordset[0]?.id;
    return id ? this.findById(id) : null;
  }

  async updateProfile(id: number, name: string, email: string): Promise<UserRow | null> {
    const request = await createRequest();
    const result = await request
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar(100), name)
      .input('email', sql.NVarChar(150), email)
      .query<{ id: number }>(`
        UPDATE dbo.USERS
        SET name = @name, email = @email
        OUTPUT INSERTED.id
        WHERE id = @id
      `);

    const updatedId = result.recordset[0]?.id;
    return updatedId ? this.findById(updatedId) : null;
  }

  async updatePassword(id: number, passwordHash: string): Promise<boolean> {
    const request = await createRequest();
    const result = await request
      .input('id', sql.Int, id)
      .input('passwordHash', sql.NVarChar(255), passwordHash)
      .query('UPDATE dbo.USERS SET password_hash = @passwordHash WHERE id = @id');

    return result.rowsAffected[0] > 0;
  }

  async updateRole(id: number, role: UserRole): Promise<UserRow | null> {
    const request = await createRequest();
    const result = await request
      .input('id', sql.Int, id)
      .input('role', sql.NVarChar(20), role)
      .query<{ id: number }>(`
        UPDATE dbo.USERS
        SET role = @role
        OUTPUT INSERTED.id
        WHERE id = @id
      `);

    const updatedId = result.recordset[0]?.id;
    return updatedId ? this.findById(updatedId) : null;
  }

  async countByRole(role: UserRole): Promise<number> {
    const request = await createRequest();
    const result = await request
      .input('role', sql.NVarChar(20), role)
      .query<{ total: number }>('SELECT COUNT(*) AS total FROM dbo.USERS WHERE role = @role');

    return Number(result.recordset[0]?.total ?? 0);
  }
}
