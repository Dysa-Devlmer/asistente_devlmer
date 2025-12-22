/**
 * Kitchen Routes
 * REST API endpoints for kitchen operations
 */

import { Router, Request, Response } from 'express';
import { KitchenService } from '../services/KitchenService';
import { WebSocketService } from '../../../services/WebSocketService';

export function createKitchenRoutes(wsService?: WebSocketService): Router {
  const router = Router();
  const kitchenService = new KitchenService();

  /**
   * GET /api/pos/kitchen/items
   * Get all pending kitchen items
   */
  router.get('/items', async (req: Request, res: Response) => {
    try {
      const station = req.query.station ? parseInt(req.query.station as string, 10) : undefined;
      const mesa = req.query.mesa as string | undefined;

      const result = await kitchenService.getPendingItems({
        station,
        mesa,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('[KitchenRoutes] Error getting pending items:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener items de cocina',
      });
    }
  });

  /**
   * POST /api/pos/kitchen/items/:id_venta/:id_linea/mark-served
   * Mark an item (or partial quantity) as served
   */
  router.post('/items/:id_venta/:id_linea/mark-served', async (req: Request, res: Response) => {
    try {
      const id_venta = parseInt(req.params.id_venta, 10);
      const id_linea = parseInt(req.params.id_linea, 10);
      const quantity = req.body.quantity ? parseInt(req.body.quantity, 10) : undefined;

      if (isNaN(id_venta) || isNaN(id_linea)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid id_venta or id_linea',
        });
      }

      if (quantity !== undefined && (isNaN(quantity) || quantity <= 0)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid quantity',
        });
      }

      const result = await kitchenService.markItemServed(id_venta, id_linea, quantity);

      // Emit WebSocket event to kitchen and POS clients
      if (wsService) {
        // Get item details to determine station
        const item = await kitchenService.getItemById(id_venta, id_linea);

        if (item) {
          // Emit to kitchen displays
          wsService.emitKitchenEvent(
            'kitchen:item_served',
            {
              id_venta,
              id_linea,
              served_qty: result.newServed,
              remaining_qty: result.remaining,
            },
            item.bloque_cocina
          );

          // Emit to POS terminals
          wsService.emitPOSEvent(
            'pos:item_served',
            {
              id_venta,
              id_linea,
              served_qty: result.newServed,
              remaining_qty: result.remaining,
            },
            item.num_mesa
          );
        }
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('[KitchenRoutes] Error marking item served:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al marcar item como servido',
      });
    }
  });

  /**
   * POST /api/pos/kitchen/items/mark-all-served
   * Mark all items from an order as served
   */
  router.post('/items/mark-all-served', async (req: Request, res: Response) => {
    try {
      const id_venta = parseInt(req.body.id_venta, 10);
      const bloque_cocina = req.body.bloque_cocina
        ? parseInt(req.body.bloque_cocina, 10)
        : undefined;

      if (isNaN(id_venta)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid id_venta',
        });
      }

      const itemsUpdated = await kitchenService.markAllServed(id_venta, bloque_cocina);

      // Emit WebSocket event
      if (wsService) {
        wsService.emitKitchenEvent(
          'kitchen:order_completed',
          {
            id_venta,
            bloque_cocina,
            items_updated: itemsUpdated,
          },
          bloque_cocina
        );

        wsService.emitPOSEvent('pos:order_updated', {
          id_venta,
          action: 'items_served',
        });
      }

      res.json({
        success: true,
        data: {
          id_venta,
          itemsUpdated,
        },
      });
    } catch (error) {
      console.error('[KitchenRoutes] Error marking all served:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al marcar todos los items',
      });
    }
  });

  /**
   * GET /api/pos/kitchen/stats
   * Get kitchen statistics
   */
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const stats = await kitchenService.getStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('[KitchenRoutes] Error getting stats:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener estadísticas',
      });
    }
  });

  /**
   * GET /api/pos/kitchen/items/order/:id_venta
   * Get all kitchen items for a specific order
   */
  router.get('/items/order/:id_venta', async (req: Request, res: Response) => {
    try {
      const id_venta = parseInt(req.params.id_venta, 10);

      if (isNaN(id_venta)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid id_venta',
        });
      }

      const items = await kitchenService.getItemsByOrder(id_venta);

      res.json({
        success: true,
        data: items,
      });
    } catch (error) {
      console.error('[KitchenRoutes] Error getting order items:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener items del pedido',
      });
    }
  });

  /**
   * POST /api/pos/kitchen/initialize
   * Initialize kitchen module (add servido_cocina field if missing)
   */
  router.post('/initialize', async (req: Request, res: Response) => {
    try {
      await kitchenService.initialize();

      res.json({
        success: true,
        message: 'Kitchen module initialized successfully',
      });
    } catch (error) {
      console.error('[KitchenRoutes] Error initializing kitchen module:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al inicializar módulo de cocina',
      });
    }
  });

  /**
   * GET /api/pos/kitchen/validate
   * Validate that database has required fields
   */
  router.get('/validate', async (req: Request, res: Response) => {
    try {
      const isValid = await kitchenService.validateDatabase();

      res.json({
        success: true,
        data: {
          isValid,
          message: isValid
            ? 'Database is valid'
            : 'Database missing required fields. Run /initialize endpoint.',
        },
      });
    } catch (error) {
      console.error('[KitchenRoutes] Error validating database:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al validar base de datos',
      });
    }
  });

  return router;
}
