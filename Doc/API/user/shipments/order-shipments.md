# List Shipments for an Order

Returns all shipments associated with the specified order, ordered newest first.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/shipments/order/{order}` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `order` | integer | Yes | ID of the order whose shipments should be returned. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/shipments/order/24" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example IDs, names, tracking numbers, amounts, and timestamps below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Shipments retrieved successfully.",
  "data": {
    "shipments": [
      {
        "id": 31,
        "order_id": 24,
        "store_id": "00000000-0000-4000-8000-000000000004",
        "status": "pending",
        "tracking_number": "COBO-EXAMPLE123",
        "carrier": "Example Carrier",
        "shipping_fee": "0.00",
        "shipped_at": null,
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
        "created_at": "2026-10-31T01:00:00.000000Z",
        "updated_at": "2026-10-31T01:00:00.000000Z"
      }
    ]
  }
}
```

If no shipments match the order ID, `data.shipments` is an empty array.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.shipments` | Shipments matching the supplied order ID, newest first. |
| `data.shipments[].id` | Shipment identifier. |
| `data.shipments[].order_id` | Associated order identifier. |
| `data.shipments[].store_id` | Store identifier for the shipment. |
| `data.shipments[].status` | Current shipment status. |
| `data.shipments[].tracking_number` | Tracking number, or `null` if none is set. |
| `data.shipments[].carrier` | Carrier name, or `null` if none is set. |
| `data.shipments[].shipping_fee` | Shipping fee recorded on the shipment. |
| `data.shipments[].shipped_at` | Shipment timestamp, or `null` if not shipped. |
| `data.shipments[].delivered_at` | Delivery timestamp, or `null` if not delivered. |
| `data.shipments[].cancelled_at` | Cancellation timestamp, or `null` if not cancelled. |
| `data.shipments[].notes` | Shipment notes, or `null` if none are recorded. |
| `data.shipments[].items` | Items included in the shipment. |
| `data.shipments[].items[].id` | Shipment item identifier. |
| `data.shipments[].items[].order_item_id` | Associated order item identifier. |
| `data.shipments[].items[].quantity` | Quantity assigned to this shipment. |
| `data.shipments[].items[].product_name` | Product name from the associated order item, or `null` if unavailable. |
| `data.shipments[].items[].variant_name` | Variant name from the associated order item, or `null` if unavailable. |
| `data.shipments[].items[].sku` | SKU from the associated order item, or `null` if unavailable. |
| `data.shipments[].created_at` | Shipment creation timestamp. |
| `data.shipments[].updated_at` | Last shipment update timestamp. |

## Error Responses

### 401 Unauthenticated

Returned when the request does not include a valid authenticated session or bearer token.

```json
{
  "status": "error",
  "message": "Unauthenticated."
}
```

The controller does not return a `404` when the order has no shipments; it returns `200 OK` with an empty `shipments` array.

## Behavior and Access Notes

- The endpoint requires authentication but does not check that the supplied order belongs to the authenticated user.
- The repository selects shipments solely by `order_id`, loads their store and item details, and sorts them newest first.
- Any authenticated user who can supply or guess an order ID can retrieve that order's shipment data. Clients should not treat this endpoint as enforcing order ownership.
- The response is not paginated.
- The endpoint does not modify shipments and does not define endpoint-specific throttling.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated order shipment listing route
- `ShipmentController::index` — order ID handling and response wrapper
- `ShipmentRepository::getOrderShipments` — order ID filter, eager-loaded fields, and newest-first ordering
- `ShipmentResource` and `ShipmentItemResource` — response shape
- `bootstrap/app.php` — API authentication error response
- `database/migrations/2026_09_27_080116_create_shipments_table.php` — shipment fields and types
