# Remove Stock from a Vendor Product

Removes an available quantity from the product-level inventory of a product owned by the authenticated vendor. Reserved stock cannot be removed. Products with variants must use variant inventory instead.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/vendor/products/{product}/inventory/remove-stock` |
| Authentication | Required; Sanctum bearer token |
| Content-Type | `application/json` |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `product` | UUID | Yes | ID of the product whose inventory to decrease. |

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
| `quantity` | integer | Yes | Must be at least `1` and no greater than the currently available quantity (`quantity - reserved_quantity`). |
| `reason` | string or `null` | No | Maximum 255 characters. |

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/vendor/products/00000000-0000-4000-8000-000000000010/inventory/remove-stock" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "quantity": 5,
    "reason": "Illustrative damaged-stock removal"
  }'
```

Replace `<API_BASE_URL>` with the API base URL. All example IDs, names, values, and timestamps are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Stock removed successfully.",
  "data": {
    "inventory": {
      "id": "00000000-0000-4000-8000-000000000050",
      "product_id": "00000000-0000-4000-8000-000000000010",
      "variant_id": null,
      "quantity": 10,
      "reserved_quantity": 1,
      "available_quantity": 9,
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
      "variant": null,
      "created_at": "2026-10-31T02:25:00.000000Z",
      "updated_at": "2026-10-31T03:20:00.000000Z"
    }
  }
}
```

All example IDs, names, values, and timestamps are illustrative. The quantity in the response is the updated total. `variant_id` and `variant` are `null` because this endpoint targets product-level inventory.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the operation succeeded. |
| `message` | Response message. |
| `data.inventory.id` | Inventory UUID. |
| `data.inventory.product_id` | Associated product UUID. |
| `data.inventory.variant_id` | Variant UUID; `null` for product-level inventory. |
| `data.inventory.quantity` | Updated total quantity in stock. |
| `data.inventory.reserved_quantity` | Quantity reserved for orders. |
| `data.inventory.available_quantity` | Available quantity, calculated as `max(0, quantity - reserved_quantity)`. |
| `data.inventory.low_stock_threshold` | Threshold used for low-stock calculation. |
| `data.inventory.is_low_stock` | Whether available quantity is above zero and at or below the threshold. |
| `data.inventory.is_out_of_stock` | Whether available quantity is zero. |
| `data.inventory.product` | Associated product resource. |
| `data.inventory.variant` | Associated variant resource; `null` for product-level inventory. |
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

### 404 Product or Inventory Not Found

Returned when the product does not exist or is not owned by the authenticated vendor, or when product-level inventory does not exist for the product.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

### 422 Invalid Quantity, Insufficient Available Stock, or Product Has Variants

Returned when `quantity` is missing or less than `1`, exceeds the available quantity, or when the product has variants. The insufficient-stock message includes the current available quantity; for example:

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "quantity": [
      "Only 4 item(s) are available."
    ]
  }
}
```

For products with variants, the validation error is associated with `product_id` and states that variant inventory must be used.

### Vendor Profile or Approval Error

The service throws a runtime exception if the user has no vendor profile or the vendor is not approved to manage inventory. The API exception handler returns `500`; its message is `Server error.` when debug mode is disabled. The exact message can differ when debug mode is enabled.

## Behavior Notes

- The service requires the authenticated user to have an approved vendor profile and scopes the product lookup through the product's store to that vendor.
- Products with variants cannot use this endpoint; use the corresponding variant inventory endpoint.
- The endpoint requires an existing product-level inventory record; it does not create one.
- Removable stock is calculated as `quantity - reserved_quantity`; the requested amount cannot exceed that value, so reserved stock is protected.
- The service decrements stock under a database transaction and row lock. On success, it records a `stock_out` inventory movement with the before and after quantities and the optional reason.
- No endpoint-specific throttling middleware is defined on the route.
- The variant equivalent is `POST /api/vendor/products/{product}/variants/{variant}/inventory/remove-stock`.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated remove-stock route
- `InventoryController::removeStock` — request handling and response wrapper
- `StockRequest` — quantity and reason validation
- `InventoryService::removeStock`, `removeStockFromInventory`, `getOwnedInventory`, and `getApprovedVendor` — vendor access, product-level constraints, available-stock guard, decrement, and movement recording
- `InventoryRepository::findByProduct` — product-level inventory lookup
- `InventoryResource` and `ProductResource` — response fields
- `bootstrap/app.php` — API validation, authentication, and exception responses
