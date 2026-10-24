import { ValidationError, type ValidationIssue } from '../errors/ValidationError.ts';

export interface CreateMenuInput {
  stallId: number;
  name: string;
  price: number;
  isAvailable: boolean;
}

export type UpdateMenuInput = CreateMenuInput;

function asObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ValidationError([
      {
        field: 'body',
        message: 'Body harus berupa objek JSON',
      },
    ]);
  }

  return value as Record<string, unknown>;
}

function parseStallId(value: unknown, issues: ValidationIssue[]): number | undefined {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    issues.push({
      field: 'stallId',
      message: 'stallId wajib berupa bilangan bulat lebih dari 0',
    });
    return undefined;
  }

  return value;
}

function parseName(value: unknown, issues: ValidationIssue[]): string | undefined {
  if (typeof value !== 'string') {
    issues.push({
      field: 'name',
      message: 'name wajib diisi',
    });
    return undefined;
  }

  const name = value.trim();

  if (name.length < 2) {
    issues.push({
      field: 'name',
      message: 'name minimal 2 karakter',
    });
    return undefined;
  }

  if (name.length > 100) {
    issues.push({
      field: 'name',
      message: 'name maksimal 100 karakter',
    });
    return undefined;
  }

  return name;
}

function parsePrice(value: unknown, issues: ValidationIssue[]): number | undefined {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    issues.push({
      field: 'price',
      message: 'price wajib berupa bilangan bulat minimal 0',
    });
    return undefined;
  }

  if (value > 1_000_000_000) {
    issues.push({
      field: 'price',
      message: 'price maksimal 1.000.000.000',
    });
    return undefined;
  }

  return value;
}

function parseAvailability(
  value: unknown,
  issues: ValidationIssue[],
  fallback?: boolean,
): boolean | undefined {
  if (value === undefined && fallback !== undefined) return fallback;

  if (typeof value !== 'boolean') {
    issues.push({
      field: 'isAvailable',
      message: 'isAvailable wajib berupa boolean',
    });
    return undefined;
  }

  return value;
}

export function parseCreateMenuInput(value: unknown): CreateMenuInput {
  const body = asObject(value);
  const issues: ValidationIssue[] = [];
  const stallId = parseStallId(body.stallId, issues);
  const name = parseName(body.name, issues);
  const price = parsePrice(body.price, issues);
  const isAvailable = parseAvailability(body.isAvailable, issues, true);

  if (issues.length > 0) {
    throw new ValidationError(issues);
  }

  return {
    stallId: stallId as number,
    name: name as string,
    price: price as number,
    isAvailable: isAvailable as boolean,
  };
}

export function parseUpdateMenuInput(value: unknown): UpdateMenuInput {
  const body = asObject(value);
  const issues: ValidationIssue[] = [];
  const stallId = parseStallId(body.stallId, issues);
  const name = parseName(body.name, issues);
  const price = parsePrice(body.price, issues);
  const isAvailable = parseAvailability(body.isAvailable, issues);

  if (issues.length > 0) {
    throw new ValidationError(issues);
  }

  return {
    stallId: stallId as number,
    name: name as string,
    price: price as number,
    isAvailable: isAvailable as boolean,
  };
}

export function parseIdParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const id = Number(raw);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError([
      {
        field: 'id',
        message: 'id harus berupa bilangan bulat lebih dari 0',
      },
    ]);
  }

  return id;
}
