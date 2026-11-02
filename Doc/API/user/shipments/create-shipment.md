# Create a Shipment

Creates a pending shipment for the order items associated with a store. If no tracking number is provided, the application generates one.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/shipments` |
| Authentication | Required; Sanctum bearer token |
| Content-Type | `application/json` |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Request Headers

```http
Accept: application/json
Content-Type: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Request Body

| Field | Type | Required | Validation Rules |
|---|---|---|---|
| `order_id` | integer | Yes | Must match an existing order ID. |
| `store_id` | string | Yes | Must be a string. The request rules do not verify that it identifies an existing store or that the store belongs to the order. |
| `tracking_number` | string or `null` | No | Maximum 100 characters; if provided, must be unique among shipment tracking numbers. |
| `carrier` | string or `null` | No | Maximum 100 characters. |
| `shipping_fee` | number or `null` | No | Must be at least `0`. |
| `notes` | string or `null` | No | Maximum 1000 characters. |

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/shipments" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "order_id": 24,
    "store_id": "00000000-0000-4000-8000-000000000004",
    "tracking_number": "TRACK-EXAMPLE-001",
    "carrier": "Example Carrier",
    "shipping_fee": 4.50,
    "notes": "Handle with care."
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example IDs, names, tracking numbers, amounts, and timestamps below are illustrative.

## Successful Response

**HTTP status:** `201 Created`

```json
{
  "status": "success",
  "message": "Shipment created successfully.",
  "data": {
    "shipment": {
      "id": 31,
      "order_id": 24,
      "store_id": "00000000-0000-4000-8000-000000000004",
      "status": "pending",
      "tracking_number": "TRACK-EXAMPLE-001",
      "carrier": "Example Carrier",
      "shipping_fee": "4.50",
      "shipped_at": null,
      "delivered_at": null,
      "cancelled_at": null,
      "notes": "Handle with care.",
      "items": [
        {
          "id": 42,
          "order_item_id": 83,
          "quantity": 2,
          "product_name": "Example Coffee",
          "variant_name": null,
          "sku": "EXAMPLE-COFFEE"
        }
      ],
      "created_at": "2026-10-31T01:00:00.000000Z",
      "updated_at": "2026-10-31T01:00:00.000000Z"
    }
  }
}
```

When `tracking_number` is omitted, the application generates a value with the `COBO-` prefix followed by 10 random uppercase characters. Monetary values are serialized as decimal strings.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the operation succeeded. |
| `message` | Response message. |
| `data.shipment.id` | Shipment identifier. |
| `data.shipment.order_id` | Associated order identifier. |
| `data.shipment.store_id` | Store associated with this shipment. |
| `data.shipment.status` | Shipment status; new shipments use `pending`. |
| `data.shipment.tracking_number` | Submitted or generated tracking number. |
| `data.shipment.carrier` | Carrier name, or `null` if omitted. |
| `data.shipment.shipping_fee` | Shipping fee; defaults to `0` if omitted. |
| `data.shipment.shipped_at` | Shipment timestamp; initially `null`. |
| `data.shipment.delivered_at` | Delivery timestamp; initially `null`. |
| `data.shipment.cancelled_at` | Cancellation timestamp; initially `null`. |
| `data.shipment.notes` | Notes, or `null` if omitted. |
| `data.shipment.items` | Order items assigned to the shipment. |
| `data.shipment.items[].id` | Shipment item identifier. |
| `data.shipment.items[].order_item_id` | Associated order item identifier. |
| `data.shipment.items[].quantity` | Quantity copied from the order item. |
| `data.shipment.items[].product_name` | Product name from the associated order item. |
| `data.shipment.items[].variant_name` | Variant name from the associated order item, or `null`. |
| `data.shipment.items[].sku` | SKU from the associated order item, or `null`. |
| `data.shipment.created_at` | Shipment creation timestamp. |
| `data.shipment.updated_at` | Last shipment update timestamp. |

## Error Responses

### 401 Unauthenticated

Returned when the request does not include a valid authenticated session or bearer token.

```json
{
  "status": "error",
  "message": "Unauthenticated."
}
```

### 422 Unprocessable Content

Returned when request validation fails, such as a missing `order_id` or `store_id`, an invalid `order_id`, an overlong tracking number, or a duplicate tracking number.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "tracking_number": [
      "The tracking number has already been taken."
    ]
  }
}
```

### 500 Internal Server Error

The service throws runtime exceptions if the order is not found, is cancelled, has no items for the specified store, or already has a non-cancelled shipment for that store. These exceptions are handled by the generic API error handler. In a non-debug environment, the response is:

```json
{
  "status": "error",
  "message": "Server error."
}
```

In debug mode, the response may contain the exception message.

## Behavior and Access Notes

- The shipment and its shipment-item records are created in a database transaction.
- A shipment includes every order item whose `store_id` matches the supplied `store_id`; the client does not choose individual items or quantities.
- The order must not be cancelled and must contain at least one item for the supplied store.
- A second non-cancelled shipment cannot be created for the same order and store. A cancelled shipment does not prevent a replacement shipment.
- The endpoint requires authentication but does not check that the authenticated user owns the order or has access to the store. The service looks up the order and store-matching items without an authenticated-user ownership check.
- No endpoint-specific throttling is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated shipment creation route
- `ShipmentController::store` — request handling and `201 Created` response
- `CreateShipmentRequest` — request validation rules
- `ShipmentService::create` — order/store checks, duplicate-shipment rule, generated tracking numbers, transaction, and shipment-item creation
- `ShipmentResource` and `ShipmentItemResource` — response shape
- `bootstrap/app.php` — API validation, authentication, and generic exception responses
