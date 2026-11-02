# Add Stock to a Vendor Product Variant

Adds a positive quantity to the inventory of a variant belonging to a product owned by the authenticated vendor.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/vendor/products/{product}/variants/{variant}/inventory/add-stock` |
| Authentication | Required; Sanctum bearer token |
| Content-Type | `application/json` |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `product` | UUID | Yes | ID of the product that owns the variant. |
| `variant` | UUID | Yes | ID of the variant whose inventory to increase. Must belong to `product`. |

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
| `quantity` | integer | Yes | Must be at least `1`. |
| `reason` | string or `null` | No | Maximum 255 characters. |

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/vendor/products/00000000-0000-4000-8000-000000000010/variants/00000000-0000-4000-8000-000000000020/inventory/add-stock" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "quantity": 5,
    "reason": "Illustrative variant restock"
  }'
```

Replace `<API_BASE_URL>` with the API base URL. All example IDs, names, values, and timestamps are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Variant stock added successfully.",
  "data": {
    "inventory": {
      "id": "00000000-0000-4000-8000-000000000050",
      "product_id": "00000000-0000-4000-8000-000000000010",
      "variant_id": "00000000-0000-4000-8000-000000000020",
      "quantity": 15,
      "reserved_quantity": 1,
      "available_quantity": 14,
      "low_stock_threshold": 2,
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
        "updated_at": "2026-10-31T03:20:00.000000Z"
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
        "updated_at": "2026-10-31T03:20:00.000000Z"
      },
      "created_at": "2026-10-31T02:25:00.000000Z",
      "updated_at": "2026-10-31T03:20:00.000000Z"
    }
  }
}
```

All example IDs, names, values, and timestamps are illustrative. `quantity` is the updated total. The variant object reflects the relation loaded by the endpoint; unloaded nested relations such as option values and variant inventory are omitted.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the operation succeeded. |
| `message` | Response message. |
| `data.inventory.id` | Inventory UUID. |
| `data.inventory.product_id` | Associated product UUID. |
| `data.inventory.variant_id` | Associated variant UUID. |
| `data.inventory.quantity` | Updated total quantity in stock for the variant. |
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

Returned when the product does not exist or is not owned by the authenticated vendor, when the variant does not belong to the specified product, or when no inventory record exists for that product and variant.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

### 422 Invalid Quantity

Returned when `quantity` is missing or less than `1`.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "quantity": [
      "The quantity field must be at least 1."
    ]
  }
}
```

### Vendor Profile or Approval Error

The service throws a runtime exception if the user has no vendor profile or the vendor is not approved to manage inventory. The API exception handler returns `500`; its message is `Server error.` when debug mode is disabled. The exact message can differ when debug mode is enabled.

## Behavior Notes

- The service requires the authenticated user to have an approved vendor profile and scopes the product lookup through the product's store to that vendor.
- The variant must belong to the specified product, and an existing inventory record for the product/variant pair is required; this endpoint does not create one.
- Stock is incremented by the submitted quantity under a database transaction and row lock. The service records a `stock_in` inventory movement with the before and after quantities and the optional reason.
- No endpoint-specific throttling middleware is defined on the route.
- For product-level inventory, see `POST /api/vendor/products/{product}/inventory/add-stock`.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated variant add-stock route
- `InventoryController::addVariantStock` — request handling and response wrapper
- `StockRequest` — quantity and reason validation
- `InventoryService::addStockToVariant`, `addStockToInventory`, `getOwnedVariantInventory`, `getOwnedProduct`, and `getApprovedVendor` — vendor access, product/variant association, inventory lookup, stock increment, and movement recording
- `InventoryResource`, `ProductResource`, and `ProductVariantResource` — response fields and loaded relation behavior
- `bootstrap/app.php` — API validation, authentication, and exception responses
