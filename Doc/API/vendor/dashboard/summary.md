# Get Vendor Dashboard Summary

Returns aggregated order, product, and store statistics for the authenticated
vendor, plus up to five recent orders with only that vendor's order items.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/vendor/dashboard/summary` |
| Authentication | Required; Sanctum bearer token and `Vendor` role |
| Permission | `vendor.view` |
| Response format | `application/json` |

## Request

```http
GET /api/vendor/dashboard/summary
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Postman request:

- Method: `GET`
- URL: `{{base_url}}/api/vendor/dashboard/summary`
- Authorization: Bearer Token, using the existing vendor token variable
- No request body or additional authentication request is needed

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Vendor dashboard summary retrieved successfully.",
  "data": {
    "summary": {
      "orders": {
        "total": 5,
        "pending": 1,
        "confirmed": 1,
        "processing": 1,
        "delivered": 1,
        "cancelled": 1
      },
      "products": {
        "total": 12,
        "active": 8
      },
      "stores": {
        "total": 2,
        "active": 1
      }
    },
    "recent_orders": [
      {
        "id": 148,
        "order_number": "COBO-20261107-ABC123",
        "status": "pending",
        "payment_status": "pending",
        "vendor_item_subtotal": "35.00",
        "items": [
          {
            "id": 205,
            "product_id": "00000000-0000-4000-8000-000000000011",
            "variant_id": null,
            "vendor_id": "00000000-0000-4000-8000-000000000099",
            "store_id": "00000000-0000-4000-8000-000000000088",
            "product_name": "Example Cotton Hoodie",
            "variant_name": null,
            "sku": "SKU-EXAMPLE-001",
            "quantity": 2,
            "unit_price": "10.00",
            "subtotal": "20.00",
            "total": "20.00"
          },
          {
            "id": 206,
            "product_id": "00000000-0000-4000-8000-000000000012",
            "variant_id": null,
            "vendor_id": "00000000-0000-4000-8000-000000000099",
            "store_id": "00000000-0000-4000-8000-000000000088",
            "product_name": "Example Cotton T-Shirt",
            "variant_name": null,
            "sku": "SKU-EXAMPLE-002",
            "quantity": 1,
            "unit_price": "15.00",
            "subtotal": "15.00",
            "total": "15.00"
          }
        ],
        "created_at": "2026-11-07T08:30:00.000000Z"
      }
    ]
  }
}
```

All IDs, metrics, and timestamps above are illustrative.

## Metric Definitions

- **Orders:** An order is included when at least one `order_items.vendor_id`
  matches the authenticated vendor profile. It is counted once for that
  vendor, even if it contains multiple of the vendor's items. In a mixed-vendor
  order, each participating vendor sees one order in their own counts.
- **Order statuses:** Counts use the persisted order-level `status` values
  `pending`, `confirmed`, `processing`, `delivered`, and `cancelled`. `total`
  includes every order matching the vendor, once each.
- **Products:** Includes non-soft-deleted products in any non-soft-deleted
  store owned by the vendor. `active` counts products whose status is the
  existing `active` value (`draft`, `active`, and `inactive` are the product
  status values).
- **Stores:** Includes non-soft-deleted stores owned by the vendor. `active`
  counts rows with `is_active = true`.
- **Recent orders:** Up to five matching orders, newest first. Each order has
  only the authenticated vendor's order items. `vendor_item_subtotal` is the
  sum of those items' stored `subtotal` values; the order's customer shipping
  data and other vendors' items are not returned.
- **Revenue is omitted.** The schema stores order-level discounts and shipping
  but has no allocation of either amount to each vendor's items, no currency
  field, and no defined revenue policy by payment/order status or refund
  handling. The stored item totals alone cannot establish accurate vendor
  revenue.

## Error Responses

### 401 Unauthenticated

Returned when the request has no valid authenticated session or bearer token.

```json
{
  "status": "error",
  "message": "Unauthenticated."
}
```

### 403 Forbidden

Returned when the authenticated account is not a `Vendor` or does not have the
`vendor.view` permission.

### 404 Vendor Profile Not Found

Returned when the authenticated vendor account does not have a persisted
vendor profile.

```json
{
  "status": "error",
  "message": "Vendor profile not found."
}
```

## Behavior Notes

- All metrics and recent-order queries are scoped using the vendor profile
  associated with the authenticated user.
- No customer or shipping recipient information is returned.
- A vendor with no stores or orders receives zero metrics and an empty
  `recent_orders` array.
- The endpoint does not accept query parameters or a request body.

## Implementation References

- `routes/api.php` — vendor role and `vendor.view` permission middleware
- `VendorDashboardController` — authenticated vendor lookup and response
- `VendorDashboardService` — scoped aggregates and recent order query
- `VendorDashboardOrderResource` and `OrderItemResource` — recent order fields
- `OrderItem.vendor_id` — order-to-vendor ownership snapshot
- `ProductStatus` and `Store.is_active` — product and store active definitions
