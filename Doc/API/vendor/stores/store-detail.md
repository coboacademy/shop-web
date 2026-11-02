# Get a Vendor Store

Returns one store belonging to the authenticated user's vendor profile.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/vendor/stores/{store}` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `store` | UUID | Yes | ID of the store to retrieve. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/vendor/stores/00000000-0000-4000-8000-000000000004" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL. All example IDs, names, values, and timestamps below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Store retrieved successfully.",
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
      "updated_at": "2026-10-31T01:34:00.000000Z"
    }
  }
}
```

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.store.id` | Store UUID. |
| `data.store.name` | Store name. |
| `data.store.slug` | Store slug. |
| `data.store.email` | Store email, or `null`. |
| `data.store.phone` | Store phone, or `null`. |
| `data.store.description` | Store description, or `null`. |
| `data.store.logo` | Logo URL, or `null`. |
| `data.store.logo_url` | Logo URL, or `null`. |
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

## Behavior Notes

- The service obtains the vendor profile from the authenticated user; the request cannot specify a vendor ID.
- The store lookup filters by both the requested store ID and the authenticated user's vendor ID. A store owned by another vendor is not returned.
- The lookup does not filter by `is_active`, so an inactive store belonging to the vendor can also be retrieved.
- The endpoint has no request body or query parameters.
- No endpoint-specific throttling middleware is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated vendor store detail route
- `StoreController::show` — request handling and response wrapper
- `StoreService::getMyStore` — vendor profile lookup and vendor scoping
- `StoreRepository::findByIdForVendorOrFail` — store ID/vendor ID filter
- `StoreResource` — response fields
- `bootstrap/app.php` — API authentication and not-found error responses
