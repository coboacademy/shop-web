# Update Shipment Status

Updates the status of a shipment and sets the corresponding timestamp when the new status is `shipped`, `delivered`, or `cancelled`.

## Endpoint

| Property | Value |
|---|---|
| Method | `PATCH` |
| Path | `/api/shipments/{shipment}/status` |
| Authentication | Required; Sanctum bearer token |
| Content-Type | `application/json` |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `shipment` | integer | Yes | ID of the shipment to update. |

## Request Headers

```http
Accept: application/json
Content-Type: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Request Body

| Field | Type | Required | Allowed Values |
|---|---|---|---|
| `status` | string | Yes | `pending`, `processing`, `shipped`, `in_transit`, `delivered`, `cancelled` |

## Example Request

```bash
curl -X PATCH "<API_BASE_URL>/api/shipments/31/status" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "status": "shipped"
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example IDs, names, tracking numbers, amounts, and timestamps below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Shipment status updated successfully.",
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

When the requested status is `shipped`, `delivered`, or `cancelled`, the corresponding timestamp is set to the current time. Other existing timestamp values are not cleared by the status update.

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

### 422 Unprocessable Content

Returned when `status` is missing or is not one of the allowed values.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "status": [
      "The selected status is invalid."
    ]
  }
}
```

## Behavior and Access Notes

- The endpoint updates only the shipment's `status` and, for `shipped`, `delivered`, or `cancelled`, the corresponding timestamp.
- The endpoint does not verify that the authenticated user owns the shipment's order or has access to its store.
- The status value is validated against a fixed allowlist; no other transition/state-machine checks are performed.
- No endpoint-specific throttling is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated shipment status route
- `ShipmentController::updateStatus` — shipment lookup and response/error wrappers
- `UpdateShipmentStatusRequest` — allowed status values
- `ShipmentService::updateStatus` — status and timestamp update behavior
- `ShipmentRepository::update` — persistence and response relations
- `ShipmentResource` and `ShipmentItemResource` — response shape
- `bootstrap/app.php` — API validation and authentication error responses
