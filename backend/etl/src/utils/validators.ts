/**
 * Validation Utilities for ETL Migration
 * Implements validation rules from ETL-DESIGN-PART2.md
 */

import { TOLERANCE } from '../config/constants';

/**
 * Validate that order total matches sum of items
 */
export function validateOrderTotal(
  orderTotal: number,
  itemsTotal: number
): { valid: boolean; diffPercent: number; blocking: boolean } {
  const diff = Math.abs(orderTotal - itemsTotal);
  const diffPercent = orderTotal === 0 ? 0 : (diff / orderTotal) * 100;

  return {
    valid: diffPercent < TOLERANCE.amount_diff_percent,
    diffPercent,
    blocking: diffPercent >= TOLERANCE.blocking_diff_percent,
  };
}

/**
 * Validate that payment total matches order total
 */
export function validatePaymentTotal(
  orderTotal: number,
  paymentsTotal: number
): { valid: boolean; diffPercent: number; blocking: boolean } {
  const diff = Math.abs(orderTotal - paymentsTotal);
  const diffPercent = orderTotal === 0 ? 0 : (diff / orderTotal) * 100;

  return {
    valid: diffPercent < TOLERANCE.amount_diff_percent,
    diffPercent,
    blocking: diffPercent >= TOLERANCE.blocking_diff_percent,
  };
}

/**
 * Validate date is not invalid MySQL date
 */
export function isValidDate(dateStr: string | null): boolean {
  if (!dateStr) return false;
  if (dateStr.startsWith('0000-00-00')) return false;

  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Validate required field is not null/empty
 */
export function isRequired(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  return true;
}

/**
 * Validate positive number
 */
export function isPositive(value: number | null): boolean {
  return value !== null && value > 0;
}

/**
 * Validate non-negative number
 */
export function isNonNegative(value: number | null): boolean {
  return value !== null && value >= 0;
}

/**
 * Validate decimal precision (for money: 2 decimals)
 */
export function hasValidPrecision(value: number | null, decimals: number): boolean {
  if (value === null) return false;

  const str = value.toString();
  const parts = str.split('.');

  if (parts.length === 1) return true; // Integer
  return parts[1].length <= decimals;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string | null): boolean {
  if (!email) return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate RUC (Peruvian tax ID: 11 digits starting with 10, 15, 17, 20)
 */
export function isValidRUC(ruc: string | null): boolean {
  if (!ruc) return false;

  const cleaned = ruc.trim();
  if (!/^\d{11}$/.test(cleaned)) return false;

  const prefix = cleaned.substring(0, 2);
  return ['10', '15', '17', '20'].includes(prefix);
}

/**
 * Validate phone number (Peru: 7-9 digits)
 */
export function isValidPhone(phone: string | null): boolean {
  if (!phone) return false;

  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^\d{7,9}$/.test(cleaned);
}

/**
 * Check if error is blocking (should stop migration)
 */
export function isBlockingError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // FK constraint violations
  if (message.includes('foreign key') || message.includes('fk_')) return true;

  // Unique constraint violations
  if (message.includes('unique constraint') || message.includes('duplicate key')) return true;

  // Required field violations
  if (message.includes('not null') || message.includes('required')) return true;

  // Data type violations
  if (message.includes('invalid input syntax')) return true;

  return false;
}

/**
 * Extract error type from Prisma error
 */
export function getErrorType(error: any): 'blocking' | 'warning' | 'skip' {
  if (!error) return 'skip';

  // Prisma error codes
  if (error.code) {
    switch (error.code) {
      case 'P2002': // Unique constraint
      case 'P2003': // Foreign key constraint
      case 'P2011': // Null constraint
      case 'P2006': // Invalid value
        return 'blocking';

      case 'P2001': // Record not found
      case 'P2025': // Record to update not found
        return 'skip';

      default:
        return 'warning';
    }
  }

  // Check message
  if (isBlockingError(error)) {
    return 'blocking';
  }

  return 'warning';
}
