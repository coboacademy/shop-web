# List Products in a Vendor Store

Returns the products in a store belonging to the authenticated user's vendor profile, newest first.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/vendor/stores/{store}/products` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `store` | UUID | Yes | ID of the store whose products to list. |

## Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `page` | integer | No | Page number to retrieve. |
| `per_page` | integer | No | Number of products per page. Defaults to `15`; values above `100` are capped at `100`. |

The endpoint does not explicitly validate a minimum for `per_page`; behavior for zero or negative values is unverified.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/vendor/stores/00000000-0000-4000-8000-000000000004/products?page=1&per_page=15" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL. All example IDs, names, values, and timestamps below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Products retrieved successfully.",
  "data": {
    "products": {
      "data": [
        {
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
          "stock_summary": {
            "quantity": 10,
            "reserved_quantity": 1,
            "available_quantity": 9
          },
          "categories": [],
          "published_at": null,
          "created_at": "2026-10-31T02:15:00.000000Z",
          "updated_at": "2026-10-31T02:15:00.000000Z"
        }
      ],
      "links": {
        "first": "<API_BASE_URL>/api/vendor/stores/00000000-0000-4000-8000-000000000004/products?page=1",
        "last": "<API_BASE_URL>/api/vendor/stores/00000000-0000-4000-8000-000000000004/products?page=1",
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
            "url": "<API_BASE_URL>/api/vendor/stores/00000000-0000-4000-8000-000000000004/products?page=1",
            "label": "1",
            "active": true
          },
          {
            "url": null,
            "label": "Next &raquo;",
            "active": false
          }
        ],
        "path": "<API_BASE_URL>/api/vendor/stores/00000000-0000-4000-8000-000000000004/products",
        "per_page": 15,
        "to": 1,
        "total": 1
      }
    }
  }
}
```

If the store has no products, `data.products.data` is an empty array. Pagination links and metadata depend on the result set and requested page.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.products.data` | Products on the current page. |
| `data.products.data[].id` | Product UUID. |
| `data.products.data[].store_id` | UUID of the product's store. |
| `data.products.data[].name` | Product name. |
| `data.products.data[].slug` | Product slug. |
| `data.products.data[].sku` | Product SKU, or `null`. |
| `data.products.data[].short_description` | Short description, or `null`. |
| `data.products.data[].description` | Product description, or `null`. |
| `data.products.data[].price` | Product price. |
| `data.products.data[].compare_at_price` | Comparison price, or `null`. |
| `data.products.data[].status` | Product status. This listing does not filter by status. |
| `data.products.data[].is_featured` | Whether the product is featured. |
| `data.products.data[].stock_summary` | Aggregate quantity, reserved, and available stock when inventory relations are loaded. |
| `data.products.data[].categories` | Categories assigned to the product. |
| `data.products.data[].published_at` | Publication timestamp, or `null`. |
| `data.products.data[].created_at` | Product creation timestamp. |
| `data.products.data[].updated_at` | Last product update timestamp. |
| `data.products.links` | Pagination URLs. |
| `data.products.meta` | Pagination information, including page, page size, and total. |

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

### Vendor Profile Missing

The service throws a runtime exception if the authenticated user has no vendor profile. The API exception handler returns `500`; its message is `Server error.` when debug mode is disabled. The exact message can differ when debug mode is enabled.

## Behavior Notes

- The service obtains the vendor profile from the authenticated user; the request cannot specify a vendor ID.
- The store is first looked up by both its ID and the authenticated user's vendor ID.
- Products are filtered by store ID, ordered newest first, and include loaded categories and inventory relations used for the response.
- The listing does not filter products by status or require the store to be active.
- No request body or endpoint-specific throttling middleware is defined.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated vendor store product-list route
- `ProductController::index` — pagination input and response wrapper
- `ProductService::getStoreProducts` — vendor and store ownership checks
- `ProductRepository::findByStoreId` — product query, ordering, eager loading, and pagination
- `ProductResource` and `CategoryResource` — response fields
- `bootstrap/app.php` — API authentication and exception responses
