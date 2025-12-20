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
- `DELETE /api/orders/items/:id`
  - Body: `cancellationReason` (optional)

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

### Payments (Phase 4.2)
- `GET /api/payments`
  - Query: `orderId` (optional), `page`, `limit`
- `GET /api/payments/:id`
- `GET /api/payments/order/:orderId`
- `POST /api/payments`
  - Body: `orderId`, `paymentMethodId`, `shiftId`, `processedByUserId`, `amount`, `referenceNumber` (optional), `notes` (optional)

### Invoices (Phase 4.2)
- `GET /api/invoices/:id`
- `GET /api/invoices/order/:orderId`
- `POST /api/invoices`
  - Body: `orderId`, `documentType`, `series`, `documentNumber`, `customerId` (optional), `notes` (optional)

### Validators (Phase 4.2)
- `GET /api/validators/consistency`
  - Query: `format` (json|md), `limit`

## Notes
- BigInt IDs are returned as strings in JSON responses.
- Order totals are recalculated after item changes.
- Payments require an open shift (`shiftId` must reference a shift with status `open`).
- Invoices are allowed only for orders in status `closed`.

## Smoke test (2025-12-20)

Environment:
- Command: `scripts\\start-db.bat`
- Command: `cd backend && npm run dev`
- DB: local embedded PostgreSQL on port 5432

Setup findings:
- Existing open shift on cash register 1 blocked `/api/shifts/open` with `VALIDATION_ERROR` ("cash register already has an open shift").
- Runtime startup initially failed because `uuid` dependency was missing. Fixed by switching to Node `crypto.randomUUID` in the structured logger.
- Added `DELETE /api/orders/items/:id` to support item removal.

Requests and responses (samples):

1) List products
```
GET http://localhost:3000/api/products?limit=1
```
Response:
```json
{
  "page": 1,
  "limit": 1,
  "data": [
    {
      "id": "9",
      "sku": "PROD-000035",
      "name": "*Amaretto Sour",
      "basePrice": "2500",
      "isActive": true,
      "category": {
        "id": "4",
        "code": "0027",
        "name": "***Aperitivos"
      }
    }
  ]
}
```

2) List tables (available)
```
GET http://localhost:3000/api/tables?limit=1&status=available
```
Response:
```json
{
  "page": 1,
  "limit": 1,
  "data": [
    {
      "id": "62",
      "tableNumber": "MESA_SISTEMA",
      "status": "available",
      "currentOrderId": null,
      "room": {
        "id": "1",
        "code": "SALON",
        "name": "Salon"
      }
    }
  ]
}
```

3) List open shift (used in test)
```
GET http://localhost:3000/api/shifts?status=open
```
Response:
```json
{
  "page": 1,
  "limit": 50,
  "data": [
    {
      "id": "84",
      "cashRegisterId": "1",
      "status": "open",
      "openedByUser": {
        "id": "11",
        "employeeCode": "SYSTEM_CASHIER"
      }
    }
  ]
}
```

4) Create order
```
POST http://localhost:3000/api/orders
{
  "tableId": 62,
  "waiterId": 1,
  "shiftId": 84,
  "guestCount": 2,
  "notes": "smoke test order"
}
```
Response:
```json
{
  "id": "8034",
  "orderNumber": "202512200309022974",
  "status": "open",
  "subtotal": "0",
  "totalAmount": "0"
}
```

5) Add item
```
POST http://localhost:3000/api/orders/8034/items
{
  "productId": 9,
  "quantity": 1,
  "notes": "sin hielo"
}
```
Response:
```json
{
  "orderItem": {
    "id": "35615",
    "status": "pending",
    "totalAmount": "2950"
  },
  "order": {
    "id": "8034",
    "subtotal": "2500",
    "taxAmount": "450",
    "totalAmount": "2950"
  }
}
```

6) Update item (status)
```
PATCH http://localhost:3000/api/orders/items/35615
{
  "status": "sent_to_kitchen"
}
```
Response:
```json
{
  "id": "35615",
  "status": "sent_to_kitchen",
  "sentToKitchenAt": "2025-12-20T03:09:17.237Z"
}
```

7) Remove item (added route)
```
DELETE http://localhost:3000/api/orders/items/35616
{
  "cancellationReason": "smoke test remove"
}
```
Response:
```json
{
  "id": "35616",
  "status": "cancelled",
  "deletedAt": "2025-12-20T03:09:58.177Z"
}
```

8) Close order
```
PATCH http://localhost:3000/api/orders/8034
{
  "status": "closed"
}
```
Response:
```json
{
  "id": "8034",
  "status": "closed",
  "totalAmount": "0",
  "closedAt": "2025-12-20T03:10:04.811Z"
}
```

## Phase 4.2 Examples (dev)

Payments:

1) Create payment
```
POST http://localhost:3000/api/payments
{
  "orderId": 8034,
  "paymentMethodId": 1,
  "shiftId": 84,
  "processedByUserId": 11,
  "amount": 2950,
  "referenceNumber": "POS-0001"
}
```
Response:
```json
{
  "id": "9001",
  "orderId": "8034",
  "paymentMethodId": "1",
  "shiftId": "84",
  "processedByUserId": "11",
  "amount": "2950",
  "paidAt": "2025-12-20T03:20:00.000Z"
}
```

2) List payments by order
```
GET http://localhost:3000/api/payments/order/8034
```
Response:
```json
[
  {
    "id": "9001",
    "orderId": "8034",
    "amount": "2950"
  }
]
```

Invoices:

1) Create invoice
```
POST http://localhost:3000/api/invoices
{
  "orderId": 8034,
  "documentType": "boleta",
  "series": "B001",
  "documentNumber": "00001234"
}
```
Response:
```json
{
  "id": "5001",
  "orderId": "8034",
  "documentType": "boleta",
  "series": "B001",
  "documentNumber": "00001234",
  "totalAmount": "2950"
}
```

Validators:

1) Consistency report (json)
```
GET http://localhost:3000/api/validators/consistency?format=json&limit=50
```
Response:
```json
{
  "generatedAt": "2025-12-20T03:30:00.000Z",
  "orderTotalsMismatch": {
    "count": 0,
    "sample": []
  },
  "orderItemOrphans": {
    "count": 0,
    "sample": []
  },
  "paymentOrphans": {
    "count": 0,
    "sample": []
  },
  "invoiceOrphans": {
    "count": 0,
    "sample": []
  }
}
```

2) Consistency report (markdown)
```
GET http://localhost:3000/api/validators/consistency?format=md&limit=50
```
Response:
```
# Phase 4.2 Validation Report

Generated at: 2025-12-20T03:30:00.000Z

## Order totals mismatch
Count: 0
```
