# Deactivate a Vendor Store Product

Deactivates a product in a store belonging to the authenticated user's vendor profile.

## Endpoint

| Property | Value |
|---|---|
| Method | `PATCH` |
| Path | `/api/vendor/stores/{store}/products/{product}/deactivate` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `store` | UUID | Yes | ID of the vendor's store. |
| `product` | UUID | Yes | ID of the product in that store. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Example Request

```bash
curl -X PATCH "<API_BASE_URL>/api/vendor/stores/00000000-0000-4000-8000-000000000004/products/00000000-0000-4000-8000-000000000010/deactivate" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL. All example IDs, names, values, and timestamps are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Product deactivated successfully.",
  "data": {
    "product": {
      "id": "00000000-0000-4000-8000-000000000010",
      "store_id": "00000000-0000-4000-8000-000000000004",
      "name": "Example Product",
      "slug": "example-product",
      "sku": "EXAMPLE-001",
      "short_description": "Illustrative short description.",
      "description": "Illustrative product description.",
      "price": "49.99",
      "compare_at_price": "59.99",
      "status": "inactive",
      "is_featured": false,
      "stock_summary": {
        "quantity": 10,
        "reserved_quantity": 1,
        "available_quantity": 9
      },
      "categories": [],
      "published_at": "2026-10-31T02:30:00.000000Z",
      "created_at": "2026-10-31T02:20:00.000000Z",
      "updated_at": "2026-10-31T02:35:00.000000Z"
    }
  }
}
```

The response contains the full product resource. Deactivation changes `status` to `inactive`; it does not clear `published_at`.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the operation succeeded. |
| `message` | Response message. |
| `data.product.id` | Product UUID. |
| `data.product.store_id` | UUID of the product's store. |
| `data.product.name` | Product name. |
| `data.product.slug` | Product slug. |
| `data.product.sku` | Product SKU. |
| `data.product.short_description` | Short description, or `null`. |
| `data.product.description` | Product description, or `null`. |
| `data.product.price` | Product price, represented as a decimal string. |
| `data.product.compare_at_price` | Comparison price, represented as a decimal string, or `null`. |
| `data.product.status` | Product status; `inactive` after this operation. |
| `data.product.is_featured` | Whether the product is featured. |
| `data.product.stock_summary` | Aggregate inventory quantity, reserved quantity, and available quantity. |
| `data.product.categories` | Categories assigned to the product. |
| `data.product.published_at` | Publication timestamp, retained by deactivation. |
| `data.product.created_at` | Product creation timestamp. |
| `data.product.updated_at` | Last product update timestamp. |

## Error Responses

### 401 Unauthenticated

Returned when the request does not include a valid authenticated session or bearer token.

```json
{
  "status": "error",
  "message": "Unauthenticated."
}
```

### 404 Store or Product Not Found

Returned when the store does not exist or is not owned by the authenticated user's vendor profile, or when the product does not exist in the specified store.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

### Vendor Profile Missing

The service throws a runtime exception if the authenticated user has no vendor profile. The API exception handler returns `500`; its message is `Server error.` when debug mode is disabled. The exact message can differ when debug mode is enabled.

## Behavior Notes

- The service obtains the vendor profile from the authenticated user; the request cannot specify a vendor ID.
- The store is checked against the authenticated user's vendor ID, and the product is separately checked against the specified store ID.
- The operation sets product status to `inactive`. It does not change `published_at`.
- The endpoint does not require the vendor to be approved or the store to be active.
- The endpoint has no request body, query parameters, or endpoint-specific throttling middleware.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated vendor product deactivation route
- `ProductController::deactivate` — request handling and response wrapper
- `ProductService::deactivate` — product state transition
- `ProductService::getProduct` — vendor/store/product ownership checks
- `ProductRepository::findByIdForStoreOrFail` and `ProductRepository::update` — lookup and persistence
- `ProductResource` — response fields
- `bootstrap/app.php` — API authentication and exception responses
