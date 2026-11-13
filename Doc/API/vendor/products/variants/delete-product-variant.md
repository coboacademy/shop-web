# Delete a Product Variant

Deletes a variant belonging to a product owned by the authenticated vendor.

## Endpoint

| Property | Value |
|---|---|
| Method | `DELETE` |
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
curl -X DELETE "<API_BASE_URL>/api/vendor/products/00000000-0000-4000-8000-000000000010/variants/00000000-0000-4000-8000-000000000020" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Product variant deleted successfully.",
  "data": []
}
```

## Errors

- `401` — Missing or invalid authentication.
- `404` — Product not found, or variant not found / not associated with the
  supplied product.
- `500` — Vendor profile missing, product not owned by the vendor, or the
  variant still has an inventory record. The API exception handler returns
  `Server error.` unless debug mode is enabled.

## Related Endpoints

- [List product variants](./list-product-variants.md)
- [Create a variant](./create-product-variant.md)
- [View a variant](./product-variant-detail.md)
- [Update a variant](./update-product-variant.md)
- [Manage variant inventory](./inventory/variant-inventory-detail.md)
