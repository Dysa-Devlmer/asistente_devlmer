/**
 * Tables Routes
 * API endpoints for table management
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { TablesRepository } from '../repositories/TablesRepository';
import { TablesService } from '../services/TablesService';

export function createTablesRouter(pool: Pool): Router {
  const router = Router();
  const tablesRepo = new TablesRepository(pool);
  const tablesService = new TablesService(tablesRepo);

  /**
   * GET /api/pos/tables
   * Get all tables with current status
   * Query params:
   *   - id_salon: Filter by salon (optional)
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const { id_salon } = req.query;

      const tables = await tablesService.getAllTables(
        id_salon as string | undefined
      );

      res.json({
        success: true,
        data: tables
      });
    } catch (error) {
      console.error('Error fetching tables:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener mesas',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/pos/tables/by-salon
   * Get tables grouped by salon
   */
  router.get('/by-salon', async (req: Request, res: Response) => {
    try {
      const tablesBySalon = await tablesService.getTablesBySalon();

      res.json({
        success: true,
        data: tablesBySalon
      });
    } catch (error) {
      console.error('Error fetching tables by salon:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener mesas por salón',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/pos/tables/stats
   * Get table statistics
   */
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const stats = await tablesService.getTableStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching table stats:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener estadísticas de mesas',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/pos/tables/:num_mesa
   * Get specific table by number
   */
  router.get('/:num_mesa', async (req: Request, res: Response) => {
    try {
      const { num_mesa } = req.params;

      const table = await tablesService.getTableByNumber(num_mesa);

      if (!table) {
        return res.status(404).json({
          success: false,
          error: 'Mesa no encontrada'
        });
      }

      res.json({
        success: true,
        data: table
      });
    } catch (error) {
      console.error('Error fetching table:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener mesa',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/pos/tables/:num_mesa/can-open
   * Check if table can be used for new sale
   */
  router.get('/:num_mesa/can-open', async (req: Request, res: Response) => {
    try {
      const { num_mesa } = req.params;

      const result = await tablesService.canOpenSale(num_mesa);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error checking table availability:', error);
      res.status(500).json({
        success: false,
        error: 'Error al verificar disponibilidad de mesa',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/pos/tables/:num_mesa/rate
   * Get table's pricing rate
   */
  router.get('/:num_mesa/rate', async (req: Request, res: Response) => {
    try {
      const { num_mesa } = req.params;

      const rate = await tablesService.getTableRate(num_mesa);

      if (!rate) {
        return res.json({
          success: true,
          data: {
            id_tarifa: null,
            nombre: 'Default'
          }
        });
      }

      res.json({
        success: true,
        data: rate
      });
    } catch (error) {
      console.error('Error fetching table rate:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener tarifa de mesa',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}
