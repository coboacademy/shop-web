# Create Inventory for a Vendor Product

Creates product-level inventory for a product owned by the authenticated vendor. Products with variants must use variant inventory instead.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/vendor/products/{product}/inventory` |
| Authentication | Required; Sanctum bearer token |
| Content-Type | `application/json` |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `product` | UUID | Yes | ID of the product for which to create inventory. |

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
| `quantity` | integer | Yes | Must be at least `0`. |
| `low_stock_threshold` | integer or `null` | No | If provided, must be at least `0`. Defaults to `10` when omitted or `null`. |

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/vendor/products/00000000-0000-4000-8000-000000000010/inventory" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "quantity": 10,
    "low_stock_threshold": 2
  }'
```

Replace `<API_BASE_URL>` with the API base URL. All example IDs, names, values, and timestamps are illustrative.

## Successful Response

**HTTP status:** `201 Created`

```json
{
  "status": "success",
  "message": "Inventory created successfully.",
  "data": {
    "inventory": {
      "id": "00000000-0000-4000-8000-000000000050",
      "product_id": "00000000-0000-4000-8000-000000000010",
      "variant_id": null,
      "quantity": 10,
      "reserved_quantity": 0,
      "available_quantity": 10,
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
        "status": "draft",
        "is_featured": false,
        "published_at": null,
        "created_at": "2026-10-31T02:20:00.000000Z",
        "updated_at": "2026-10-31T02:20:00.000000Z"
      },
      "variant": null,
      "created_at": "2026-10-31T03:10:00.000000Z",
      "updated_at": "2026-10-31T03:10:00.000000Z"
    }
  }
}
```

All example IDs, names, values, and timestamps are illustrative. `variant_id` and `variant` are `null` because this endpoint creates product-level inventory.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the operation succeeded. |
| `message` | Response message. |
| `data.inventory.id` | Inventory UUID. |
| `data.inventory.product_id` | Associated product UUID. |
| `data.inventory.variant_id` | Variant UUID; `null` for product-level inventory. |
| `data.inventory.quantity` | Initial total quantity in stock. |
| `data.inventory.reserved_quantity` | Quantity reserved for orders; initially `0`. |
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

### 404 Product Not Found

Returned when the product does not exist or is not owned by the authenticated vendor.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

### 422 Invalid Request or Product Has Variants

Returned when required fields fail validation or when the product has variants.

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

The service throws a runtime exception if the user has no vendor profile, the vendor is not approved to manage inventory, or product-level inventory already exists. The API exception handler returns `500`; its message is `Server error.` when debug mode is disabled. The exact message can differ when debug mode is enabled.

## Behavior Notes

- The service requires the authenticated user to have an approved vendor profile and scopes the product lookup through the product's store to that vendor.
- Products with variants cannot use this endpoint; use the corresponding variant inventory endpoint.
- Only one product-level inventory record may be created. Attempting to create another triggers a runtime exception handled as `500`.
- When `low_stock_threshold` is omitted or `null`, the service uses `10`. The initial `reserved_quantity` defaults to `0`, and `variant_id` is `null`.
- Creation and the initial `stock_in` inventory movement are recorded in a database transaction.
- No endpoint-specific throttling middleware is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated product inventory creation route
- `InventoryController::store` — request handling and `201 Created` response
- `StoreInventoryRequest` — quantity and threshold validation
- `InventoryService::create`, `getOwnedProduct`, and `getApprovedVendor` — vendor access, product-level constraints, default threshold, and initial movement
- `InventoryRepository::findByProduct` and `create` — duplicate check and persistence
- `InventoryResource` and `ProductResource` — response fields
- `bootstrap/app.php` — API validation, authentication, and exception responses
