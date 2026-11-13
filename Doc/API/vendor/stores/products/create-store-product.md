# Create a Product in a Vendor Store

Creates a draft product in a store belonging to the authenticated user's approved vendor profile. The store must be active.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/vendor/stores/{store}/products` |
| Authentication | Required; Sanctum bearer token |
| Content-Type | `application/json` |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `store` | UUID | Yes | ID of the store in which to create the product. |

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
| `name` | string | Yes | Minimum 3 and maximum 200 characters. |
| `sku` | string | Yes | Maximum 100 characters. |
| `short_description` | string or `null` | No | Maximum 500 characters. |
| `description` | string or `null` | No | No maximum length is specified by the request validator. |
| `price` | number | Yes | Must be numeric and at least `0`. |
| `compare_at_price` | number or `null` | No | If provided, must be numeric and at least `0`. |

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/vendor/stores/00000000-0000-4000-8000-000000000004/products" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "name": "Example Product",
    "sku": "EXAMPLE-001",
    "short_description": "Illustrative short description.",
    "description": "Illustrative product description.",
    "price": 49.99,
    "compare_at_price": 59.99
  }'
```

Replace `<API_BASE_URL>` with the API base URL. All example IDs, names, values, and timestamps are illustrative.

## Successful Response

**HTTP status:** `201 Created`

```json
{
  "status": "success",
  "message": "Product created successfully.",
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
      "status": "draft",
      "is_featured": false,
      "published_at": null,
      "created_at": "2026-10-31T02:20:00.000000Z",
      "updated_at": "2026-10-31T02:20:00.000000Z"
    }
  }
}
```

The slug is generated from the product name and made unique within the store. New products start in `draft` status. `stock_summary` and `categories` are omitted from this create response because those relationships are not loaded for the newly created resource.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the operation succeeded. |
| `message` | Response message. |
| `data.product.id` | Product UUID. |
| `data.product.store_id` | UUID of the store. |
| `data.product.name` | Product name. |
| `data.product.slug` | Generated product slug, unique within the store. |
| `data.product.sku` | Product SKU. |
| `data.product.short_description` | Short description, or `null`. |
| `data.product.description` | Product description, or `null`. |
| `data.product.price` | Product price, represented as a decimal string. |
| `data.product.compare_at_price` | Comparison price, represented as a decimal string, or `null`. |
| `data.product.status` | Product status; `draft` for newly created products. |
| `data.product.is_featured` | Whether the product is featured; defaults to `false`. |
| `data.product.published_at` | Publication timestamp; `null` for a new draft. |
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

### 404 Store Not Found

Returned when the store does not exist or does not belong to the authenticated user's vendor profile.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

### 422 Unprocessable Content

Returned when a required field is missing or a provided field fails validation.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "name": [
      "Product name is required."
    ]
  }
}
```

### Vendor or store state errors

The service throws a runtime exception when the user has no vendor profile, the vendor is not approved, or the store is inactive. The API exception handler returns `500`; its message is `Server error.` when debug mode is disabled. The exact message can differ when debug mode is enabled.

## Behavior Notes

- The service obtains the vendor profile from the authenticated user; the request cannot specify a vendor or store ID in the body.
- The store is looked up by both its ID and the authenticated user's vendor ID.
- The vendor must be approved and the store must be active to create a product.
- The service assigns the store ID, generates a unique slug within that store, and sets the initial product status to `draft`.
- The database enforces SKU uniqueness within a store; uniqueness is not checked by the request validator. A duplicate SKU therefore causes a database exception, handled as `500` by the API exception handler.
- The request does not accept fields such as `status`, `is_featured`, `published_at`, or `slug`; their values are assigned by the service or model defaults.
- No endpoint-specific throttling middleware is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated vendor product-creation route
- `ProductController::store` — request handling and `201 Created` response
- `StoreProductRequest` — request validation rules and custom messages
- `ProductService::create` — approval/active-store checks, slug generation, and draft status
- `ProductRepository::create` and `Product` — persistence, casts, and defaults
- `ProductResource` — response fields and conditional relationship fields
- `bootstrap/app.php` — API validation, authentication, and exception responses
