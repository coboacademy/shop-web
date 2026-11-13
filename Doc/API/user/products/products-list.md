# List Public Products

Returns a paginated list of active products, ordered from newest to oldest. Optional filters can narrow the results by search text, category, store, or price range.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/products` |
| Authentication | Not required |
| Response format | `application/json` |

The route is registered in `routes/api.php`.

## Query Parameters

| Parameter | Type | Required | Default | Validation / behavior |
|---|---|---|---:|---|
| `search` | string | No | — | Maximum 100 characters; searches product name and description |
| `category_id` | string | No | — | Returns products associated with this category |
| `store_id` | string | No | — | Returns products belonging to this store |
| `min_price` | number | No | — | Must be at least `0`; filters for products at or above this price |
| `max_price` | number | No | — | Must be at least `0`; filters for products at or below this price |
| `per_page` | integer | No | `20` | Must be between `1` and `100` |
| `page` | integer | No | `1` | Selects the paginator page |

Each provided filter is applied independently. The endpoint does not validate that `min_price` is less than or equal to `max_price`. Although zero is accepted by validation, the repository applies price filters only when their values are truthy, so a `min_price=0` or `max_price=0` is effectively ignored.

## Example Request

```bash
curl -G "<API_BASE_URL>/api/products" \
  -H "Accept: application/json" \
  --data-urlencode "search=coffee" \
  --data-urlencode "category_id=<CATEGORY_ID>" \
  --data-urlencode "min_price=5" \
  --data-urlencode "max_price=50" \
  --data-urlencode "per_page=20" \
  --data-urlencode "page=1"
```

Replace `<API_BASE_URL>` with the API base URL and `<CATEGORY_ID>` with a category identifier. Example values are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Products retrieved successfully.",
  "data": {
    "products": [
      {
        "id": "00000000-0000-4000-8000-000000000001",
        "name": "Example Coffee",
        "slug": "example-coffee",
        "description": "Illustrative product description.",
        "price": "12.50",
        "compare_at_price": null,
        "store": {
          "id": "00000000-0000-4000-8000-000000000002",
          "name": "Example Store",
          "slug": "example-store",
          "logo": null,
          "logo_url": null,
          "cover_image_url": null
        },
        "categories": [],
        "images": [],
        "created_at": "2026-10-30T09:00:00.000000Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "last_page": 1,
      "per_page": 20,
      "total": 1
    }
  }
}
```

All IDs, product values, and timestamps in this response are illustrative. The `price` and `compare_at_price` values are serialized using the product model's decimal casts. The resource includes loaded store, category, and image data; categories and images are empty in this example.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.products` | Product resources for the current page. |
| `data.products[].id` | Product UUID. |
| `data.products[].name` | Product name. |
| `data.products[].slug` | Product slug. |
| `data.products[].description` | Product description. |
| `data.products[].price` | Product price. |
| `data.products[].compare_at_price` | Optional comparison price; may be `null`. |
| `data.products[].store` | Loaded store summary. |
| `data.products[].categories` | Loaded category resources. |
| `data.products[].images` | Loaded product image resources. |
| `data.products[].created_at` | Product creation timestamp. |
| `data.pagination.current_page` | Current page number. |
| `data.pagination.last_page` | Last available page. |
| `data.pagination.per_page` | Number of products per page. |
| `data.pagination.total` | Total number of matching active products. |

## Error Responses

### 422 Unprocessable Content

Returned when a query parameter fails validation. For example, `per_page` must be an integer from 1 through 100, and `search` cannot exceed 100 characters. API validation errors use the application's JSON validation response format.

## Behavior Notes

- Only products with `status` equal to `active` are listed.
- Results are ordered newest first.
- The endpoint eager-loads each product's store, categories, and images.
- Search matches product name or description.
- Price bounds are inclusive.
- No endpoint-specific authentication or throttle middleware is declared.

## Implementation References

This documentation is based on:

- `routes/api.php` — public products route
- `PublicProductController::index` — query validation, pagination, and response wrapper
- `PublicProductService::paginate` — service delegation
- `PublicProductRepository::paginate` — active-product filtering, supported filters, ordering, and eager loading
- `PublicProductResource` — product response fields
- `ApiResponse` — standardized success response

The route middleware was checked with `php artisan route:list`. No feature test specific to the public product listing endpoint was found during the documented review.
