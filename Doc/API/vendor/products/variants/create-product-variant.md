# Create a Product Variant

Creates a variant for a product owned by the authenticated vendor, associates
its option values, and creates its inventory record.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/vendor/products/{product}/variants` |
| Authentication | Required; Sanctum bearer token |
| Content-Type | `application/json` |

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `product` | UUID | Yes | ID of the vendor-owned product. |

## Request Body

| Field | Type | Required | Validation / Description |
|---|---|---|---|
| `sku` | string | Yes | Maximum 100 characters; unique among variants of this product. |
| `price` | number or `null` | No | Must be at least `0`; defaults to `null`. |
| `compare_at_price` | number or `null` | No | Must be at least `0`; defaults to `null`. |
| `is_active` | boolean | No | Defaults to `true`. |
| `sort_order` | integer | No | Must be at least `0`; defaults to `0`. |
| `option_value_ids` | array of UUIDs | Yes | At least one distinct, existing option value. Values must belong to this product, and only one value per option is allowed. |
| `inventory` | object | No | Initial inventory settings. |
| `inventory.quantity` | integer | No | Initial quantity; must be at least `0`; defaults to `0`. |
| `inventory.low_stock_threshold` | integer | No | Must be at least `0`; defaults to `10`. |

The combination of option values must not already be used by another variant.

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/vendor/products/00000000-0000-4000-8000-000000000010/variants" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "sku": "SHIRT-BLUE-M",
    "price": 29.99,
    "compare_at_price": 34.99,
    "is_active": true,
    "sort_order": 1,
    "option_value_ids": [
      "00000000-0000-4000-8000-000000000030",
      "00000000-0000-4000-8000-000000000031"
    ],
    "inventory": {
      "quantity": 12,
      "low_stock_threshold": 3
    }
  }'
```

## Successful Response

**HTTP status:** `201 Created`

```json
{
  "status": "success",
  "message": "Product variant created successfully.",
  "data": {
    "variant": {
      "id": "00000000-0000-4000-8000-000000000020",
      "product_id": "00000000-0000-4000-8000-000000000010",
      "sku": "SHIRT-BLUE-M",
      "price": "29.99",
      "compare_at_price": "34.99",
      "is_active": true,
      "sort_order": 1,
      "option_values": [],
      "inventory": {
        "id": "00000000-0000-4000-8000-000000000050",
        "quantity": 12,
        "reserved_quantity": 0,
        "available_quantity": 12,
        "low_stock_threshold": 3,
        "is_low_stock": false,
        "is_out_of_stock": false
      },
      "created_at": "2026-10-31T02:21:00.000000Z",
      "updated_at": "2026-10-31T02:21:00.000000Z"
    }
  }
}
```

The response's `option_values` array contains each selected value's `id`,
`option_id`, `value`, `color_code`, `image`, `sort_order`, `created_at`, and
`updated_at`.

## Errors

- `401` — Missing or invalid authentication.
- `404` — Product not found.
- `422` — Request validation failed; field errors are returned in `errors`.
- `500` — Vendor profile missing, product not owned by the vendor, duplicate
  SKU or option combination, invalid product option values, or product stock
  must be reconciled before variants can be added. These service exceptions are
  handled as `500` by the current API exception handler (message is
  `Server error.` unless debug mode is enabled).

## Related Endpoints

- [List product variants](./list-product-variants.md)
- [View a variant](./product-variant-detail.md)
- [Update a variant](./update-product-variant.md)
- [Delete a variant](./delete-product-variant.md)
- [Manage variant inventory](./inventory/variant-inventory-detail.md)
