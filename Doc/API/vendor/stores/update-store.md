# Update a Vendor Store

Updates fields on a store belonging to the authenticated user's vendor profile.

## Endpoint

| Property | Value |
|---|---|
| Method | `PUT` |
| Path | `/api/vendor/stores/{store}` |
| Authentication | Required; Sanctum bearer token |
| Content-Type | `application/json` |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `store` | UUID | Yes | ID of the store to update. |

## Request Headers

```http
Accept: application/json
Content-Type: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Request Body

All fields are optional. Omitted fields remain unchanged. Fields accepting `null` can be cleared by sending `null`.

| Field | Type | Required | Validation Rules |
|---|---|---|---|
| `name` | string | No | If provided, required; minimum 3 and maximum 150 characters. |
| `email` | string or `null` | No | If provided, must be a valid email address; maximum 255 characters. |
| `phone` | string or `null` | No | If provided, maximum 30 characters. |
| `description` | string or `null` | No | If provided, maximum 1000 characters. |
| `country` | string or `null` | No | If provided, maximum 100 characters. |
| `province` | string or `null` | No | If provided, maximum 100 characters. |
| `city` | string or `null` | No | If provided, maximum 100 characters. |
| `address` | string or `null` | No | If provided, maximum 255 characters. |

## Example Request

```bash
curl -X PUT "<API_BASE_URL>/api/vendor/stores/00000000-0000-4000-8000-000000000004" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "name": "Example Uptown Store",
    "phone": null,
    "city": "Example City"
  }'
```

Replace `<API_BASE_URL>` with the API base URL. All example IDs, names, values, and timestamps below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Store updated successfully.",
  "data": {
    "store": {
      "id": "00000000-0000-4000-8000-000000000004",
      "name": "Example Uptown Store",
      "slug": "example-downtown-store",
      "email": "store@example.com",
      "phone": null,
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
      "updated_at": "2026-10-31T01:40:00.000000Z"
    }
  }
}
```

The response contains the full store resource, including fields not supplied in the update. The example illustrates that changing `name` does not change the existing slug.

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

Returned when a provided field fails validation, such as a too-short name or an invalid email address.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "name": [
      "The name field must be at least 3 characters."
    ]
  }
}
```

## Behavior Notes

- The service obtains the vendor profile from the authenticated user; the request cannot specify a vendor ID.
- The store lookup filters by both the requested store ID and the authenticated user's vendor ID. A store owned by another vendor is not updated.
- Only validated request fields are passed to the store update operation.
- Updating the store name does not regenerate its slug.
- The endpoint has no endpoint-specific throttling middleware.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated vendor store update route
- `StoreController::update` — request handling and response wrapper
- `UpdateStoreRequest` — optional fields and validation rules
- `StoreService::update` — vendor profile lookup, ownership scoping, and update
- `StoreRepository::update` — persistence and refreshed model
- `StoreResource` — response fields
- `bootstrap/app.php` — API validation, authentication, and not-found error responses
