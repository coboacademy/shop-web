# List Images for a Vendor Store Product

Returns the images attached to a product in a store belonging to the authenticated vendor.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/vendor/stores/{store}/products/{product}/images` |
| Authentication | Required; Sanctum bearer token |
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
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/vendor/stores/00000000-0000-4000-8000-000000000004/products/00000000-0000-4000-8000-000000000010/images" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL. All example IDs, values, and timestamps are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Product images retrieved successfully.",
  "data": {
    "images": [
      {
        "id": "00000000-0000-4000-8000-000000000020",
        "product_id": "00000000-0000-4000-8000-000000000010",
        "image": "products/00000000-0000-4000-8000-000000000010/example-image.webp",
        "url": "<PUBLIC_IMAGE_URL>",
        "is_primary": true,
        "sort_order": 0,
        "created_at": "2026-10-31T02:40:00.000000Z",
        "updated_at": "2026-10-31T02:40:00.000000Z"
      }
    ]
  }
}
```

If the product has no images, `data.images` is an empty array. Images are ordered by `sort_order`, then by `created_at`.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.images` | Product image records in display order. |
| `data.images[].id` | Image UUID. |
| `data.images[].product_id` | UUID of the associated product. |
| `data.images[].image` | Stored image path on the public disk. |
| `data.images[].url` | Public URL for the image. |
| `data.images[].is_primary` | Whether the image is marked primary. |
| `data.images[].sort_order` | Image display-order value. |
| `data.images[].created_at` | Image creation timestamp. |
| `data.images[].updated_at` | Last image update timestamp. |

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

Returned when the store does not exist or is not owned by the authenticated vendor, or when the product does not exist in the specified store.

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
- It verifies that the store belongs to the vendor and that the product belongs to the specified store.
- The result is a plain collection, not paginated.
- No request body or query parameters are used, and no endpoint-specific throttling middleware is defined.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated product image-list route
- `ProductImageController::index` — request handling and response wrapper
- `ProductImageService::getImages` and `getOwnedProduct` — vendor approval and ownership checks
- `ProductImageRepository::getByProduct` — ordering by sort order and creation time
- `ProductImageResource` — response fields and public image URL
- `bootstrap/app.php` — API authentication and exception responses
