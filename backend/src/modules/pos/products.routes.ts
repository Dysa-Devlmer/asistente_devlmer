import { Router } from 'express';
import { prisma } from '../../config/database';
import { asyncErrorHandler } from '../../common/middleware/error-handler.middleware';
import { toJson } from '../../common/utils/serialization';
import { parseOptionalBoolean, parseOptionalBigIntField, parsePagination } from './pos.utils';

export function createProductsRouter(): Router {
  const router = Router();

  router.get(
    '/',
    asyncErrorHandler(async (req, res) => {
      const { page, limit, skip } = parsePagination(req.query, { page: 1, limit: 100 });
      const isActive = parseOptionalBoolean(req.query.active);
      const categoryId = parseOptionalBigIntField(req.query.categoryId, 'categoryId');
      const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;

      const products = await prisma.product.findMany({
        where: {
          deletedAt: null,
          ...(isActive === undefined ? {} : { isActive }),
          ...(categoryId ? { categoryId } : {}),
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { sku: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        skip,
        take: limit,
        include: {
          category: true,
        },
      });

      res.json(
        toJson({
          page,
          limit,
          data: products,
        })
      );
    })
  );

  return router;
}
