import { Router } from 'express';
import { prisma } from '../../config/database';
import { asyncErrorHandler } from '../../common/middleware/error-handler.middleware';
import { toJson } from '../../common/utils/serialization';
import { parseBigIntField, parseDocumentType } from './pos.utils';
import { ResourceNotFoundError, ValidationError } from '../../common/errors/typed-errors';

export function createInvoicesRouter(): Router {
  const router = Router();

  router.get(
    '/:id',
    asyncErrorHandler(async (req, res) => {
      const invoiceId = parseBigIntField(req.params.id, 'invoiceId');
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          order: true,
          customer: true,
        },
      });

      if (!invoice) {
        throw new ResourceNotFoundError('invoice', String(invoiceId));
      }

      res.json(toJson(invoice));
    })
  );

  router.get(
    '/order/:orderId',
    asyncErrorHandler(async (req, res) => {
      const orderId = parseBigIntField(req.params.orderId, 'orderId');
      const invoices = await prisma.invoice.findMany({
        where: { orderId },
        orderBy: [{ issuedAt: 'desc' }],
        include: {
          customer: true,
        },
      });

      res.json(toJson(invoices));
    })
  );

  router.post(
    '/',
    asyncErrorHandler(async (req, res) => {
      const orderId = parseBigIntField(req.body.orderId, 'orderId');
      const documentType = parseDocumentType(req.body.documentType);
      const series = typeof req.body.series === 'string' ? req.body.series.trim() : '';
      const documentNumber = typeof req.body.documentNumber === 'string' ? req.body.documentNumber.trim() : '';
      const customerId = req.body.customerId ? parseBigIntField(req.body.customerId, 'customerId') : undefined;
      const notes = typeof req.body.notes === 'string' ? req.body.notes : undefined;

      if (!series || !documentNumber) {
        throw new ValidationError('series and documentNumber are required', {
          series,
          documentNumber,
        });
      }

      const invoice = await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { id: orderId } });
        if (!order || order.deletedAt) {
          throw new ResourceNotFoundError('order', String(orderId));
        }
        if (order.status !== 'closed') {
          throw new ValidationError('order must be closed before invoicing', { orderId: String(orderId) });
        }

        const existingInvoice = await tx.invoice.findFirst({
          where: { orderId },
        });
        if (existingInvoice) {
          throw new ValidationError('order already has an invoice', { orderId: String(orderId) });
        }

        if (customerId) {
          const customer = await tx.customer.findUnique({ where: { id: customerId } });
          if (!customer || customer.deletedAt || !customer.isActive) {
            throw new ResourceNotFoundError('customer', String(customerId));
          }
        }

        return tx.invoice.create({
          data: {
            orderId,
            customerId,
            documentType,
            series,
            documentNumber,
            subtotal: order.subtotal,
            taxAmount: order.taxAmount,
            totalAmount: order.totalAmount,
            notes,
            issuedAt: new Date(),
          },
        });
      });

      res.status(201).json(toJson(invoice));
    })
  );

  return router;
}
