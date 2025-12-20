import { Router } from 'express';
import { prisma } from '../../config/database';
import { asyncErrorHandler } from '../../common/middleware/error-handler.middleware';
import { toJson } from '../../common/utils/serialization';
import { parseBigIntField, parseDecimalField, parsePagination } from './pos.utils';
import { ResourceNotFoundError, ValidationError } from '../../common/errors/typed-errors';

export function createPaymentsRouter(): Router {
  const router = Router();

  router.get(
    '/',
    asyncErrorHandler(async (req, res) => {
      const { page, limit, skip } = parsePagination(req.query, { page: 1, limit: 50 });
      const orderId = req.query.orderId ? parseBigIntField(req.query.orderId, 'orderId') : undefined;

      const payments = await prisma.payment.findMany({
        where: {
          ...(orderId ? { orderId } : {}),
        },
        orderBy: [{ paidAt: 'desc' }],
        skip,
        take: limit,
        include: {
          order: true,
          paymentMethod: true,
          shift: true,
          processedByUser: true,
        },
      });

      res.json(
        toJson({
          page,
          limit,
          data: payments,
        })
      );
    })
  );

  router.get(
    '/:id',
    asyncErrorHandler(async (req, res) => {
      const paymentId = parseBigIntField(req.params.id, 'paymentId');

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          order: true,
          paymentMethod: true,
          shift: true,
          processedByUser: true,
        },
      });

      if (!payment) {
        throw new ResourceNotFoundError('payment', String(paymentId));
      }

      res.json(toJson(payment));
    })
  );

  router.get(
    '/order/:orderId',
    asyncErrorHandler(async (req, res) => {
      const orderId = parseBigIntField(req.params.orderId, 'orderId');

      const payments = await prisma.payment.findMany({
        where: { orderId },
        orderBy: [{ paidAt: 'desc' }],
        include: {
          paymentMethod: true,
          shift: true,
          processedByUser: true,
        },
      });

      res.json(toJson(payments));
    })
  );

  router.post(
    '/',
    asyncErrorHandler(async (req, res) => {
      const orderId = parseBigIntField(req.body.orderId, 'orderId');
      const paymentMethodId = parseBigIntField(req.body.paymentMethodId, 'paymentMethodId');
      const shiftId = parseBigIntField(req.body.shiftId, 'shiftId');
      const processedByUserId = parseBigIntField(req.body.processedByUserId, 'processedByUserId');
      const amount = parseDecimalField(req.body.amount, 'amount');
      const referenceNumber = typeof req.body.referenceNumber === 'string' ? req.body.referenceNumber : undefined;
      const notes = typeof req.body.notes === 'string' ? req.body.notes : undefined;

      if (amount.lte(0)) {
        throw new ValidationError('amount must be greater than 0', { amount: amount.toString() });
      }

      const payment = await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { id: orderId } });
        if (!order || order.deletedAt) {
          throw new ResourceNotFoundError('order', String(orderId));
        }
        if (order.status === 'cancelled') {
          throw new ValidationError('cannot pay a cancelled order', { orderId: String(orderId) });
        }

        const shift = await tx.cashRegisterShift.findUnique({ where: { id: shiftId } });
        if (!shift) {
          throw new ResourceNotFoundError('shift', String(shiftId));
        }
        if (shift.status !== 'open') {
          throw new ValidationError('shift is not open', { shiftId: String(shiftId) });
        }

        const paymentMethod = await tx.paymentMethod.findUnique({ where: { id: paymentMethodId } });
        if (!paymentMethod || paymentMethod.deletedAt || !paymentMethod.isActive) {
          throw new ResourceNotFoundError('payment_method', String(paymentMethodId));
        }

        const employee = await tx.employee.findUnique({ where: { id: processedByUserId } });
        if (!employee || employee.deletedAt || !employee.isActive) {
          throw new ResourceNotFoundError('employee', String(processedByUserId));
        }

        return tx.payment.create({
          data: {
            orderId,
            paymentMethodId,
            shiftId,
            processedByUserId,
            amount,
            referenceNumber,
            notes,
            paidAt: new Date(),
          },
        });
      });

      res.status(201).json(toJson(payment));
    })
  );

  return router;
}
