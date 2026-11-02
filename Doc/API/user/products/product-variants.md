# List Active Variants for a Product

Returns the active variants associated with a product, including their option values.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/products/{product}/variants` |
| Authentication | Not required |
| Response format | `application/json` |

The route is registered in `routes/api.php`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `product` | UUID | Yes | ID of the product whose active variants to retrieve |

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/products/<PRODUCT_UUID>/variants" \
  -H "Accept: application/json"
```

Replace `<API_BASE_URL>` with the API base URL and `<PRODUCT_UUID>` with a product UUID. Example identifiers and values below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Product variants retrieved successfully.",
  "data": {
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
        "created_at": "2026-10-30T09:00:00.000000Z",
        "updated_at": "2026-10-30T09:00:00.000000Z"
      }
    ]
  }
}
```

The `inventory` property is omitted from this endpoint's variant objects because inventory is not loaded by this query. If the product exists but has no active variants, `data.variants` is an empty array.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.variants` | Active variants belonging to the product. |
| `data.variants[].id` | Variant identifier. |
| `data.variants[].product_id` | Product UUID associated with the variant. |
| `data.variants[].sku` | Variant SKU. |
| `data.variants[].price` | Variant price. |
| `data.variants[].compare_at_price` | Optional comparison price; may be `null`. |
| `data.variants[].is_active` | Active state; returned variants have this set to `true`. |
| `data.variants[].sort_order` | Variant ordering value. |
| `data.variants[].option_values` | Option value resources associated with the variant. |
| `data.variants[].created_at` | Variant creation timestamp. |
| `data.variants[].updated_at` | Variant update timestamp. |

Each option value includes `id`, `option_id`, `value`, `color_code`, `image`, `sort_order`, `created_at`, and `updated_at`. Nullable values may be `null`. Prices may be serialized as strings.

## Error Responses

### 404 Not Found

Returned when the supplied product ID does not match a product. The API exception handler returns:

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

This query does not filter the parent product by its active status. Therefore, a product that exists but is inactive may still return its active variants through this endpoint.

## Behavior Notes

- The route does not require authentication and has no endpoint-specific throttle middleware.
- Only variants with `is_active` set to `true` are returned.
- Variants are returned without explicit ordering or pagination.
- The query loads option values and their associated option models; the response resource exposes the option value fields, not the nested option model.
- Inventory is not loaded or returned by this endpoint.

## Implementation References

This documentation is based on:

- `routes/api.php` — public product variants route
- `PublicProductController::variants` — response wrapper
- `PublicProductService::variants` — service delegation
- `PublicProductRepository::getVariants` — product lookup, active-variant filter, and option-value loading
- `ProductVariantResource` and `ProductOptionValueResource` — response fields
- `bootstrap/app.php` — API not-found error response

The route middleware was checked with `php artisan route:list`. No feature test specific to the public product variants endpoint was found during the documented review.
