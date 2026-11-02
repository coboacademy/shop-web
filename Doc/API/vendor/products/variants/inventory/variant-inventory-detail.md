# Get a Vendor Product Variant's Inventory

Returns the inventory record for a variant of a product owned by the authenticated vendor.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/vendor/products/{product}/variants/{variant}/inventory` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `product` | UUID | Yes | ID of the product that owns the variant. |
| `variant` | UUID | Yes | ID of the variant whose inventory to retrieve. Must belong to `product`. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/vendor/products/00000000-0000-4000-8000-000000000010/variants/00000000-0000-4000-8000-000000000020/inventory" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL. All example IDs, names, values, and timestamps are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Variant inventory retrieved successfully.",
  "data": {
    "inventory": {
      "id": "00000000-0000-4000-8000-000000000050",
      "product_id": "00000000-0000-4000-8000-000000000010",
      "variant_id": "00000000-0000-4000-8000-000000000020",
      "quantity": 12,
      "reserved_quantity": 2,
      "available_quantity": 10,
      "low_stock_threshold": 3,
      "is_low_stock": false,
      "is_out_of_stock": false,
      "product": {
        "id": "00000000-0000-4000-8000-000000000010",
        "store_id": "00000000-0000-4000-8000-000000000004",
        "name": "Example Product",
        "slug": "example-product",
        "sku": "EXAMPLE-001",
        "short_description": "Illustrative short description.",
        "description": "Illustrative product description.",
        "price": "49.99",
        "compare_at_price": null,
        "status": "active",
        "is_featured": false,
        "published_at": "2026-10-31T02:30:00.000000Z",
        "created_at": "2026-10-31T02:20:00.000000Z",
        "updated_at": "2026-10-31T02:30:00.000000Z"
      },
      "variant": {
        "id": "00000000-0000-4000-8000-000000000020",
        "product_id": "00000000-0000-4000-8000-000000000010",
        "sku": "EXAMPLE-001-BLUE",
        "price": "49.99",
        "compare_at_price": null,
        "is_active": true,
        "sort_order": 1,
        "created_at": "2026-10-31T02:21:00.000000Z",
        "updated_at": "2026-10-31T02:30:00.000000Z"
      },
      "created_at": "2026-10-31T02:25:00.000000Z",
      "updated_at": "2026-10-31T02:30:00.000000Z"
    }
  }
}
```

All example IDs, names, values, and timestamps are illustrative. The `product` and `variant` objects reflect the relations loaded by this endpoint; unloaded nested relations such as variant option values are omitted.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.inventory.id` | Inventory UUID. |
| `data.inventory.product_id` | Associated product UUID. |
| `data.inventory.variant_id` | Associated variant UUID. |
| `data.inventory.quantity` | Total quantity in stock for the variant. |
| `data.inventory.reserved_quantity` | Quantity reserved for orders. |
| `data.inventory.available_quantity` | Available quantity, calculated as `max(0, quantity - reserved_quantity)`. |
| `data.inventory.low_stock_threshold` | Threshold used for low-stock calculation. |
| `data.inventory.is_low_stock` | Whether available quantity is above zero and at or below the threshold. |
| `data.inventory.is_out_of_stock` | Whether available quantity is zero. |
| `data.inventory.product` | Associated product resource, without unloaded relations. |
| `data.inventory.variant` | Associated variant resource, without unloaded option values or nested inventory. |
| `data.inventory.created_at` | Inventory creation timestamp. |
| `data.inventory.updated_at` | Last inventory update timestamp. |

## Error Responses

### 401 Unauthenticated

Returned when the request does not include a valid authenticated session or bearer token.

```json
{
  "status": "error",
  "message": "Unauthenticated."
}
```

### 404 Product, Variant, or Inventory Not Found

Returned if the product is missing or not owned by the authenticated vendor, the variant does not exist or does not belong to the specified product, or the variant has no matching inventory record.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

### Vendor Profile or Approval Error

The service throws a runtime exception if the user has no vendor profile or the vendor is not approved to manage inventory. The API exception handler returns `500`; its message is `Server error.` when debug mode is disabled. The exact message can differ when debug mode is enabled.

## Behavior Notes

- The service requires the authenticated user to have an approved vendor profile and scopes the product lookup through the product's store to that vendor.
- The variant is queried by both its ID and the supplied product ID; a variant belonging to a different product is not returned.
- An existing inventory record associated with that product and variant is required; this endpoint does not create inventory.
- No endpoint-specific throttling middleware is defined on the route.
- Variant inventory operations are available at `POST /api/vendor/products/{product}/variants/{variant}/inventory/add-stock`, `POST /api/vendor/products/{product}/variants/{variant}/inventory/remove-stock`, `PATCH /api/vendor/products/{product}/variants/{variant}/inventory/adjust-stock`, and `GET /api/vendor/products/{product}/variants/{variant}/inventory/movements`.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated variant inventory detail route
- `InventoryController::showVariant` — request handling and response wrapper
- `InventoryService::getByVariant`, `getOwnedVariantInventory`, `getOwnedProduct`, and `getApprovedVendor` — vendor access, product/variant association, and inventory lookup
- `InventoryResource`, `ProductResource`, and `ProductVariantResource` — response fields and loaded relation behavior
- `bootstrap/app.php` — API authentication and exception responses
