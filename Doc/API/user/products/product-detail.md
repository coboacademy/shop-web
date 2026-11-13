# Get a Public Product

Returns the details of an active product, including its store, categories, images, options, and variants.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/products/{product}` |
| Authentication | Not required |
| Response format | `application/json` |

The route is registered in `routes/api.php`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `product` | UUID | Yes | ID of the product to retrieve |

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/products/<PRODUCT_UUID>" \
  -H "Accept: application/json"
```

Replace `<API_BASE_URL>` with the API base URL and `<PRODUCT_UUID>` with the product's UUID.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Product retrieved successfully.",
  "data": {
    "product": {
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
      "categories": [
        {
          "id": 10,
          "parent_id": null,
          "name": "Coffee",
          "slug": "coffee",
          "description": null,
          "image": null,
          "image_url": null,
          "icon": null,
          "icon_url": null,
          "is_active": true,
          "created_at": "2026-10-30T09:00:00.000000Z",
          "updated_at": "2026-10-30T09:00:00.000000Z"
        }
      ],
      "images": [
        {
          "id": 20,
          "product_id": "00000000-0000-4000-8000-000000000001",
          "image": "products/example-coffee.jpg",
          "url": "<PUBLIC_STORAGE_URL>/products/example-coffee.jpg",
          "is_primary": true,
          "sort_order": 0,
          "created_at": "2026-10-30T09:00:00.000000Z",
          "updated_at": "2026-10-30T09:00:00.000000Z"
        }
      ],
      "options": [
        {
          "id": 30,
          "product_id": "00000000-0000-4000-8000-000000000001",
          "name": "Size",
          "display_type": "select",
          "sort_order": 0,
          "values": [
            {
              "id": 31,
              "option_id": 30,
              "value": "Medium",
              "color_code": null,
              "image": null,
              "sort_order": 0,
              "created_at": "2026-10-30T09:00:00.000000Z",
              "updated_at": "2026-10-30T09:00:00.000000Z"
            }
          ],
          "created_at": "2026-10-30T09:00:00.000000Z",
          "updated_at": "2026-10-30T09:00:00.000000Z"
        }
      ],
      "variants": [
        {
          "id": 40,
          "product_id": "00000000-0000-4000-8000-000000000001",
          "sku": "EXAMPLE-COFFEE-M",
          "price": "12.50",
          "compare_at_price": null,
          "is_active": true,
          "sort_order": 0,
          "option_values": [
            {
              "id": 31,
              "option_id": 30,
              "value": "Medium",
              "color_code": null,
              "image": null,
              "sort_order": 0,
              "created_at": "2026-10-30T09:00:00.000000Z",
              "updated_at": "2026-10-30T09:00:00.000000Z"
            }
          ],
          "inventory": {
            "id": 50,
            "quantity": 20,
            "reserved_quantity": 2,
            "available_quantity": 18,
            "low_stock_threshold": 5,
            "is_low_stock": false,
            "is_out_of_stock": false
          },
          "created_at": "2026-10-30T09:00:00.000000Z",
          "updated_at": "2026-10-30T09:00:00.000000Z"
        }
      ],
      "created_at": "2026-10-30T09:00:00.000000Z"
    }
  }
}
```

All IDs, product data, timestamps, and storage URLs in the example are illustrative. Decimal price fields may be serialized as strings. Empty relationships are returned as empty arrays; nullable fields may be `null`.

## Response Fields

### Product

| Field | Description |
|---|---|
| `data.product.id` | Product UUID. |
| `data.product.name` | Product name. |
| `data.product.slug` | Product slug. |
| `data.product.description` | Product description. |
| `data.product.price` | Product price. |
| `data.product.compare_at_price` | Comparison price, if set. |
| `data.product.store` | Store summary containing ID, name, slug, logo paths, and cover image URL. |
| `data.product.categories` | Product category resources. |
| `data.product.images` | Product image resources, including path, URL, primary flag, and sort order. |
| `data.product.options` | Product option resources and their values. |
| `data.product.variants` | Product variants, option values, and inventory summaries. |
| `data.product.created_at` | Product creation timestamp. |

### Variant inventory

When inventory exists, a variant's `inventory` object contains `id`, `quantity`, `reserved_quantity`, `available_quantity`, `low_stock_threshold`, `is_low_stock`, and `is_out_of_stock`. If the loaded variant has no inventory record, `inventory` is `null`.

## Error Responses

### 404 Not Found

Returned when the UUID does not identify an active product. The API exception handler returns:

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

Products with a status other than `active` are not returned by this public endpoint and produce the same not-found response as an unknown UUID.

## Behavior Notes

- The route does not require authentication and has no endpoint-specific throttle middleware.
- Product lookup is by UUID, not slug.
- Only products with `status` equal to `active` are available through this endpoint.
- The controller eager-loads the store, categories, images, options and their values, and variants with option values and inventory.

## Implementation References

This documentation is based on:

- `routes/api.php` — public product detail route
- `PublicProductController::show` — lookup and response wrapper
- `PublicProductService::find` — not-found handling
- `PublicProductRepository::findById` — active-product condition and eager-loaded relations
- `PublicProductResource` — product fields and nested resources
- `CategoryResource`, `ProductImageResource`, `ProductOptionResource`, `ProductOptionValueResource`, and `ProductVariantResource` — nested response shapes
- `bootstrap/app.php` — API not-found error response

The route middleware was checked with `php artisan route:list`. No feature test specific to the public product detail endpoint was found during the documented review.
