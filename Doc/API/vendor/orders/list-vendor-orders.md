# List Orders for the Authenticated Vendor

Returns the authenticated vendor's orders, filtered to orders that include at least one item belonging to the vendor's store profile. Results are ordered from newest to oldest.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/vendor/orders` |
| Authentication | Required; Sanctum bearer token with the `Vendor` role |
| Response format | `application/json` |

The route is registered in `routes/api.php` and guarded by `auth:sanctum` plus the `role:Vendor` middleware.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid vendor bearer token.

## Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `page` | integer | No | Pagination page number. The underlying query uses a fixed page size of 15 orders. |

The endpoint does not support a custom `per_page` request parameter in its controller and service layer; the repository uses a fixed page size of 15.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/vendor/orders?page=1" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid vendor token. All example values, IDs, and timestamps below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Vendor orders retrieved successfully.",
  "data": {
    "orders": {
      "data": [
        {
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
      ],
      "links": {
        "first": "<API_BASE_URL>/api/vendor/orders?page=1",
        "last": "<API_BASE_URL>/api/vendor/orders?page=1",
        "prev": null,
        "next": null
      },
      "meta": {
        "current_page": 1,
        "from": 1,
        "last_page": 1,
        "links": [
          {
            "url": null,
            "label": "&laquo; Previous",
            "active": false
          },
          {
            "url": "<API_BASE_URL>/api/vendor/orders?page=1",
            "label": "1",
            "active": true
          },
          {
            "url": null,
            "label": "Next &raquo;",
            "active": false
          }
        ],
        "path": "<API_BASE_URL>/api/vendor/orders",
        "per_page": 15,
        "to": 1,
        "total": 1
      }
    }
  }
}
```

If the vendor has no matching orders, `data.orders.data` is an empty array.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary returned by the controller. |
| `data.orders` | Paginated collection of orders matching the authenticated vendor. |
| `data.orders.data[]` | One order in the current page. |
| `data.orders.data[].id` | Order identifier. |
| `data.orders.data[].order_number` | Order number as stored on the order. |
| `data.orders.data[].status` | Current order status. |
| `data.orders.data[].payment_status` | Current payment status. |
| `data.orders.data[].items` | Only the order items for the authenticated vendor are loaded. |
| `data.orders.data[].items[].id` | Order item identifier. |
| `data.orders.data[].items[].product_id` | Product ID for the item. |
| `data.orders.data[].items[].variant_id` | Variant ID, or `null` for non-variant products. |
| `data.orders.data[].items[].vendor_id` | Vendor profile ID associated with the item. |
| `data.orders.data[].items[].store_id` | Store ID for the item. |
| `data.orders.data[].items[].product_name` | Product name saved on the order item. |
| `data.orders.data[].items[].variant_name` | Variant name, or `null` if the item is not variant-based. |
| `data.orders.data[].items[].sku` | Item SKU. |
| `data.orders.data[].items[].quantity` | Ordered quantity. |
| `data.orders.data[].items[].unit_price` | Item unit price as a decimal string. |
| `data.orders.data[].items[].subtotal` | Line subtotal as a decimal string. |
| `data.orders.data[].items[].total` | Final line total as a decimal string. |
| `data.orders.data[].shipping` | Shipping destination details captured on the order. |
| `data.orders.data[].shipping.name` | Recipient name. |
| `data.orders.data[].shipping.phone` | Recipient phone number. |
| `data.orders.data[].shipping.country` | Shipping country. |
| `data.orders.data[].shipping.province` | Shipping province or region. |
| `data.orders.data[].shipping.city` | Shipping city. |
| `data.orders.data[].shipping.address` | Shipping address. |
| `data.orders.data[].shipping.postal_code` | Shipping postal code. |
| `data.orders.data[].created_at` | Order creation timestamp. |
| `data.orders.links` | Pagination links for the current result set. |
| `data.orders.meta` | Pagination metadata, including `current_page`, `last_page`, `per_page`, and `total`. |

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

## Behavior Notes

- The endpoint resolves the authenticated vendor from `request->user()->vendor`.
- The query returns only orders that contain at least one item with a matching `vendor_id`.
- Orders are ordered newest first via the `latest()` query.
- The paginator uses a fixed page size of 15 orders per page.
- The resource includes the vendor-scoped item list only; it does not expose every order item from the full order record.
- No custom rate-limit or throttling middleware is defined on this route in the source inspected.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated vendor orders route
- `VendorOrderController::index` — vendor profile lookup and response wrapper
- `VendorOrderService::getOrders` — vendor filter, item loading, newest-first ordering, and 15-item pagination
- `VendorOrderResource` — the order and item fields returned in the payload
- `bootstrap/app.php` — API error response format for unauthenticated requests
