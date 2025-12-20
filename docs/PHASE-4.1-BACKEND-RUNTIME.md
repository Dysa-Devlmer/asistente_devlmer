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
