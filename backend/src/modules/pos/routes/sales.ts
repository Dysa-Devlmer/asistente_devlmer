/**
 * Sales Routes
 * API endpoints for sales/orders management
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { SalesRepository } from '../repositories/SalesRepository';
import { TablesRepository } from '../repositories/TablesRepository';
import { SalesService } from '../services/SalesService';

export function createSalesRouter(pool: Pool): Router {
  const router = Router();
  const salesRepo = new SalesRepository(pool);
  const tablesRepo = new TablesRepository(pool);
  const salesService = new SalesService(salesRepo, tablesRepo, pool);

  /**
   * POST /api/pos/sales
   * Create new sale
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { Num_Mesa, id_camarero, id_caja, observaciones } = req.body;

      if (!Num_Mesa || !id_camarero || !id_caja) {
        return res.status(400).json({
          success: false,
          error: 'Faltan parámetros requeridos: Num_Mesa, id_camarero, id_caja'
        });
      }

      const result = await salesService.createSale({
        Num_Mesa,
        id_camarero,
        id_caja,
        observaciones
      });

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error creating sale:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear venta'
      });
    }
  });

  /**
   * GET /api/pos/sales
   * Get all open sales
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const { id_camarero } = req.query;

      const sales = await salesService.getOpenSales(id_camarero as string);

      res.json({
        success: true,
        data: sales
      });
    } catch (error) {
      console.error('Error fetching sales:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener ventas'
      });
    }
  });

  /**
   * GET /api/pos/sales/:id
   * Get sale by ID
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const id_venta = parseInt(req.params.id, 10);

      const sale = await salesService.getSale(id_venta);

      res.json({
        success: true,
        data: sale
      });
    } catch (error) {
      console.error('Error fetching sale:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener venta'
      });
    }
  });

  /**
   * POST /api/pos/sales/:id/lines
   * Add line to sale
   */
  router.post('/:id/lines', async (req: Request, res: Response) => {
    try {
      const id_venta = parseInt(req.params.id, 10);
      const { id_complementog, cantidad, observaciones } = req.body;

      if (!id_complementog || !cantidad) {
        return res.status(400).json({
          success: false,
          error: 'Faltan parámetros requeridos: id_complementog, cantidad'
        });
      }

      const result = await salesService.addLine(id_venta, {
        id_complementog,
        cantidad,
        observaciones
      });

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error adding line:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al agregar línea'
      });
    }
  });

  /**
   * PATCH /api/pos/sales/:id/lines/:lineId
   * Update sale line
   */
  router.patch('/:id/lines/:lineId', async (req: Request, res: Response) => {
    try {
      const id_venta = parseInt(req.params.id, 10);
      const id_linea = parseInt(req.params.lineId, 10);
      const { cantidad, observaciones, servido } = req.body;

      const result = await salesService.updateLine(id_venta, id_linea, {
        cantidad,
        observaciones,
        servido
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error updating line:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar línea'
      });
    }
  });

  /**
   * DELETE /api/pos/sales/:id/lines/:lineId
   * Delete sale line
   */
  router.delete('/:id/lines/:lineId', async (req: Request, res: Response) => {
    try {
      const id_venta = parseInt(req.params.id, 10);
      const id_linea = parseInt(req.params.lineId, 10);

      const result = await salesService.deleteLine(id_venta, id_linea);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error deleting line:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al eliminar línea'
      });
    }
  });

  /**
   * PATCH /api/pos/sales/:id/table
   * Change sale table
   */
  router.patch('/:id/table', async (req: Request, res: Response) => {
    try {
      const id_venta = parseInt(req.params.id, 10);
      const { nueva_mesa } = req.body;

      if (!nueva_mesa) {
        return res.status(400).json({
          success: false,
          error: 'Falta parámetro requerido: nueva_mesa'
        });
      }

      const result = await salesService.changeSaleTable(id_venta, nueva_mesa);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error changing table:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al cambiar mesa'
      });
    }
  });

  /**
   * PATCH /api/pos/sales/:id/rate
   * Change sale rate/tarifa
   */
  router.patch('/:id/rate', async (req: Request, res: Response) => {
    try {
      const id_venta = parseInt(req.params.id, 10);
      const { id_tarifa } = req.body;

      if (!id_tarifa) {
        return res.status(400).json({
          success: false,
          error: 'Falta parámetro requerido: id_tarifa'
        });
      }

      const result = await salesService.changeSaleRate(id_venta, id_tarifa);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error changing rate:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al cambiar tarifa'
      });
    }
  });

  /**
   * POST /api/pos/sales/:id/finalize
   * Finalize/close sale
   */
  router.post('/:id/finalize', async (req: Request, res: Response) => {
    try {
      const id_venta = parseInt(req.params.id, 10);
      const { forma_pago, importe_pagado, importe_efectivo, importe_tarjeta } = req.body;

      if (!forma_pago || !importe_pagado) {
        return res.status(400).json({
          success: false,
          error: 'Faltan parámetros requeridos: forma_pago, importe_pagado'
        });
      }

      const result = await salesService.finalizeSale(id_venta, {
        forma_pago,
        importe_pagado,
        importe_efectivo,
        importe_tarjeta
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error finalizing sale:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al finalizar venta'
      });
    }
  });

  /**
   * POST /api/pos/sales/:id/park
   * Park/pause sale
   */
  router.post('/:id/park', async (req: Request, res: Response) => {
    try {
      const id_venta = parseInt(req.params.id, 10);

      const result = await salesService.parkSale(id_venta);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error parking sale:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al aparcar venta'
      });
    }
  });

  /**
   * DELETE /api/pos/sales/:id
   * Cancel sale
   */
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const id_venta = parseInt(req.params.id, 10);

      const result = await salesService.cancelSale(id_venta);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error canceling sale:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al cancelar venta'
      });
    }
  });

  /**
   * POST /api/pos/sales/:id/lines/:lineId/served
   * Mark line as served
   */
  router.post('/:id/lines/:lineId/served', async (req: Request, res: Response) => {
    try {
      const id_venta = parseInt(req.params.id, 10);
      const id_linea = parseInt(req.params.lineId, 10);

      const result = await salesService.markLineServed(id_venta, id_linea);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error marking line as served:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al marcar como servido'
      });
    }
  });

  /**
   * GET /api/pos/sales/kitchen/pending
   * Get kitchen pending orders
   */
  router.get('/kitchen/pending', async (req: Request, res: Response) => {
    try {
      const orders = await salesService.getKitchenPending();

      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      console.error('Error fetching kitchen orders:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener pedidos de cocina'
      });
    }
  });

  return router;
}
