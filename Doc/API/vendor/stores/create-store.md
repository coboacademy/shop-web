# Create a Vendor Store

Creates a store for the authenticated user's approved vendor profile. The new store is active by default.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/vendor/stores` |
| Authentication | Required; Sanctum bearer token |
| Content-Type | `application/json` |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Request Headers

```http
Accept: application/json
Content-Type: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Request Body

| Field | Type | Required | Validation Rules |
|---|---|---|---|
| `name` | string | Yes | Minimum 3 and maximum 150 characters. |
| `email` | string or `null` | No | If provided, must be a valid email address; maximum 255 characters. |
| `phone` | string or `null` | No | Maximum 30 characters. |
| `description` | string or `null` | No | Maximum 1000 characters. |
| `country` | string or `null` | No | Maximum 100 characters. |
| `province` | string or `null` | No | Maximum 100 characters. |
| `city` | string or `null` | No | Maximum 100 characters. |
| `address` | string or `null` | No | Maximum 255 characters. |

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/vendor/stores" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "name": "Example Downtown Store",
    "email": "store@example.com",
    "phone": "+1-555-0100",
    "description": "Illustrative store description.",
    "country": "Example Country",
    "province": "Example Province",
    "city": "Example City",
    "address": "123 Example Street"
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example IDs, names, values, and timestamps below are illustrative.

## Successful Response

**HTTP status:** `201 Created`

```json
{
  "status": "success",
  "message": "Store created successfully.",
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

The slug is generated from the store name and made unique if necessary. Image fields are `null` until images are uploaded.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the operation succeeded. |
| `message` | Response message. |
| `data.store.id` | Store UUID. |
| `data.store.name` | Store name. |
| `data.store.slug` | Generated unique store slug. |
| `data.store.email` | Store email, or `null`. |
| `data.store.phone` | Store phone, or `null`. |
| `data.store.description` | Store description, or `null`. |
| `data.store.logo` | Stored logo path, or `null`. |
| `data.store.logo_url` | Public logo URL, or `null`. |
| `data.store.cover_image` | Stored cover image path, or `null`. |
| `data.store.cover_image_url` | Public cover image URL, or `null`. |
| `data.store.country` | Store country, or `null`. |
| `data.store.province` | Store province or region, or `null`. |
| `data.store.city` | Store city, or `null`. |
| `data.store.address` | Store address, or `null`. |
| `data.store.is_active` | Whether the store is active; newly created stores use `true`. |
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

### 422 Unprocessable Content

Returned when a request field fails validation, such as a missing or too-short store name, or an invalid email address.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "name": [
      "The name field is required."
    ]
  }
}
```

### Vendor profile or approval errors

The service aborts with `404` when the authenticated user has no vendor profile and `403` when the vendor profile is not approved. The API exception handler's exact JSON response for the `403` abort is not explicitly verified.

## Behavior Notes

- The service uses the authenticated user's vendor profile; no vendor or user ID is accepted in the request.
- Only users with an approved vendor profile can create stores.
- New stores are active by default.
- A unique slug is generated from the name.
- Store creation runs in a database transaction.
- No endpoint-specific throttling is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated vendor store creation route
- `StoreController::store` — request handling and `201 Created` response
- `StoreStoreRequest` — request validation rules
- `StoreService::create` — vendor profile/approval checks, slug generation, defaults, and transaction
- `StoreRepository::create` — store persistence
- `StoreResource` — response fields
- `bootstrap/app.php` — API validation, authentication, and exception handling
