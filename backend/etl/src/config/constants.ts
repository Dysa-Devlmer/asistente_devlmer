/**
 * ETL Migration Constants
 * Batch sizes, mappings, and configuration
 */

// Batch sizes by table (optimized for performance)
export const BATCH_SIZES = {
  rooms: 100,
  categories: 100,
  price_tiers: 100,
  payment_methods: 50,
  cash_registers: 50,
  kitchen_stations: 10,
  employees: 50,
  customers: 100,
  products: 100,
  product_prices: 200,
  tables: 100,
  cash_register_shifts: 100,
  orders: 100,
  order_items: 500,
  payments: 200,
  invoices: 200,
};

// Employee role mapping (legacy → new)
export const EMPLOYEE_ROLE_MAP: Record<string, 'waiter' | 'cashier' | 'cook' | 'bartender' | 'manager' | 'admin'> = {
  'Camarero': 'waiter',
  'Mesero': 'waiter',
  'Mozo': 'waiter',
  'Cajero': 'cashier',
  'Caja': 'cashier',
  'Cocinero': 'cook',
  'Chef': 'cook',
  'Cocina': 'cook',
  'Bartender': 'bartender',
  'Bar': 'bartender',
  'Barman': 'bartender',
  'Gerente': 'manager',
  'Administrador': 'admin',
  'Admin': 'admin',
};

// Table status mapping (legacy → new)
export const TABLE_STATUS_MAP: Record<string, 'available' | 'occupied' | 'reserved' | 'out_of_service'> = {
  'libre': 'available',
  'disponible': 'available',
  'ocupada': 'occupied',
  'reservada': 'reserved',
  'reserva': 'reserved',
  'fuera de servicio': 'out_of_service',
  'mantenimiento': 'out_of_service',
};

// Order status mapping (legacy → new)
export const ORDER_STATUS_MAP: Record<string, 'open' | 'closed' | 'cancelled'> = {
  'abierta': 'open',
  'cerrada': 'closed',
  'cancelada': 'cancelled',
  'anulada': 'cancelled',
};

// Document type detection by series prefix
export const DOCUMENT_TYPE_BY_SERIES: Record<string, 'factura' | 'boleta' | 'ticket'> = {
  'F': 'factura',
  'B': 'boleta',
  'T': 'ticket',
  // 'N' series (notas) default to 'ticket' via fallback in detectDocumentType
};

// Payment method codes mapping
export const PAYMENT_METHOD_CODES: Record<string, string> = {
  'Efectivo': 'CASH',
  'Tarjeta de Crédito': 'CREDIT_CARD',
  'Tarjeta de Débito': 'DEBIT_CARD',
  'Transferencia': 'BANK_TRANSFER',
  'Yape': 'YAPE',
  'Plin': 'PLIN',
  'Cortesía': 'COURTESY',
  'Crédito Cliente': 'CUSTOMER_CREDIT',
};

// Migration time windows (months)
export const MIGRATION_WINDOWS = {
  transactions: 12, // 12 months of transactions
  cash_shifts: 12,  // 12 months of cash register shifts
  all_masters: true, // All master data
};

// Error tolerance thresholds
export const TOLERANCE = {
  amount_diff_percent: 1,    // 1% tolerance for amount differences
  blocking_diff_percent: 5,  // 5% = blocking error
};

// Default values
export const DEFAULTS = {
  kitchen_station_code: 'KITCHEN_MAIN',
  kitchen_station_name: 'Cocina Principal',
  default_price_tier_code: 'GENERAL',
  default_employee_role: 'waiter' as const,
};
