# Update Vendor Product Inventory Settings

Updates the low-stock threshold for product-level inventory owned by the authenticated vendor. Products with variants must use variant inventory instead.

## Endpoint

| Property | Value |
|---|---|
| Method | `PATCH` |
| Path | `/api/vendor/products/{product}/inventory` |
| Authentication | Required; Sanctum bearer token |
| Content-Type | `application/json` |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `product` | UUID | Yes | ID of the product whose inventory settings to update. |

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
| `low_stock_threshold` | integer | No | If provided, must be at least `0`. |

All fields are optional. An empty JSON object is accepted and leaves the inventory settings unchanged.

## Example Request

```bash
curl -X PATCH "<API_BASE_URL>/api/vendor/products/00000000-0000-4000-8000-000000000010/inventory" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "low_stock_threshold": 5
  }'
```

Replace `<API_BASE_URL>` with the API base URL. All example IDs, names, values, and timestamps are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Inventory updated successfully.",
  "data": {
    "inventory": {
      "id": "00000000-0000-4000-8000-000000000050",
      "product_id": "00000000-0000-4000-8000-000000000010",
      "variant_id": null,
      "quantity": 10,
      "reserved_quantity": 1,
      "available_quantity": 9,
      "low_stock_threshold": 5,
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
      "variant": null,
      "created_at": "2026-10-31T02:25:00.000000Z",
      "updated_at": "2026-10-31T03:15:00.000000Z"
    }
  }
}
```

All example IDs, names, values, and timestamps are illustrative. The response includes the full inventory resource and associated product.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the operation succeeded. |
| `message` | Response message. |
| `data.inventory.id` | Inventory UUID. |
| `data.inventory.product_id` | Associated product UUID. |
| `data.inventory.variant_id` | Variant UUID; `null` for product-level inventory. |
| `data.inventory.quantity` | Total quantity in stock; not changed by this endpoint. |
| `data.inventory.reserved_quantity` | Quantity reserved for orders. |
| `data.inventory.available_quantity` | Available quantity, calculated as `max(0, quantity - reserved_quantity)`. |
| `data.inventory.low_stock_threshold` | Updated low-stock threshold. |
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

### 422 Invalid Threshold or Product Has Variants

Returned when `low_stock_threshold` is not a non-negative integer, or when the product has variants.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "product_id": [
      "Products with variants must use variant inventory."
    ]
  }
}
```

### Vendor Profile or Approval Error

The service throws a runtime exception if the user has no vendor profile or the vendor is not approved to manage inventory. The API exception handler returns `500`; its message is `Server error.` when debug mode is disabled. The exact message can differ when debug mode is enabled.

## Behavior Notes

- The service requires the authenticated user to have an approved vendor profile and scopes the product lookup through the product's store to that vendor.
- Products with variants cannot use this endpoint; use the corresponding variant inventory endpoint.
- Only `low_stock_threshold` is accepted for update; quantity changes are handled by the stock adjustment endpoints.
- The endpoint updates an existing product-level inventory record and does not create one when it is missing.
- No endpoint-specific throttling middleware is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated product inventory update route
- `InventoryController::update` — request handling and response wrapper
- `UpdateInventoryRequest` — optional threshold validation
- `InventoryService::update`, `getOwnedInventory`, and `getApprovedVendor` — vendor access and product-level inventory rules
- `InventoryRepository::update` — persistence and product relation loading
- `InventoryResource` and `ProductResource` — response fields
- `bootstrap/app.php` — API validation, authentication, and exception responses
