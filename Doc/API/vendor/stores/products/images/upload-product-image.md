# Upload an Image for a Vendor Store Product

Uploads an image for a product in a store belonging to the authenticated vendor.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/vendor/stores/{store}/products/{product}/images` |
| Authentication | Required; Sanctum bearer token |
| Content-Type | `multipart/form-data` |
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

Send the request body as `multipart/form-data`. Allow the HTTP client to set the multipart `Content-Type` boundary.

## Request Body

| Field | Type | Required | Validation Rules |
|---|---|---|---|
| `image` | file | Yes | Must be an image with a `jpg`, `jpeg`, `png`, or `webp` extension. Maximum size: 5120 KB (5 MB). |
| `sort_order` | integer | No | Must be at least `0`. If omitted, the controller supplies `0`. |

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/vendor/stores/00000000-0000-4000-8000-000000000004/products/00000000-0000-4000-8000-000000000010/images" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -F "image=@/path/to/example-product-image.webp" \
  -F "sort_order=0"
```

Replace `<API_BASE_URL>` with the API base URL, `<YOUR_TOKEN>` with a valid token, and the example file path with the image to upload. The example IDs are illustrative.

## Successful Response

**HTTP status:** `201 Created`

```json
{
  "status": "success",
  "message": "Product image uploaded successfully.",
  "data": {
    "image": {
      "id": "00000000-0000-4000-8000-000000000020",
      "product_id": "00000000-0000-4000-8000-000000000010",
      "image": "products/00000000-0000-4000-8000-000000000010/00000000-0000-4000-8000-000000000030.webp",
      "url": "<PUBLIC_IMAGE_URL>",
      "is_primary": true,
      "sort_order": 0,
      "created_at": "2026-10-31T02:45:00.000000Z",
      "updated_at": "2026-10-31T02:45:00.000000Z"
    }
  }
}
```

All example IDs, values, and timestamps are illustrative. The first image uploaded for a product is marked primary; later uploads are not.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the operation succeeded. |
| `message` | Response message. |
| `data.image.id` | Image UUID. |
| `data.image.product_id` | UUID of the associated product. |
| `data.image.image` | Stored image path on the public disk. |
| `data.image.url` | Public URL for the image. |
| `data.image.is_primary` | Whether the image is marked primary. |
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

### 404 Store or Product Not Found

Returned when the store does not exist or is not owned by the authenticated vendor, or when the product does not exist in the specified store.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

### 422 Unprocessable Content

Returned when `image` is missing or fails the file rules, or when `sort_order` is not a non-negative integer.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "image": [
      "Product image is required."
    ]
  }
}
```

### Vendor Profile or Approval Error

The service throws a runtime exception if the user has no vendor profile or the vendor is not approved to manage product images. The API exception handler returns `500`; its message is `Server error.` when debug mode is disabled. The exact message can differ when debug mode is enabled.

## Behavior Notes

- The service verifies the authenticated user's vendor profile and requires the vendor status to be approved.
- It verifies that the store belongs to the vendor and that the product belongs to the specified store.
- The uploaded file is stored on the `public` disk in `products/{product-id}` with a generated UUID filename.
- The first image for a product is marked primary. Subsequent images are not automatically made primary.
- The controller supplies `0` for `sort_order` when the field is omitted.
- No endpoint-specific throttling middleware is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated product image upload route
- `ProductImageController::store` — request handling, sort-order default, and `201 Created` response
- `StoreProductImageRequest` — file and sort-order validation
- `ProductImageService::upload` and `getOwnedProduct` — ownership checks, primary-image behavior, and storage path
- `FileStorageService` — public-disk storage and generated filename
- `ProductImageRepository` — image count and persistence
- `ProductImageResource` — response fields and public image URL
- `bootstrap/app.php` — API validation, authentication, and exception responses
