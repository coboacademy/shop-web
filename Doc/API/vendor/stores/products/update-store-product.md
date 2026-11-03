# Update a Vendor Store Product

Updates fields on a product in a store belonging to the authenticated user's vendor profile.

## Endpoint

| Property | Value |
|---|---|
| Method | `PATCH` |
| Path | `/api/vendor/stores/{store}/products/{product}` |
| Authentication | Required; Sanctum bearer token |
| Content-Type | `application/json` |
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
Content-Type: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Request Body

All fields are optional. Omitted fields remain unchanged. Fields accepting `null` can be cleared by sending `null`.

| Field | Type | Required | Validation Rules |
|---|---|---|---|
| `name` | string | No | If provided, minimum 3 and maximum 200 characters. |
| `sku` | string | No | If provided, maximum 100 characters. Must remain unique within the store. |
| `short_description` | string or `null` | No | If provided, maximum 500 characters. |
| `description` | string or `null` | No | If provided, no maximum length is specified by the request validator. |
| `price` | number | No | If provided, must be numeric and at least `0`. |
| `compare_at_price` | number or `null` | No | If provided, must be numeric and at least `0`. |

## Example Request

```bash
curl -X PATCH "<API_BASE_URL>/api/vendor/stores/00000000-0000-4000-8000-000000000004/products/00000000-0000-4000-8000-000000000010" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "name": "Example Updated Product",
    "price": 44.99,
    "short_description": null
  }'
```

Replace `<API_BASE_URL>` with the API base URL. All example IDs, names, values, and timestamps are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Product updated successfully.",
  "data": {
    "product": {
      "id": "00000000-0000-4000-8000-000000000010",
      "store_id": "00000000-0000-4000-8000-000000000004",
      "name": "Example Updated Product",
      "slug": "example-updated-product",
      "sku": "EXAMPLE-001",
      "short_description": null,
      "description": "Illustrative product description.",
      "price": "44.99",
      "compare_at_price": "59.99",
      "status": "draft",
      "is_featured": false,
      "stock_summary": {
        "quantity": 10,
        "reserved_quantity": 1,
        "available_quantity": 9
      },
      "categories": [],
      "published_at": null,
      "created_at": "2026-10-31T02:20:00.000000Z",
      "updated_at": "2026-10-31T02:25:00.000000Z"
    }
  }
}
```

The response contains the full product resource, including fields not supplied in the update. If the name changes, the service generates a new slug unique within the store.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the operation succeeded. |
| `message` | Response message. |
| `data.product.id` | Product UUID. |
| `data.product.store_id` | UUID of the product's store. |
| `data.product.name` | Product name. |
| `data.product.slug` | Product slug; regenerated when the name changes. |
| `data.product.sku` | Product SKU. |
| `data.product.short_description` | Short description, or `null`. |
| `data.product.description` | Product description, or `null`. |
| `data.product.price` | Product price, represented as a decimal string. |
| `data.product.compare_at_price` | Comparison price, represented as a decimal string, or `null`. |
| `data.product.status` | Product status. |
| `data.product.is_featured` | Whether the product is featured. |
| `data.product.stock_summary` | Aggregate inventory quantity, reserved quantity, and available quantity when inventory relations are loaded. |
| `data.product.categories` | Categories assigned to the product when the relation is loaded. |
| `data.product.published_at` | Publication timestamp, or `null`. |
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

### 422 Unprocessable Content

Returned when a provided field fails validation, such as a name shorter than 3 characters or a negative/non-numeric price.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "price": [
      "The price field must be at least 0."
    ]
  }
}
```

### Vendor Profile Missing

The service throws a runtime exception if the authenticated user has no vendor profile. The API exception handler returns `500`; its message is `Server error.` when debug mode is disabled. The exact message can differ when debug mode is enabled.

## Behavior Notes

- The service obtains the vendor profile from the authenticated user; the request cannot specify a vendor ID.
- The store is checked against the authenticated user's vendor ID, and the product is separately checked against the specified store ID.
- If `name` changes, the service generates a new slug unique within the store. If the name is unchanged or omitted, the current slug remains.
- The request does not accept fields such as `status`, `is_featured`, or `published_at`.
- SKU uniqueness is enforced by a database constraint, not by request validation. Supplying an SKU already used in this store can cause a database exception handled as `500`.
- No endpoint-specific throttling middleware is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated vendor product update route
- `ProductController::update` — request handling and response wrapper
- `UpdateProductRequest` — optional fields and validation rules
- `ProductService::update` — vendor/store/product ownership checks and slug update
- `ProductRepository::update` — persistence and refreshed model
- `Product` and products migration — casts and store-scoped SKU/slug uniqueness
- `ProductResource` — response fields
- `bootstrap/app.php` — API validation, authentication, and exception responses
