# Update a Product Variant

Updates fields on a variant, or replaces its option-value combination, for a
product owned by the authenticated vendor. Only supplied fields are changed.

## Endpoint

| Property | Value |
|---|---|
| Method | `PATCH` |
| Path | `/api/vendor/products/{product}/variants/{variant}` |
| Authentication | Required; Sanctum bearer token |
| Content-Type | `application/json` |

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `product` | UUID | Yes | ID of the vendor-owned product. |
| `variant` | UUID | Yes | ID of a variant belonging to `product`. |

## Request Body

All fields are optional. If provided:

| Field | Type | Validation / Description |
|---|---|---|
| `sku` | string | Maximum 100 characters; unique among variants of this product. |
| `price` | number or `null` | Must be at least `0`. |
| `compare_at_price` | number or `null` | Must be at least `0`. |
| `is_active` | boolean | Whether the variant is active. |
| `sort_order` | integer | Must be at least `0`. |
| `option_value_ids` | array of UUIDs | If supplied, must contain at least one distinct option value. Values must belong to this product, with only one value per option; the combination must be unique. |

Inventory cannot be changed through this endpoint. Use the [variant inventory
endpoints](./inventory/variant-inventory-detail.md).

## Example Request

```bash
curl -X PATCH "<API_BASE_URL>/api/vendor/products/00000000-0000-4000-8000-000000000010/variants/00000000-0000-4000-8000-000000000020" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "price": 27.99,
    "is_active": false
  }'
```

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Product variant updated successfully.",
  "data": {
    "variant": {
      "id": "00000000-0000-4000-8000-000000000020",
      "product_id": "00000000-0000-4000-8000-000000000010",
      "sku": "SHIRT-BLUE-M",
      "price": "27.99",
      "compare_at_price": null,
      "is_active": false,
      "sort_order": 0,
      "option_values": [],
      "inventory": null,
      "created_at": "2026-10-31T02:21:00.000000Z",
      "updated_at": "2026-10-31T02:25:00.000000Z"
    }
  }
}
```

`option_values` and `inventory` reflect the loaded relations in the resource;
they may be empty or `null` if those relations were not loaded.

## Errors

- `401` — Missing or invalid authentication.
- `404` — Product not found, or variant not found / not associated with the
  supplied product.
- `422` — Request validation failed; field errors are returned in `errors`.
- `500` — Vendor profile missing, product not owned by the vendor, duplicate
  SKU or option combination, or invalid product option values. The API
  exception handler returns `Server error.` unless debug mode is enabled.

## Related Endpoints

- [List product variants](./list-product-variants.md)
- [Create a variant](./create-product-variant.md)
- [View a variant](./product-variant-detail.md)
- [Delete a variant](./delete-product-variant.md)
- [Manage variant inventory](./inventory/variant-inventory-detail.md)
