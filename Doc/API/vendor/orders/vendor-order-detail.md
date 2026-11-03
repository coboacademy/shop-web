# Get a Vendor Order

Returns the details of a single order belonging to the authenticated vendor's store profile, including only the vendor's own order items.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/vendor/orders/{order}` |
| Authentication | Required; Sanctum bearer token with the `Vendor` role |
| Response format | `application/json` |

The route is registered in `routes/api.php` and guarded by `auth:sanctum` plus the `role:Vendor` middleware.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `order` | integer | Yes | Order ID to retrieve. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid vendor bearer token.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/vendor/orders/148" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid vendor token. All example values, IDs, order numbers, and timestamps below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Vendor order retrieved successfully.",
  "data": {
    "order": {
      "id": 148,
      "order_number": "ORD-EXAMPLE-00148",
      "status": "pending",
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

The response contains the order and only the vendor-scoped item list. It does not include unrelated order items from other vendors.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary returned by the controller. |
| `data.order.id` | Order identifier. |
| `data.order.order_number` | Order number assigned to the order. |
| `data.order.status` | Current order status. |
| `data.order.payment_status` | Current payment status. |
| `data.order.items` | Order items associated with the authenticated vendor. |
| `data.order.items[].id` | Order item identifier. |
| `data.order.items[].product_id` | Product ID referenced by the item. |
| `data.order.items[].variant_id` | Variant ID, or `null` when the item is not variant-based. |
| `data.order.items[].vendor_id` | Vendor profile ID associated with the item. |
| `data.order.items[].store_id` | Store ID for the item. |
| `data.order.items[].product_name` | Product name stored on the order item. |
| `data.order.items[].variant_name` | Variant name, or `null` when the item has no variant. |
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

Returned when the authenticated user does not have a vendor profile or when the specified order ID is not associated with that vendor.

```json
{
  "status": "error",
  "message": "Order not found."
}
```

## Behavior Notes

- The endpoint first resolves the authenticated user's vendor profile.
- It matches the requested order ID and ensures the order has at least one item belonging to that vendor.
- The response includes only the vendor's items from the order, not the full order payload for all vendors.
- The method does not modify the order and does not accept a request body.
- No custom throttling or rate-limit contract is defined for this route in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated vendor order detail route
- `VendorOrderController::show` — vendor lookup, order lookup, and response/error wrappers
- `VendorOrderService::findOrder` — vendor-scoped order filtering and item loading
- `VendorOrderResource` — order and vendor-item response structure
- `bootstrap/app.php` — API error response format for authentication and missing-resource cases
