import { Prisma, OrderStatus, OrderItemStatus, ShiftStatus, DrawerEventType, TableStatus, DocumentType } from '@prisma/client';
import { ValidationError } from '../../common/errors/typed-errors';

type Primitive = string | number | boolean | null | undefined;

function firstValue(value: unknown): Primitive {
  if (Array.isArray(value)) {
    return (value[0] as Primitive) ?? undefined;
  }
  return value as Primitive;
}

export function parseBigIntField(value: unknown, field: string): bigint {
  const candidate = firstValue(value);
  if (candidate === null || candidate === undefined || candidate === '') {
    throw new ValidationError(`${field} is required`, { field });
  }
  if (typeof candidate === 'number') {
    if (!Number.isSafeInteger(candidate)) {
      throw new ValidationError(`${field} must be a safe integer`, { field });
    }
    return BigInt(candidate);
  }
  if (typeof candidate === 'string') {
    try {
      return BigInt(candidate);
    } catch (error) {
      throw new ValidationError(`${field} must be a bigint string`, { field });
    }
  }
  throw new ValidationError(`${field} must be a bigint string or integer`, { field });
}

export function parseOptionalBigIntField(value: unknown, field = 'id'): bigint | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return parseBigIntField(value, field);
}

export function parseDecimalField(value: unknown, field: string): Prisma.Decimal {
  const candidate = firstValue(value);
  if (candidate === null || candidate === undefined || candidate === '') {
    throw new ValidationError(`${field} is required`, { field });
  }
  if (typeof candidate === 'number' || typeof candidate === 'string') {
    try {
      return new Prisma.Decimal(candidate);
    } catch (error) {
      throw new ValidationError(`${field} must be a valid decimal`, { field });
    }
  }
  throw new ValidationError(`${field} must be a number or string`, { field });
}

export function parseOptionalDecimalField(value: unknown): Prisma.Decimal | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return parseDecimalField(value, 'amount');
}

export function parseIntegerField(value: unknown, field: string, options?: { min?: number }): number {
  const candidate = firstValue(value);
  if (candidate === null || candidate === undefined || candidate === '') {
    throw new ValidationError(`${field} is required`, { field });
  }
  const parsed = typeof candidate === 'number' ? candidate : Number(candidate);
  if (!Number.isInteger(parsed)) {
    throw new ValidationError(`${field} must be an integer`, { field });
  }
  if (options?.min !== undefined && parsed < options.min) {
    throw new ValidationError(`${field} must be >= ${options.min}`, { field });
  }
  return parsed;
}

export function parseOptionalBoolean(value: unknown): boolean | undefined {
  const candidate = firstValue(value);
  if (candidate === undefined || candidate === null || candidate === '') {
    return undefined;
  }
  if (candidate === true || candidate === 'true' || candidate === '1') {
    return true;
  }
  if (candidate === false || candidate === 'false' || candidate === '0') {
    return false;
  }
  throw new ValidationError('invalid boolean value', { value: candidate });
}

export function parsePagination(value: {
  page?: unknown;
  limit?: unknown;
}, defaults?: { page?: number; limit?: number }) {
  const page = value.page === undefined ? (defaults?.page ?? 1) : parseIntegerField(value.page, 'page', { min: 1 });
  const limit = value.limit === undefined ? (defaults?.limit ?? 50) : parseIntegerField(value.limit, 'limit', { min: 1 });
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function parseOrderStatus(value: unknown): OrderStatus {
  const candidate = firstValue(value);
  if (candidate === undefined || candidate === null || candidate === '') {
    throw new ValidationError('status is required', { field: 'status' });
  }
  const allowed = new Set(Object.values(OrderStatus));
  if (typeof candidate === 'string' && allowed.has(candidate as OrderStatus)) {
    return candidate as OrderStatus;
  }
  throw new ValidationError('invalid order status', { value: candidate });
}

export function parseOrderItemStatus(value: unknown): OrderItemStatus {
  const candidate = firstValue(value);
  if (candidate === undefined || candidate === null || candidate === '') {
    throw new ValidationError('status is required', { field: 'status' });
  }
  const allowed = new Set(Object.values(OrderItemStatus));
  if (typeof candidate === 'string' && allowed.has(candidate as OrderItemStatus)) {
    return candidate as OrderItemStatus;
  }
  throw new ValidationError('invalid order item status', { value: candidate });
}

export function parseShiftStatus(value: unknown): ShiftStatus {
  const candidate = firstValue(value);
  if (candidate === undefined || candidate === null || candidate === '') {
    throw new ValidationError('status is required', { field: 'status' });
  }
  const allowed = new Set(Object.values(ShiftStatus));
  if (typeof candidate === 'string' && allowed.has(candidate as ShiftStatus)) {
    return candidate as ShiftStatus;
  }
  throw new ValidationError('invalid shift status', { value: candidate });
}

export function parseDrawerEventType(value: unknown): DrawerEventType {
  const candidate = firstValue(value);
  if (candidate === undefined || candidate === null || candidate === '') {
    throw new ValidationError('eventType is required', { field: 'eventType' });
  }
  const allowed = new Set(Object.values(DrawerEventType));
  if (typeof candidate === 'string' && allowed.has(candidate as DrawerEventType)) {
    return candidate as DrawerEventType;
  }
  throw new ValidationError('invalid drawer event type', { value: candidate });
}

export function parseTableStatus(value: unknown): TableStatus {
  const candidate = firstValue(value);
  if (candidate === undefined || candidate === null || candidate === '') {
    throw new ValidationError('status is required', { field: 'status' });
  }
  const allowed = new Set(Object.values(TableStatus));
  if (typeof candidate === 'string' && allowed.has(candidate as TableStatus)) {
    return candidate as TableStatus;
  }
  throw new ValidationError('invalid table status', { value: candidate });
}

export function parseDocumentType(value: unknown): DocumentType {
  const candidate = firstValue(value);
  if (candidate === undefined || candidate === null || candidate === '') {
    throw new ValidationError('documentType is required', { field: 'documentType' });
  }
  const allowed = new Set(Object.values(DocumentType));
  if (typeof candidate === 'string' && allowed.has(candidate as DocumentType)) {
    return candidate as DocumentType;
  }
  throw new ValidationError('invalid document type', { value: candidate });
}
