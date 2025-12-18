/**
 * Data Transformation Utilities
 * All transformation functions from ETL-DESIGN.md
 */

import {
  EMPLOYEE_ROLE_MAP,
  TABLE_STATUS_MAP,
  ORDER_STATUS_MAP,
  DOCUMENT_TYPE_BY_SERIES,
  PAYMENT_METHOD_CODES,
  DEFAULTS,
} from '../config/constants';

/**
 * Generate code from name (slug-like)
 * "Salón Principal" → "SALON_PRINCIPAL"
 */
export function generateCode(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^A-Z0-9]+/g, '_') // Replace non-alphanum with _
    .replace(/^_|_$/g, ''); // Remove leading/trailing _
}

/**
 * Convert latin1 text to utf8mb4
 */
export function convertToUtf8(text: string | null): string | null {
  if (!text) return null;
  // JavaScript strings are already UTF-16, but we trim and normalize
  return text.trim().normalize('NFC');
}

/**
 * Map employee role from legacy to new enum
 */
export function mapEmployeeRole(
  legacyRole: string | null
): 'waiter' | 'cashier' | 'cook' | 'bartender' | 'manager' | 'admin' {
  if (!legacyRole) return DEFAULTS.default_employee_role;

  const normalized = legacyRole.trim();
  return EMPLOYEE_ROLE_MAP[normalized] || DEFAULTS.default_employee_role;
}

/**
 * Split full name into firstName and lastName
 * "Juan Pérez García" → firstName: "Juan", lastName: "Pérez García"
 */
export function splitName(fullName: string | null): { firstName: string; lastName: string | null } {
  if (!fullName || !fullName.trim()) {
    return { firstName: 'Desconocido', lastName: null };
  }

  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: null };
  }

  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName };
}

/**
 * Map table status from legacy to new enum
 */
export function mapTableStatus(
  legacyStatus: string | null
): 'available' | 'occupied' | 'reserved' | 'out_of_service' {
  if (!legacyStatus) return 'available';

  const normalized = legacyStatus.toLowerCase().trim();
  return TABLE_STATUS_MAP[normalized] || 'available';
}

/**
 * Map order status from legacy to new enum
 */
export function mapOrderStatus(legacyStatus: string | null): 'open' | 'closed' | 'cancelled' {
  if (!legacyStatus) return 'closed';

  const normalized = legacyStatus.toLowerCase().trim();
  return ORDER_STATUS_MAP[normalized] || 'closed';
}

/**
 * Detect document type from series prefix
 * "F001" → "factura", "B001" → "boleta", "T001" → "ticket"
 */
export function detectDocumentType(
  series: string | null
): 'factura' | 'boleta' | 'ticket' {
  if (!series || !series.trim()) return 'ticket';

  const prefix = series.trim().charAt(0).toUpperCase();
  return DOCUMENT_TYPE_BY_SERIES[prefix] || 'ticket';
}

/**
 * Generate order number in format #YYYYMMDD-NNNN
 */
export function generateOrderNumber(date: Date, sequenceNumber: number): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const seq = String(sequenceNumber).padStart(4, '0');

  return `#${year}${month}${day}-${seq}`;
}

/**
 * Process stock value (handle negatives)
 * CRITICAL: Negative stocks are sales counters, not inventory!
 */
export function processStock(
  stockLegacy: number | null
): { currentStock: number; tracksInventory: boolean } {
  // NULL or 0 → no inventory tracking
  if (stockLegacy === null || stockLegacy === 0) {
    return { currentStock: 0, tracksInventory: false };
  }

  // NEGATIVE → sales counter, reset to 0
  if (stockLegacy < 0) {
    return { currentStock: 0, tracksInventory: false };
  }

  // POSITIVE → real stock
  return {
    currentStock: Math.round(stockLegacy * 1000) / 1000, // 3 decimals
    tracksInventory: true,
  };
}

/**
 * Generate payment method code from name
 */
export function generatePaymentMethodCode(name: string | null): string {
  if (!name) return 'OTHER';

  const normalized = name.trim();
  return PAYMENT_METHOD_CODES[normalized] || generateCode(name);
}

/**
 * Detect if payment method requires reference
 */
export function requiresReference(name: string | null): boolean {
  if (!name) return false;

  const normalized = name.toLowerCase().trim();
  return (
    normalized.includes('tarjeta') ||
    normalized.includes('transferencia') ||
    normalized.includes('yape') ||
    normalized.includes('plin')
  );
}

/**
 * Parse MySQL datetime to JS Date
 * Handles "0000-00-00 00:00:00" invalid dates
 */
export function parseMySQLDate(dateStr: string | null): Date | null {
  if (!dateStr || dateStr.startsWith('0000-00-00')) {
    return null;
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/**
 * Round decimal to 2 places (for money)
 */
export function roundMoney(value: number | null): number {
  if (value === null) return 0;
  return Math.round(value * 100) / 100;
}

/**
 * Round decimal to 3 places (for quantities)
 */
export function roundQuantity(value: number | null): number {
  if (value === null) return 0;
  return Math.round(value * 1000) / 1000;
}

/**
 * Calculate amount difference percentage
 */
export function calculateDiffPercent(amount1: number, amount2: number): number {
  if (amount1 === 0 && amount2 === 0) return 0;
  if (amount1 === 0) return 100;

  return Math.abs(((amount2 - amount1) / amount1) * 100);
}

/**
 * Normalize phone number (remove spaces, dashes)
 */
export function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  return phone.replace(/[\s\-()]/g, '').trim() || null;
}

/**
 * Validate and normalize email
 */
export function normalizeEmail(email: string | null): string | null {
  if (!email) return null;

  const normalized = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(normalized) ? normalized : null;
}
