import { Router } from 'express';
import { prisma } from '../../config/database';
import { asyncErrorHandler } from '../../common/middleware/error-handler.middleware';
import { toJson } from '../../common/utils/serialization';
import { parseBigIntField, parseOptionalBoolean, parseOptionalBigIntField, parsePagination, parseTableStatus } from './pos.utils';
import { ResourceNotFoundError } from '../../common/errors/typed-errors';

export function createTablesRouter(): Router {
  const router = Router();

  router.get(
    '/',
    asyncErrorHandler(async (req, res) => {
      const { page, limit, skip } = parsePagination(req.query, { page: 1, limit: 100 });
      const isActive = parseOptionalBoolean(req.query.active);
      const roomId = parseOptionalBigIntField(req.query.roomId, 'roomId');
      const status = req.query.status ? parseTableStatus(req.query.status) : undefined;

      const tables = await prisma.table.findMany({
        where: {
          deletedAt: null,
          ...(isActive === undefined ? {} : { isActive }),
          ...(roomId ? { roomId } : {}),
          ...(status ? { status } : {}),
        },
        orderBy: [{ displayOrder: 'asc' }, { tableNumber: 'asc' }],
        skip,
        take: limit,
        include: {
          room: true,
          currentOrder: true,
        },
      });

      res.json(
        toJson({
          page,
          limit,
          data: tables,
        })
      );
    })
  );

  router.patch(
    '/:id/status',
    asyncErrorHandler(async (req, res) => {
      const tableId = parseBigIntField(req.params.id, 'tableId');
      const status = parseTableStatus(req.body.status);
      const currentOrderId = parseOptionalBigIntField(req.body.currentOrderId, 'currentOrderId');

      const table = await prisma.table.findUnique({
        where: { id: tableId },
      });

      if (!table || table.deletedAt) {
        throw new ResourceNotFoundError('table', String(tableId));
      }

      const updated = await prisma.table.update({
        where: { id: tableId },
        data: {
          status,
          currentOrderId: currentOrderId ?? (status === 'available' ? null : table.currentOrderId),
        },
      });

      res.json(toJson(updated));
    })
  );

  return router;
}
