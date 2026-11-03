# Upload a Vendor Store Logo

Uploads or replaces the logo for a store belonging to the authenticated user's vendor profile.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/vendor/stores/{store}/logo` |
| Authentication | Required; Sanctum bearer token |
| Content-Type | `multipart/form-data` |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `store` | UUID | Yes | ID of the store whose logo to upload. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Send the request body as `multipart/form-data`. Allow the HTTP client to set the multipart `Content-Type` boundary.

## Request Body

| Field | Type | Required | Validation Rules |
|---|---|---|---|
| `logo` | file | Yes | Must be an image with a `jpg`, `jpeg`, `png`, or `webp` extension. Maximum size: 2048 KB. |

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/vendor/stores/00000000-0000-4000-8000-000000000004/logo" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -F "logo=@/path/to/example-logo.png"
```

Replace `<API_BASE_URL>` with the API base URL, `<YOUR_TOKEN>` with a valid token, and the example file path with the image to upload. The example store ID is illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Store logo uploaded successfully.",
  "data": {
    "store": {
      "id": "00000000-0000-4000-8000-000000000004",
      "name": "Example Downtown Store",
      "slug": "example-downtown-store",
      "email": "store@example.com",
      "phone": "+1-555-0100",
      "description": "Illustrative store description.",
      "logo": "<PUBLIC_LOGO_URL>",
      "logo_url": "<PUBLIC_LOGO_URL>",
      "cover_image": null,
      "cover_image_url": null,
      "country": "Example Country",
      "province": "Example Province",
      "city": "Example City",
      "address": "123 Example Street",
      "is_active": true,
      "created_at": "2026-10-31T01:34:00.000000Z",
      "updated_at": "2026-10-31T01:45:00.000000Z"
    }
  }
}
```

All example IDs, names, values, and timestamps are illustrative. Both `logo` and `logo_url` contain the public URL of the uploaded image.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the operation succeeded. |
| `message` | Response message. |
| `data.store.id` | Store UUID. |
| `data.store.name` | Store name. |
| `data.store.slug` | Store slug. |
| `data.store.email` | Store email, or `null`. |
| `data.store.phone` | Store phone, or `null`. |
| `data.store.description` | Store description, or `null`. |
| `data.store.logo` | Public URL of the logo, or `null`. |
| `data.store.logo_url` | Public URL of the logo, or `null`. |
| `data.store.cover_image` | Cover image path/value, or `null`. |
| `data.store.cover_image_url` | Cover image URL, or `null`. |
| `data.store.country` | Store country, or `null`. |
| `data.store.province` | Store province or region, or `null`. |
| `data.store.city` | Store city, or `null`. |
| `data.store.address` | Store address, or `null`. |
| `data.store.is_active` | Whether the store is active. |
| `data.store.created_at` | Store creation timestamp. |
| `data.store.updated_at` | Last store update timestamp. |

## Error Responses

### 401 Unauthenticated

Returned when the request does not include a valid authenticated session or bearer token.

```json
{
  "status": "error",
  "message": "Unauthenticated."
}
```

### 404 Store Not Found

Returned when the store does not exist or does not belong to the authenticated user's vendor profile.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

### 404 Vendor Profile Not Found

If the authenticated user has no vendor profile, the service aborts with `404`. The API exception handler renders that abort with this response:

```json
{
  "status": "error",
  "message": "API route not found."
}
```

### 422 Unprocessable Content

Returned when `logo` is missing, is not a valid image, has an unsupported extension, or exceeds the size limit.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "logo": [
      "The logo field is required."
    ]
  }
}
```

## Behavior Notes

- The service obtains the vendor profile from the authenticated user; the request cannot specify a vendor ID.
- The store lookup filters by both the requested store ID and the authenticated user's vendor ID.
- The uploaded file is stored on the `public` disk in the `stores/logos` directory with a generated UUID filename.
- If the store already has a logo, the service attempts to delete the old file before saving the new path.
- The response contains the full store resource. Both logo fields are derived as a public URL from the stored logo path.
- No endpoint-specific throttling middleware is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated store logo upload route
- `StoreController::uploadLogo` — request handling and response wrapper
- `StoreLogoRequest` — file validation rules
- `StoreService::uploadLogo` — ownership check, file replacement, and store update
- `FileStorageService` — public-disk storage and generated filename
- `StoreResource` and `Store` — response fields and logo URL
- `bootstrap/app.php` — API validation, authentication, and not-found error responses
