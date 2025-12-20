import { Router } from 'express';
import { Prisma, ShiftStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { asyncErrorHandler } from '../../common/middleware/error-handler.middleware';
import { toJson } from '../../common/utils/serialization';
import {
  parseBigIntField,
  parseDecimalField,
  parseOptionalBigIntField,
  parseOptionalBoolean,
  parsePagination,
  parseShiftStatus,
  parseDrawerEventType,
} from './pos.utils';
import { ResourceNotFoundError, ValidationError } from '../../common/errors/typed-errors';

export function createCashRouter(): Router {
  const router = Router();

  router.get(
    '/cash-registers',
    asyncErrorHandler(async (req, res) => {
      const { page, limit, skip } = parsePagination(req.query, { page: 1, limit: 50 });
      const isActive = parseOptionalBoolean(req.query.active);

      const registers = await prisma.cashRegister.findMany({
        where: {
          deletedAt: null,
          ...(isActive === undefined ? {} : { isActive }),
        },
        orderBy: [{ name: 'asc' }],
        skip,
        take: limit,
      });

      res.json(
        toJson({
          page,
          limit,
          data: registers,
        })
      );
    })
  );

  router.get(
    '/shifts',
    asyncErrorHandler(async (req, res) => {
      const { page, limit, skip } = parsePagination(req.query, { page: 1, limit: 50 });
      const cashRegisterId = parseOptionalBigIntField(req.query.cashRegisterId, 'cashRegisterId');
      const status = req.query.status ? parseShiftStatus(req.query.status) : undefined;

      const shifts = await prisma.cashRegisterShift.findMany({
        where: {
          ...(cashRegisterId ? { cashRegisterId } : {}),
          ...(status ? { status } : {}),
        },
        orderBy: [{ openedAt: 'desc' }],
        skip,
        take: limit,
        include: {
          cashRegister: true,
          openedByUser: true,
          closedByUser: true,
        },
      });

      res.json(
        toJson({
          page,
          limit,
          data: shifts,
        })
      );
    })
  );

  router.get(
    '/shifts/:id',
    asyncErrorHandler(async (req, res) => {
      const shiftId = parseBigIntField(req.params.id, 'shiftId');

      const shift = await prisma.cashRegisterShift.findUnique({
        where: { id: shiftId },
        include: {
          cashRegister: true,
          openedByUser: true,
          closedByUser: true,
          cashDrawerEvents: true,
        },
      });

      if (!shift) {
        throw new ResourceNotFoundError('shift', String(shiftId));
      }

      res.json(toJson(shift));
    })
  );

  router.post(
    '/shifts/open',
    asyncErrorHandler(async (req, res) => {
      const cashRegisterId = parseBigIntField(req.body.cashRegisterId, 'cashRegisterId');
      const openedByUserId = parseBigIntField(req.body.openedByUserId, 'openedByUserId');
      const openingCash = parseDecimalField(req.body.openingCash, 'openingCash');
      const openingNotes = typeof req.body.openingNotes === 'string' ? req.body.openingNotes : undefined;

      const shift = await prisma.$transaction(async (tx) => {
        const cashRegister = await tx.cashRegister.findUnique({ where: { id: cashRegisterId } });
        if (!cashRegister || cashRegister.deletedAt || !cashRegister.isActive) {
          throw new ResourceNotFoundError('cash_register', String(cashRegisterId));
        }

        const employee = await tx.employee.findUnique({ where: { id: openedByUserId } });
        if (!employee || employee.deletedAt || !employee.isActive) {
          throw new ResourceNotFoundError('employee', String(openedByUserId));
        }

        const existing = await tx.cashRegisterShift.findFirst({
          where: {
            cashRegisterId,
            status: ShiftStatus.open,
          },
        });

        if (existing) {
          throw new ValidationError('cash register already has an open shift', {
            cashRegisterId: String(cashRegisterId),
            shiftId: String(existing.id),
          });
        }

        return tx.cashRegisterShift.create({
          data: {
            cashRegisterId,
            openedByUserId,
            openingCash,
            openingNotes,
            openedAt: new Date(),
            status: ShiftStatus.open,
          },
        });
      });

      res.status(201).json(toJson(shift));
    })
  );

  router.post(
    '/shifts/:id/close',
    asyncErrorHandler(async (req, res) => {
      const shiftId = parseBigIntField(req.params.id, 'shiftId');
      const closedByUserId = parseBigIntField(req.body.closedByUserId, 'closedByUserId');
      const closingCash = parseDecimalField(req.body.closingCash, 'closingCash');
      const closingCards = parseDecimalField(req.body.closingCards ?? 0, 'closingCards');
      const closingOther = parseDecimalField(req.body.closingOther ?? 0, 'closingOther');
      const closingNotes = typeof req.body.closingNotes === 'string' ? req.body.closingNotes : undefined;

      const closingTotal = new Prisma.Decimal(closingCash)
        .plus(closingCards)
        .plus(closingOther);

      const shift = await prisma.$transaction(async (tx) => {
        const existing = await tx.cashRegisterShift.findUnique({ where: { id: shiftId } });
        if (!existing) {
          throw new ResourceNotFoundError('shift', String(shiftId));
        }
        if (existing.status !== ShiftStatus.open) {
          throw new ValidationError('shift is already closed', { shiftId: String(shiftId) });
        }

        const employee = await tx.employee.findUnique({ where: { id: closedByUserId } });
        if (!employee || employee.deletedAt || !employee.isActive) {
          throw new ResourceNotFoundError('employee', String(closedByUserId));
        }

        return tx.cashRegisterShift.update({
          where: { id: shiftId },
          data: {
            closedByUserId,
            closingCash,
            closingCards,
            closingOther,
            closingTotal,
            closingNotes,
            closedAt: new Date(),
            status: ShiftStatus.closed,
          },
        });
      });

      res.json(toJson(shift));
    })
  );

  router.post(
    '/shifts/:id/drawer-events',
    asyncErrorHandler(async (req, res) => {
      const shiftId = parseBigIntField(req.params.id, 'shiftId');
      const userId = parseBigIntField(req.body.userId, 'userId');
      const eventType = parseDrawerEventType(req.body.eventType);
      const amount = parseDecimalField(req.body.amount, 'amount');
      const reason = typeof req.body.reason === 'string' ? req.body.reason : undefined;
      const notes = typeof req.body.notes === 'string' ? req.body.notes : undefined;

      if (!reason) {
        throw new ValidationError('reason is required', { field: 'reason' });
      }

      const drawerEvent = await prisma.$transaction(async (tx) => {
        const shift = await tx.cashRegisterShift.findUnique({ where: { id: shiftId } });
        if (!shift) {
          throw new ResourceNotFoundError('shift', String(shiftId));
        }
        if (shift.status !== ShiftStatus.open) {
          throw new ValidationError('shift is closed', { shiftId: String(shiftId) });
        }

        const employee = await tx.employee.findUnique({ where: { id: userId } });
        if (!employee || employee.deletedAt || !employee.isActive) {
          throw new ResourceNotFoundError('employee', String(userId));
        }

        return tx.cashDrawerEvent.create({
          data: {
            shiftId,
            userId,
            eventType,
            amount,
            reason,
            notes,
            occurredAt: new Date(),
          },
        });
      });

      res.status(201).json(toJson(drawerEvent));
    })
  );

  return router;
}
