# Update a Vendor Order Status

Updates the status of a single order that belongs to the authenticated vendor.

## Endpoint

| Property | Value |
|---|---|
| Method | `PATCH` |
| Path | `/api/vendor/orders/{order}/status` |
| Authentication | Required; Sanctum bearer token with the `Vendor` role |
| Response format | `application/json` |

The route is registered in `routes/api.php` and guarded by `auth:sanctum` plus the `role:Vendor` middleware.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `order` | integer | Yes | Order ID to update. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json
```

Replace `<YOUR_TOKEN>` with a valid vendor bearer token.

## Request Body

```json
{
  "status": "confirmed"
}
```

### Request Fields

| Field | Type | Required | Constraints / Default | Description |
|---|---|---|---|---|
| `status` | string | Yes | Must be one of `pending`, `confirmed`, `processing`, `cancelled`, `delivered` | New status to assign to the order. |

## Example Request

```bash
curl -X PATCH "<API_BASE_URL>/api/vendor/orders/148/status" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "status": "confirmed"
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid vendor token. All example values, IDs, order numbers, names, and timestamps below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Order status updated successfully.",
  "data": {
    "order": {
      "id": 148,
      "order_number": "ORD-EXAMPLE-00148",
      "status": "confirmed",
      "payment_status": "unpaid",
      "items": [
        {
          "id": 205,
          "product_id": 18,
          "variant_id": null,
          "vendor_id": "00000000-0000-4000-8000-000000000099",
          "store_id": "00000000-0000-4000-8000-000000000088",
          "product_name": "Example Cotton Hoodie",
          "variant_name": null,
          "sku": "SKU-EXAMPLE-001",
          "quantity": 2,
          "unit_price": "39.90",
          "subtotal": "79.80",
          "total": "79.80"
        }
      ],
      "shipping": {
        "name": "Alex Example",
        "phone": "+1-555-0100",
        "country": "Example Country",
        "province": "Example Province",
        "city": "Example City",
        "address": "123 Example Street",
        "postal_code": "12345"
      },
      "created_at": "2026-10-31T09:00:00.000000Z"
    }
  }
}
```

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary returned by the controller. |
| `data.order.id` | Order identifier. |
| `data.order.order_number` | Order number assigned to the order. |
| `data.order.status` | Updated order status. |
| `data.order.payment_status` | Payment status currently recorded on the order. |
| `data.order.items` | Vendor-scoped order items for the authenticated vendor. |
| `data.order.items[].id` | Order item identifier. |
| `data.order.items[].product_id` | Product ID referenced by the item. |
| `data.order.items[].variant_id` | Variant ID, or `null` when the item is not variant-based. |
| `data.order.items[].vendor_id` | Vendor profile ID associated with the item. |
| `data.order.items[].store_id` | Store ID for the item. |
| `data.order.items[].product_name` | Product name stored on the order item. |
| `data.order.items[].variant_name` | Variant name, or `null` when no variant is attached. |
| `data.order.items[].sku` | SKU saved on the order item. |
| `data.order.items[].quantity` | Ordered quantity. |
| `data.order.items[].unit_price` | Unit price as a decimal string. |
| `data.order.items[].subtotal` | Line subtotal as a decimal string. |
| `data.order.items[].total` | Final line total as a decimal string. |
| `data.order.shipping` | Shipping destination details captured on the order. |
| `data.order.shipping.name` | Recipient name. |
| `data.order.shipping.phone` | Recipient phone number. |
| `data.order.shipping.country` | Shipping country. |
| `data.order.shipping.province` | Shipping province or region. |
| `data.order.shipping.city` | Shipping city. |
| `data.order.shipping.address` | Shipping address. |
| `data.order.shipping.postal_code` | Shipping postal code. |
| `data.order.created_at` | Order creation timestamp. |

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

Returned when the authenticated user does not have a vendor profile.

```json
{
  "status": "error",
  "message": "Vendor profile not found."
}
```

### 422 Unprocessable Entity

Returned when the request is invalid or the vendor-scoped order cannot be updated.

This endpoint catches a `RuntimeException` from the service layer and responds with a 422 status. In the inspected implementation, the exception message is surfaced directly as the response message; for a missing vendor-scoped order it is:

```json
{
  "status": "error",
  "message": "Order not found."
}
```

Validation failures for the `status` field also return a 422 response in Laravel's standard format, for example:

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

## Behavior Notes

- The request validates `status` with `Rule::in(['pending', 'confirmed', 'processing', 'cancelled', 'delivered'])`.
- The controller resolves the authenticated user's vendor and then calls the service with the vendor ID and order ID.
- The service first locates the vendor-scoped order; if not found, it throws `RuntimeException('Order not found.')` and the controller converts that to a 422 response.
- The update itself is a direct `update(['status' => $status])`; no additional transition rules or workflow guard are implemented in the inspected source.
- The response returns the refreshed order with the vendor-scoped item relation loaded.
- No endpoint-specific throttling or rate-limit metadata was identified in the route or controller source.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated vendor order status route
- `VendorOrderController::updateStatus` — request handling, vendor lookup, error wrapping, and success response
- `UpdateVendorOrderStatusRequest` — required `status` field and allowed values
- `VendorOrderService::updateStatus` — vendor-scoped order lookup, update, and refresh
- `VendorOrderResource` — order and item response structure
- `bootstrap/app.php` — general API error formatting for auth and validation responses
