# Delete a Vendor Store Cover Image

Deletes the cover image for a store belonging to the authenticated user's vendor profile.

## Endpoint

| Property | Value |
|---|---|
| Method | `DELETE` |
| Path | `/api/vendor/stores/{store}/cover` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `store` | UUID | Yes | ID of the store whose cover image to delete. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Example Request

```bash
curl -X DELETE "<API_BASE_URL>/api/vendor/stores/00000000-0000-4000-8000-000000000004/cover" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL. The example store ID is illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Store cover deleted successfully.",
  "data": {
    "store": {
      "id": "00000000-0000-4000-8000-000000000004",
      "name": "Example Downtown Store",
      "slug": "example-downtown-store",
      "email": "store@example.com",
      "phone": "+1-555-0100",
      "description": "Illustrative store description.",
      "logo": null,
      "logo_url": null,
      "cover_image": null,
      "cover_image_url": null,
      "country": "Example Country",
      "province": "Example Province",
      "city": "Example City",
      "address": "123 Example Street",
      "is_active": true,
      "created_at": "2026-10-31T01:34:00.000000Z",
      "updated_at": "2026-10-31T02:00:00.000000Z"
    }
  }
}
```

All example IDs, names, values, and timestamps are illustrative. The response includes the full store resource; after deletion, both `cover_image` and `cover_image_url` are `null`.

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
| `data.store.logo` | Logo URL, or `null`. |
| `data.store.logo_url` | Logo URL, or `null`. |
| `data.store.cover_image` | Stored cover image path/value, or `null`; `null` after deletion. |
| `data.store.cover_image_url` | Public cover image URL, or `null`; `null` after deletion. |
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

## Behavior Notes

- The service obtains the vendor profile from the authenticated user; the request cannot specify a vendor ID.
- The store lookup filters by both the requested store ID and the authenticated user's vendor ID.
- When a cover image path exists, the service attempts to delete the file from the `public` storage disk, then clears the store's `cover_image` field. If no cover image is set, the endpoint still succeeds and returns the store with a `null` cover image.
- The endpoint has no request body or query parameters.
- No endpoint-specific throttling middleware is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated store cover deletion route
- `StoreController::deleteCover` — request handling and response wrapper
- `StoreService::deleteCover` — ownership check, file deletion, and store update
- `FileStorageService::delete` — public-disk file deletion behavior
- `StoreRepository::update`, `StoreResource`, and `Store` — persistence and response fields
- `bootstrap/app.php` — API authentication and not-found error responses
