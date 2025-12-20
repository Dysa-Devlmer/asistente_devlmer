import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { asyncErrorHandler } from '../../common/middleware/error-handler.middleware';
import { toJson } from '../../common/utils/serialization';
import { parseIntegerField } from './pos.utils';

type ValidationReport = {
  generatedAt: string;
  orderTotalsMismatch: {
    count: number;
    sample: Array<{
      orderId: string;
      orderSubtotal: string;
      itemsSubtotal: string;
      orderDiscount: string;
      itemsDiscount: string;
      orderTotal: string;
      itemsTotal: string;
    }>;
  };
  orderItemOrphans: {
    count: number;
    sample: Array<{ orderItemId: string; orderId: string | null; productId: string | null }>;
  };
  paymentOrphans: {
    count: number;
    sample: Array<{ paymentId: string; orderId: string | null; shiftId: string | null; paymentMethodId: string | null; processedByUserId: string | null }>;
  };
  invoiceOrphans: {
    count: number;
    sample: Array<{ invoiceId: string; orderId: string | null; customerId: string | null }>;
  };
};

function formatMarkdown(report: ValidationReport): string {
  const lines: string[] = [];
  lines.push('# Phase 4.2 Validation Report');
  lines.push('');
  lines.push(`Generated at: ${report.generatedAt}`);
  lines.push('');
  lines.push('## Order totals mismatch');
  lines.push(`Count: ${report.orderTotalsMismatch.count}`);
  report.orderTotalsMismatch.sample.slice(0, 10).forEach((row) => {
    lines.push(
      `- orderId=${row.orderId} subtotal=${row.orderSubtotal}/${row.itemsSubtotal} discount=${row.orderDiscount}/${row.itemsDiscount} total=${row.orderTotal}/${row.itemsTotal}`
    );
  });
  lines.push('');
  lines.push('## Order item orphans');
  lines.push(`Count: ${report.orderItemOrphans.count}`);
  report.orderItemOrphans.sample.slice(0, 10).forEach((row) => {
    lines.push(`- orderItemId=${row.orderItemId} orderId=${row.orderId ?? 'null'} productId=${row.productId ?? 'null'}`);
  });
  lines.push('');
  lines.push('## Payment orphans');
  lines.push(`Count: ${report.paymentOrphans.count}`);
  report.paymentOrphans.sample.slice(0, 10).forEach((row) => {
    lines.push(
      `- paymentId=${row.paymentId} orderId=${row.orderId ?? 'null'} shiftId=${row.shiftId ?? 'null'} paymentMethodId=${row.paymentMethodId ?? 'null'} processedByUserId=${row.processedByUserId ?? 'null'}`
    );
  });
  lines.push('');
  lines.push('## Invoice orphans');
  lines.push(`Count: ${report.invoiceOrphans.count}`);
  report.invoiceOrphans.sample.slice(0, 10).forEach((row) => {
    lines.push(`- invoiceId=${row.invoiceId} orderId=${row.orderId ?? 'null'} customerId=${row.customerId ?? 'null'}`);
  });
  lines.push('');
  return lines.join('\n');
}

export function createValidatorsRouter(): Router {
  const router = Router();

  router.get(
    '/consistency',
    asyncErrorHandler(async (req, res) => {
      const format = typeof req.query.format === 'string' ? req.query.format : 'json';
      const limit = req.query.limit ? parseIntegerField(req.query.limit, 'limit', { min: 1 }) : 50;

      const orderTotalsMismatch = await prisma.$queryRaw<Array<{
        orderId: bigint;
        orderSubtotal: Prisma.Decimal;
        itemsSubtotal: Prisma.Decimal;
        orderDiscount: Prisma.Decimal;
        itemsDiscount: Prisma.Decimal;
        orderTotal: Prisma.Decimal;
        itemsTotal: Prisma.Decimal;
      }>>(Prisma.sql`
        SELECT
          o.id AS "orderId",
          o.subtotal AS "orderSubtotal",
          COALESCE(SUM(oi.subtotal), 0) AS "itemsSubtotal",
          o.discount_amount AS "orderDiscount",
          COALESCE(SUM(oi.discount_amount), 0) AS "itemsDiscount",
          o.total_amount AS "orderTotal",
          COALESCE(SUM(oi.total_amount), 0) AS "itemsTotal"
        FROM orders o
        LEFT JOIN order_items oi
          ON oi.order_id = o.id
          AND oi.deleted_at IS NULL
          AND oi.status <> 'cancelled'
        WHERE o.deleted_at IS NULL
        GROUP BY o.id
        HAVING o.subtotal <> COALESCE(SUM(oi.subtotal), 0)
           OR o.discount_amount <> COALESCE(SUM(oi.discount_amount), 0)
           OR o.total_amount <> COALESCE(SUM(oi.total_amount), 0)
        ORDER BY o.id
        LIMIT ${limit}
      `);

      const orderTotalsCount = await prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS count
        FROM (
          SELECT o.id
          FROM orders o
          LEFT JOIN order_items oi
            ON oi.order_id = o.id
            AND oi.deleted_at IS NULL
            AND oi.status <> 'cancelled'
          WHERE o.deleted_at IS NULL
          GROUP BY o.id
          HAVING o.subtotal <> COALESCE(SUM(oi.subtotal), 0)
             OR o.discount_amount <> COALESCE(SUM(oi.discount_amount), 0)
             OR o.total_amount <> COALESCE(SUM(oi.total_amount), 0)
        ) mismatches
      `);

      const orderItemOrphans = await prisma.$queryRaw<Array<{ orderItemId: bigint; orderId: bigint | null; productId: bigint | null }>>(Prisma.sql`
        SELECT oi.id AS "orderItemId", o.id AS "orderId", p.id AS "productId"
        FROM order_items oi
        LEFT JOIN orders o ON o.id = oi.order_id
        LEFT JOIN products p ON p.id = oi.product_id
        WHERE o.id IS NULL OR p.id IS NULL
        ORDER BY oi.id
        LIMIT ${limit}
      `);

      const orderItemOrphansCount = await prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS count
        FROM order_items oi
        LEFT JOIN orders o ON o.id = oi.order_id
        LEFT JOIN products p ON p.id = oi.product_id
        WHERE o.id IS NULL OR p.id IS NULL
      `);

      const paymentOrphans = await prisma.$queryRaw<Array<{
        paymentId: bigint;
        orderId: bigint | null;
        shiftId: bigint | null;
        paymentMethodId: bigint | null;
        processedByUserId: bigint | null;
      }>>(Prisma.sql`
        SELECT p.id AS "paymentId",
               o.id AS "orderId",
               s.id AS "shiftId",
               pm.id AS "paymentMethodId",
               e.id AS "processedByUserId"
        FROM payments p
        LEFT JOIN orders o ON o.id = p.order_id
        LEFT JOIN cash_register_shifts s ON s.id = p.shift_id
        LEFT JOIN payment_methods pm ON pm.id = p.payment_method_id
        LEFT JOIN employees e ON e.id = p.processed_by_user_id
        WHERE o.id IS NULL OR s.id IS NULL OR pm.id IS NULL OR e.id IS NULL
        ORDER BY p.id
        LIMIT ${limit}
      `);

      const paymentOrphansCount = await prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS count
        FROM payments p
        LEFT JOIN orders o ON o.id = p.order_id
        LEFT JOIN cash_register_shifts s ON s.id = p.shift_id
        LEFT JOIN payment_methods pm ON pm.id = p.payment_method_id
        LEFT JOIN employees e ON e.id = p.processed_by_user_id
        WHERE o.id IS NULL OR s.id IS NULL OR pm.id IS NULL OR e.id IS NULL
      `);

      const invoiceOrphans = await prisma.$queryRaw<Array<{ invoiceId: bigint; orderId: bigint | null; customerId: bigint | null }>>(Prisma.sql`
        SELECT i.id AS "invoiceId",
               o.id AS "orderId",
               c.id AS "customerId"
        FROM invoices i
        LEFT JOIN orders o ON o.id = i.order_id
        LEFT JOIN customers c ON c.id = i.customer_id
        WHERE o.id IS NULL OR (i.customer_id IS NOT NULL AND c.id IS NULL)
        ORDER BY i.id
        LIMIT ${limit}
      `);

      const invoiceOrphansCount = await prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS count
        FROM invoices i
        LEFT JOIN orders o ON o.id = i.order_id
        LEFT JOIN customers c ON c.id = i.customer_id
        WHERE o.id IS NULL OR (i.customer_id IS NOT NULL AND c.id IS NULL)
      `);

      const report: ValidationReport = {
        generatedAt: new Date().toISOString(),
        orderTotalsMismatch: {
          count: Number(orderTotalsCount[0]?.count ?? 0),
          sample: orderTotalsMismatch.map((row) => ({
            orderId: row.orderId.toString(),
            orderSubtotal: row.orderSubtotal.toString(),
            itemsSubtotal: row.itemsSubtotal.toString(),
            orderDiscount: row.orderDiscount.toString(),
            itemsDiscount: row.itemsDiscount.toString(),
            orderTotal: row.orderTotal.toString(),
            itemsTotal: row.itemsTotal.toString(),
          })),
        },
        orderItemOrphans: {
          count: Number(orderItemOrphansCount[0]?.count ?? 0),
          sample: orderItemOrphans.map((row) => ({
            orderItemId: row.orderItemId.toString(),
            orderId: row.orderId ? row.orderId.toString() : null,
            productId: row.productId ? row.productId.toString() : null,
          })),
        },
        paymentOrphans: {
          count: Number(paymentOrphansCount[0]?.count ?? 0),
          sample: paymentOrphans.map((row) => ({
            paymentId: row.paymentId.toString(),
            orderId: row.orderId ? row.orderId.toString() : null,
            shiftId: row.shiftId ? row.shiftId.toString() : null,
            paymentMethodId: row.paymentMethodId ? row.paymentMethodId.toString() : null,
            processedByUserId: row.processedByUserId ? row.processedByUserId.toString() : null,
          })),
        },
        invoiceOrphans: {
          count: Number(invoiceOrphansCount[0]?.count ?? 0),
          sample: invoiceOrphans.map((row) => ({
            invoiceId: row.invoiceId.toString(),
            orderId: row.orderId ? row.orderId.toString() : null,
            customerId: row.customerId ? row.customerId.toString() : null,
          })),
        },
      };

      if (format === 'md' || format === 'markdown') {
        res.setHeader('content-type', 'text/markdown');
        res.send(formatMarkdown(report));
        return;
      }

      res.json(toJson(report));
    })
  );

  return router;
}
