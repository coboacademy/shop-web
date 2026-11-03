# Get a Shipment

Returns the details of a shipment, including shipment items and their saved order-item descriptions.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/shipments/{shipment}` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `shipment` | integer | Yes | ID of the shipment to retrieve. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/shipments/31" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example IDs, names, tracking numbers, amounts, and timestamps below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Shipment retrieved successfully.",
  "data": {
    "shipment": {
      "id": 31,
      "order_id": 24,
      "store_id": "00000000-0000-4000-8000-000000000004",
      "status": "shipped",
      "tracking_number": "COBO-EXAMPLE123",
      "carrier": "Example Carrier",
      "shipping_fee": "4.50",
      "shipped_at": "2026-10-31T01:00:00.000000Z",
      "delivered_at": null,
      "cancelled_at": null,
      "notes": null,
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
      "created_at": "2026-10-31T00:55:00.000000Z",
      "updated_at": "2026-10-31T01:00:00.000000Z"
    }
  }
}
```

Monetary values are serialized as decimal strings.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.shipment.id` | Shipment identifier. |
| `data.shipment.order_id` | Associated order identifier. |
| `data.shipment.store_id` | Store identifier associated with this shipment. |
| `data.shipment.status` | Current shipment status. |
| `data.shipment.tracking_number` | Tracking number, or `null` if none is set. |
| `data.shipment.carrier` | Carrier name, or `null` if none is set. |
| `data.shipment.shipping_fee` | Shipping fee recorded on the shipment. |
| `data.shipment.shipped_at` | Shipment timestamp, or `null` if not shipped. |
| `data.shipment.delivered_at` | Delivery timestamp, or `null` if not delivered. |
| `data.shipment.cancelled_at` | Cancellation timestamp, or `null` if not cancelled. |
| `data.shipment.notes` | Shipment notes, or `null` if none are recorded. |
| `data.shipment.items` | Items assigned to the shipment. |
| `data.shipment.items[].id` | Shipment item identifier. |
| `data.shipment.items[].order_item_id` | Associated order item identifier. |
| `data.shipment.items[].quantity` | Quantity included in the shipment. |
| `data.shipment.items[].product_name` | Product name saved on the associated order item, or `null` if unavailable. |
| `data.shipment.items[].variant_name` | Variant name saved on the associated order item, or `null` if unavailable. |
| `data.shipment.items[].sku` | SKU saved on the associated order item, or `null` if unavailable. |
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

### 404 Not Found

Returned when the shipment ID does not exist.

```json
{
  "status": "error",
  "message": "Shipment not found."
}
```

## Behavior and Access Notes

- The endpoint requires authentication but does not check whether the authenticated user owns the shipment's order or has access to its store.
- The repository looks up the shipment by ID and eager loads the related order, store, and shipment items; the current resource returns shipment fields and item snapshot data, not nested order/store objects.
- The endpoint does not modify the shipment.
- No endpoint-specific throttling is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated shipment detail route
- `ShipmentController::show` — shipment lookup and response/error wrappers
- `ShipmentRepository::findById` — lookup by shipment ID and eager-loaded relations
- `ShipmentResource` and `ShipmentItemResource` — response shape
- `bootstrap/app.php` — API authentication error response
