import { Router } from 'express';
import { createProductsRouter } from './products.routes';
import { createTablesRouter as createLegacyTablesRouter } from './tables.routes';
import { createOrdersRouter } from './orders.routes';
import { createCashRouter } from './cash.routes';
import { createPaymentsRouter } from './payments.routes';
import { createInvoicesRouter } from './invoices.routes';
import { createValidatorsRouter } from './validators.routes';
import { createEmployeesRouter } from './employees.routes';

// MISTURA-compliant routes (new implementation)
import { createTablesRouter } from './routes/tables';
import { createSalesRouter } from './routes/sales';
import { createKitchenRoutes } from './routes/kitchen';
import { postgresPool } from '../../config/postgres';
import { WebSocketService } from '../../services/WebSocketService';

export function createPosRouter(wsService?: WebSocketService): Router {
  const router = Router();

  // Legacy routes (existing functionality)
  router.use('/products', createProductsRouter());
  router.use('/payments', createPaymentsRouter());
  router.use('/invoices', createInvoicesRouter());
  router.use('/validators', createValidatorsRouter());
  router.use('/employees', createEmployeesRouter());
  router.use('/', createCashRouter());

  // MISTURA-compliant routes (new POS implementation)
  // These routes take precedence for the POS interface
  router.use('/pos/tables', createTablesRouter(postgresPool));
  router.use('/pos/sales', createSalesRouter(postgresPool));
  router.use('/pos/kitchen', createKitchenRoutes(wsService));

  // Keep legacy tables and orders routes for backwards compatibility
  router.use('/tables', createLegacyTablesRouter());
  router.use('/orders', createOrdersRouter());

  return router;
}
