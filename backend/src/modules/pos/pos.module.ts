import { Router } from 'express';
import { createProductsRouter } from './products.routes';
import { createTablesRouter } from './tables.routes';
import { createOrdersRouter } from './orders.routes';
import { createCashRouter } from './cash.routes';
import { createPaymentsRouter } from './payments.routes';
import { createInvoicesRouter } from './invoices.routes';
import { createValidatorsRouter } from './validators.routes';

export function createPosRouter(): Router {
  const router = Router();

  router.use('/products', createProductsRouter());
  router.use('/tables', createTablesRouter());
  router.use('/orders', createOrdersRouter());
  router.use('/payments', createPaymentsRouter());
  router.use('/invoices', createInvoicesRouter());
  router.use('/validators', createValidatorsRouter());
  router.use('/', createCashRouter());

  return router;
}
