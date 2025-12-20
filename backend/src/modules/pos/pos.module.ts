import { Router } from 'express';
import { createProductsRouter } from './products.routes';
import { createTablesRouter } from './tables.routes';
import { createOrdersRouter } from './orders.routes';
import { createCashRouter } from './cash.routes';

export function createPosRouter(): Router {
  const router = Router();

  router.use('/products', createProductsRouter());
  router.use('/tables', createTablesRouter());
  router.use('/orders', createOrdersRouter());
  router.use('/', createCashRouter());

  return router;
}
