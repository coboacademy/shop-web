# Set a Vendor Product's Primary Image

Marks one image as the primary image for a product in a store belonging to the authenticated vendor.

## Endpoint

| Property | Value |
|---|---|
| Method | `PATCH` |
| Path | `/api/vendor/stores/{store}/products/{product}/images/{image}/primary` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `store` | UUID | Yes | ID of the vendor's store. |
| `product` | UUID | Yes | ID of the product in that store. |
| `image` | UUID | Yes | ID of the product image to mark as primary. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Example Request

```bash
curl -X PATCH "<API_BASE_URL>/api/vendor/stores/00000000-0000-4000-8000-000000000004/products/00000000-0000-4000-8000-000000000010/images/00000000-0000-4000-8000-000000000020/primary" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL. All example IDs, values, and timestamps are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Primary product image updated successfully.",
  "data": {
    "image": {
      "id": "00000000-0000-4000-8000-000000000020",
      "product_id": "00000000-0000-4000-8000-000000000010",
      "image": "products/00000000-0000-4000-8000-000000000010/example-image.webp",
      "url": "<PUBLIC_IMAGE_URL>",
      "is_primary": true,
      "sort_order": 1,
      "created_at": "2026-10-31T02:45:00.000000Z",
      "updated_at": "2026-10-31T02:50:00.000000Z"
    }
  }
}
```

The response contains the selected image resource with `is_primary` set to `true`.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the operation succeeded. |
| `message` | Response message. |
| `data.image.id` | Image UUID. |
| `data.image.product_id` | UUID of the associated product. |
| `data.image.image` | Stored image path on the public disk. |
| `data.image.url` | Public URL for the image. |
| `data.image.is_primary` | Whether the image is primary; `true` after this operation. |
| `data.image.sort_order` | Image display-order value. |
| `data.image.created_at` | Image creation timestamp. |
| `data.image.updated_at` | Last image update timestamp. |

## Error Responses

### 401 Unauthenticated

Returned when the request does not include a valid authenticated session or bearer token.

```json
{
  "status": "error",
  "message": "Unauthenticated."
}
```

### 404 Store, Product, or Image Not Found

Returned when the store is not owned by the authenticated vendor, the product does not belong to the specified store, or the image does not belong to the specified product.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

### Vendor Profile or Approval Error

The service throws a runtime exception if the user has no vendor profile or the vendor is not approved to manage product images. The API exception handler returns `500`; its message is `Server error.` when debug mode is disabled. The exact message can differ when debug mode is enabled.

## Behavior Notes

- The service verifies the authenticated user's vendor profile and requires the vendor status to be approved.
- It verifies that the store belongs to the vendor, the product belongs to the store, and the selected image belongs to the product.
- Existing primary flags for the product's images are cleared before the selected image is marked primary.
- The endpoint has no request body or query parameters, and no endpoint-specific throttling middleware is defined.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated set-primary image route
- `ProductImageController::setPrimary` — request handling and response wrapper
- `ProductImageService::setPrimary` and `getOwnedProduct` — authorization, image selection, and primary flag behavior
- `ProductImageRepository::findByIdForProductOrFail`, `clearPrimaryImages`, and `update` — image scoping and persistence
- `ProductImageResource` — response fields and public image URL
- `bootstrap/app.php` — API authentication and exception responses
