# Get a Product Variant

Returns a variant belonging to a product owned by the authenticated vendor,
including its option values and inventory.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/vendor/products/{product}/variants/{variant}` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `product` | UUID | Yes | ID of the vendor-owned product. |
| `variant` | UUID | Yes | ID of a variant belonging to `product`. |

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/vendor/products/00000000-0000-4000-8000-000000000010/variants/00000000-0000-4000-8000-000000000020" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Product variant retrieved successfully.",
  "data": {
    "variant": {
      "id": "00000000-0000-4000-8000-000000000020",
      "product_id": "00000000-0000-4000-8000-000000000010",
      "sku": "SHIRT-BLUE-M",
      "price": "29.99",
      "compare_at_price": null,
      "is_active": true,
      "sort_order": 1,
      "option_values": [
        {
          "id": "00000000-0000-4000-8000-000000000030",
          "option_id": "00000000-0000-4000-8000-000000000040",
          "value": "Blue",
          "color_code": "#0000FF",
          "image": null,
          "sort_order": 1,
          "created_at": "2026-10-31T02:20:00.000000Z",
          "updated_at": "2026-10-31T02:20:00.000000Z"
        }
      ],
      "inventory": {
        "id": "00000000-0000-4000-8000-000000000050",
        "quantity": 12,
        "reserved_quantity": 2,
        "available_quantity": 10,
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

## Errors

- `401` — Missing or invalid authentication.
- `404` — Product not found, or variant not found / not associated with the
  supplied product.
- `500` — Vendor profile missing or product not owned by the vendor. The API
  exception handler returns `Server error.` unless debug mode is enabled.

## Related Endpoints

- [List product variants](./list-product-variants.md)
- [Create a variant](./create-product-variant.md)
- [Update a variant](./update-product-variant.md)
- [Delete a variant](./delete-product-variant.md)
- [Manage variant inventory](./inventory/variant-inventory-detail.md)
