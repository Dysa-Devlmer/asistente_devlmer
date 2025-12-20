# Phase 4.1 - Backend Runtime (POS API)

Goal: expose a minimal, operational POS API on top of the migrated PostgreSQL data.

Constraints:
- No Docker
- No external services
- No ETL changes
- No Prisma schema changes

## Base URL
- `/api`

## Endpoints (initial)

### Products
- `GET /api/products`
  - Query: `active`, `categoryId`, `search`, `page`, `limit`

### Tables
- `GET /api/tables`
  - Query: `active`, `roomId`, `status`, `page`, `limit`
- `PATCH /api/tables/:id/status`
  - Body: `status`, `currentOrderId` (optional)

### Orders
- `GET /api/orders`
  - Query: `status`, `tableId`, `shiftId`, `page`, `limit`
- `GET /api/orders/:id`
- `POST /api/orders`
  - Body: `tableId`, `waiterId`, `shiftId`, `guestCount` (optional), `notes` (optional)
- `PATCH /api/orders/:id`
  - Body: `status` (optional), `guestCount` (optional), `notes` (optional), `cancellationReason` (optional)
- `POST /api/orders/:id/items`
  - Body: `productId`, `quantity` (optional), `unitPrice` (optional), `discountPercentage` (optional), `discountAmount` (optional), `notes` (optional)
- `PATCH /api/orders/items/:id`
  - Body: `status` (optional), `notes` (optional), `cancellationReason` (optional)

### Cash flow
- `GET /api/cash-registers`
  - Query: `active`, `page`, `limit`
- `GET /api/shifts`
  - Query: `cashRegisterId`, `status`, `page`, `limit`
- `GET /api/shifts/:id`
- `POST /api/shifts/open`
  - Body: `cashRegisterId`, `openedByUserId`, `openingCash`, `openingNotes` (optional)
- `POST /api/shifts/:id/close`
  - Body: `closedByUserId`, `closingCash`, `closingCards` (optional), `closingOther` (optional), `closingNotes` (optional)
- `POST /api/shifts/:id/drawer-events`
  - Body: `userId`, `eventType`, `amount`, `reason`, `notes` (optional)

## Notes
- BigInt IDs are returned as strings in JSON responses.
- Order totals are recalculated after item changes.
