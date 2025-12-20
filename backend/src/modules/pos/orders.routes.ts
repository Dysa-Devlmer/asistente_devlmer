import { Router } from 'express';
import { Prisma, OrderStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { asyncErrorHandler } from '../../common/middleware/error-handler.middleware';
import { toJson } from '../../common/utils/serialization';
import {
  parseBigIntField,
  parseDecimalField,
  parseIntegerField,
  parseOptionalBigIntField,
  parseOptionalDecimalField,
  parseOrderItemStatus,
  parseOrderStatus,
  parsePagination,
} from './pos.utils';
import { ResourceNotFoundError, ValidationError } from '../../common/errors/typed-errors';

type PrismaTx = Prisma.TransactionClient;

async function generateOrderNumber(tx: PrismaTx): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
    const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const orderNumber = `${timestamp}${suffix}`;
    const existing = await tx.order.findUnique({ where: { orderNumber } });
    if (!existing) {
      return orderNumber;
    }
  }
  throw new ValidationError('unable to generate unique order number');
}

function toDecimalOrZero(value: Prisma.Decimal | null | undefined): Prisma.Decimal {
  return value ?? new Prisma.Decimal(0);
}

async function recalcOrderTotals(tx: PrismaTx, orderId: bigint) {
  const aggregate = await tx.orderItem.aggregate({
    where: {
      orderId,
      deletedAt: null,
      status: { not: 'cancelled' },
    },
    _sum: {
      subtotal: true,
      discountAmount: true,
      totalAmount: true,
    },
  });

  const subtotal = toDecimalOrZero(aggregate._sum.subtotal);
  const discountAmount = toDecimalOrZero(aggregate._sum.discountAmount);
  const totalAmount = toDecimalOrZero(aggregate._sum.totalAmount);
  const taxAmount = totalAmount.minus(subtotal).plus(discountAmount);

  return {
    subtotal,
    discountAmount,
    taxAmount,
    totalAmount,
  };
}

export function createOrdersRouter(): Router {
  const router = Router();

  router.get(
    '/',
    asyncErrorHandler(async (req, res) => {
      const { page, limit, skip } = parsePagination(req.query, { page: 1, limit: 50 });
      const status = req.query.status ? parseOrderStatus(req.query.status) : undefined;
      const tableId = parseOptionalBigIntField(req.query.tableId, 'tableId');
      const shiftId = parseOptionalBigIntField(req.query.shiftId, 'shiftId');

      const orders = await prisma.order.findMany({
        where: {
          deletedAt: null,
          ...(status ? { status } : {}),
          ...(tableId ? { tableId } : {}),
          ...(shiftId ? { shiftId } : {}),
        },
        orderBy: [{ openedAt: 'desc' }],
        skip,
        take: limit,
        include: {
          table: true,
          waiter: true,
          shift: true,
        },
      });

      res.json(
        toJson({
          page,
          limit,
          data: orders,
        })
      );
    })
  );

  router.get(
    '/:id',
    asyncErrorHandler(async (req, res) => {
      const orderId = parseBigIntField(req.params.id, 'orderId');
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          table: true,
          waiter: true,
          shift: true,
          orderItems: {
            where: { deletedAt: null },
            include: {
              product: true,
            },
          },
        },
      });

      if (!order || order.deletedAt) {
        throw new ResourceNotFoundError('order', String(orderId));
      }

      res.json(toJson(order));
    })
  );

  router.post(
    '/',
    asyncErrorHandler(async (req, res) => {
      const tableId = parseBigIntField(req.body.tableId, 'tableId');
      const waiterId = parseBigIntField(req.body.waiterId, 'waiterId');
      const shiftId = parseBigIntField(req.body.shiftId, 'shiftId');
      const guestCount = req.body.guestCount ? parseIntegerField(req.body.guestCount, 'guestCount', { min: 1 }) : 1;
      const notes = typeof req.body.notes === 'string' ? req.body.notes : undefined;

      const order = await prisma.$transaction(async (tx) => {
        const table = await tx.table.findUnique({ where: { id: tableId } });
        if (!table || table.deletedAt) {
          throw new ResourceNotFoundError('table', String(tableId));
        }
        if (!table.isActive || table.status === 'out_of_service') {
          throw new ValidationError('table is not available', { tableId: String(tableId) });
        }
        if (table.currentOrderId) {
          throw new ValidationError('table already has an active order', { tableId: String(tableId) });
        }

        const waiter = await tx.employee.findUnique({ where: { id: waiterId } });
        if (!waiter || waiter.deletedAt || !waiter.isActive) {
          throw new ResourceNotFoundError('waiter', String(waiterId));
        }

        const shift = await tx.cashRegisterShift.findUnique({ where: { id: shiftId } });
        if (!shift || shift.status !== 'open') {
          throw new ValidationError('shift is not open', { shiftId: String(shiftId) });
        }

        const orderNumber = await generateOrderNumber(tx);

        const created = await tx.order.create({
          data: {
            orderNumber,
            tableId,
            waiterId,
            shiftId,
            guestCount,
            notes,
            openedAt: new Date(),
            status: OrderStatus.open,
          },
        });

        await tx.table.update({
          where: { id: tableId },
          data: {
            status: 'occupied',
            currentOrderId: created.id,
          },
        });

        return created;
      });

      res.status(201).json(toJson(order));
    })
  );

  router.patch(
    '/:id',
    asyncErrorHandler(async (req, res) => {
      const orderId = parseBigIntField(req.params.id, 'orderId');
      const status = req.body.status ? parseOrderStatus(req.body.status) : undefined;
      const notes = typeof req.body.notes === 'string' ? req.body.notes : undefined;
      const guestCount = req.body.guestCount ? parseIntegerField(req.body.guestCount, 'guestCount', { min: 1 }) : undefined;
      const cancellationReason = typeof req.body.cancellationReason === 'string' ? req.body.cancellationReason : undefined;

      const updated = await prisma.$transaction(async (tx) => {
        const existing = await tx.order.findUnique({ where: { id: orderId } });
        if (!existing || existing.deletedAt) {
          throw new ResourceNotFoundError('order', String(orderId));
        }

        const updates: Prisma.OrderUpdateInput = {
          ...(status ? { status } : {}),
          ...(notes !== undefined ? { notes } : {}),
          ...(guestCount !== undefined ? { guestCount } : {}),
        };

        if (status === 'sent_to_kitchen') {
          updates.sentToKitchenAt = existing.sentToKitchenAt ?? new Date();
        }

        if (status === 'closed') {
          updates.closedAt = existing.closedAt ?? new Date();
        }

        if (status === 'cancelled') {
          updates.cancelledAt = existing.cancelledAt ?? new Date();
          updates.cancellationReason = cancellationReason ?? existing.cancellationReason;
        }

        const order = await tx.order.update({
          where: { id: orderId },
          data: updates,
        });

        if (status === 'closed' || status === 'cancelled') {
          await tx.table.update({
            where: { id: order.tableId },
            data: {
              status: 'available',
              currentOrderId: null,
            },
          });
        }

        return order;
      });

      res.json(toJson(updated));
    })
  );

  router.post(
    '/:id/items',
    asyncErrorHandler(async (req, res) => {
      const orderId = parseBigIntField(req.params.id, 'orderId');
      const productId = parseBigIntField(req.body.productId, 'productId');
      const quantity = parseDecimalField(req.body.quantity ?? 1, 'quantity');
      const unitPrice = parseOptionalDecimalField(req.body.unitPrice);
      const discountPercentage = parseOptionalDecimalField(req.body.discountPercentage);
      const discountAmountInput = parseOptionalDecimalField(req.body.discountAmount);
      const notes = typeof req.body.notes === 'string' ? req.body.notes : undefined;

      const result = await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { id: orderId } });
        if (!order || order.deletedAt) {
          throw new ResourceNotFoundError('order', String(orderId));
        }
        if (order.status === 'closed' || order.status === 'cancelled') {
          throw new ValidationError('order is not open', { orderId: String(orderId) });
        }

        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product || product.deletedAt || !product.isActive) {
          throw new ResourceNotFoundError('product', String(productId));
        }

        const price = unitPrice ?? new Prisma.Decimal(product.basePrice);
        const subtotal = price.mul(quantity);

        let discountAmount = new Prisma.Decimal(0);
        if (discountAmountInput) {
          discountAmount = discountAmountInput;
        } else if (discountPercentage) {
          discountAmount = subtotal.mul(discountPercentage).div(100);
        }

        const taxableBase = subtotal.minus(discountAmount);
        const taxRate = product.isTaxable ? new Prisma.Decimal(product.taxRate) : new Prisma.Decimal(0);
        const taxAmount = taxableBase.mul(taxRate).div(100);
        const totalAmount = taxableBase.plus(taxAmount);

        const orderItem = await tx.orderItem.create({
          data: {
            orderId,
            productId,
            quantity,
            unitPrice: price,
            subtotal,
            discountAmount,
            discountPercentage: discountPercentage ?? new Prisma.Decimal(0),
            totalAmount,
            notes,
          },
        });

        const totals = await recalcOrderTotals(tx, orderId);
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: totals,
        });

        return { orderItem, order: updatedOrder };
      });

      res.status(201).json(toJson(result));
    })
  );

  router.patch(
    '/items/:id',
    asyncErrorHandler(async (req, res) => {
      const orderItemId = parseBigIntField(req.params.id, 'orderItemId');
      const status = req.body.status ? parseOrderItemStatus(req.body.status) : undefined;
      const notes = typeof req.body.notes === 'string' ? req.body.notes : undefined;
      const cancellationReason = typeof req.body.cancellationReason === 'string' ? req.body.cancellationReason : undefined;

      const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.orderItem.findUnique({ where: { id: orderItemId } });
        if (!existing || existing.deletedAt) {
          throw new ResourceNotFoundError('order_item', String(orderItemId));
        }

        const updates: Prisma.OrderItemUpdateInput = {
          ...(status ? { status } : {}),
          ...(notes !== undefined ? { notes } : {}),
          ...(cancellationReason !== undefined ? { cancellationReason } : {}),
        };

        if (status === 'sent_to_kitchen') {
          updates.sentToKitchenAt = existing.sentToKitchenAt ?? new Date();
        }
        if (status === 'in_preparation') {
          updates.preparedAt = existing.preparedAt ?? new Date();
        }
        if (status === 'delivered') {
          updates.deliveredAt = existing.deliveredAt ?? new Date();
        }
        if (status === 'cancelled') {
          updates.cancelledAt = existing.cancelledAt ?? new Date();
        }

        const updatedItem = await tx.orderItem.update({
          where: { id: orderItemId },
          data: updates,
        });

        const totals = await recalcOrderTotals(tx, updatedItem.orderId);
        await tx.order.update({
          where: { id: updatedItem.orderId },
          data: totals,
        });

        return updatedItem;
      });

      res.json(toJson(result));
    })
  );

  router.delete(
    '/items/:id',
    asyncErrorHandler(async (req, res) => {
      const orderItemId = parseBigIntField(req.params.id, 'orderItemId');
      const cancellationReason = typeof req.body?.cancellationReason === 'string'
        ? req.body.cancellationReason
        : undefined;

      const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.orderItem.findUnique({ where: { id: orderItemId } });
        if (!existing || existing.deletedAt) {
          throw new ResourceNotFoundError('order_item', String(orderItemId));
        }

        const order = await tx.order.findUnique({ where: { id: existing.orderId } });
        if (!order || order.deletedAt) {
          throw new ResourceNotFoundError('order', String(existing.orderId));
        }
        if (order.status === 'closed' || order.status === 'cancelled') {
          throw new ValidationError('order is not open', { orderId: String(order.id) });
        }

        const deletedItem = await tx.orderItem.update({
          where: { id: orderItemId },
          data: {
            status: 'cancelled',
            cancelledAt: new Date(),
            cancellationReason: cancellationReason ?? existing.cancellationReason,
            deletedAt: new Date(),
          },
        });

        const totals = await recalcOrderTotals(tx, existing.orderId);
        await tx.order.update({
          where: { id: existing.orderId },
          data: totals,
        });

        return deletedItem;
      });

      res.json(toJson(result));
    })
  );

  return router;
}
