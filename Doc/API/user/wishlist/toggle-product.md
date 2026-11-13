# Toggle a Product in the Wishlist

Adds a product to the authenticated user's wishlist if it is not already present, or removes it if it is already present.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/wishlist/toggle/{product}` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `product` | string | Yes | Product ID to toggle in the wishlist. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/wishlist/toggle/00000000-0000-4000-8000-000000000001" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. The example product ID is illustrative.

## Successful Responses

**HTTP status:** `200 OK`

### Product added

```json
{
  "status": "success",
  "message": "Product added to wishlist.",
  "data": {
    "added": true
  }
}
```

### Product removed

```json
{
  "status": "success",
  "message": "Product removed from wishlist.",
  "data": {
    "added": false
  }
}
```

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the operation succeeded. |
| `message` | States whether the product was added or removed. |
| `data.added` | `true` when the product was added; `false` when it was removed. |

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

Returned when the product does not exist and is not already in the user's wishlist. The service error message is returned directly:

```json
{
  "status": "error",
  "message": "Product not found."
}
```

## Behavior Notes

- The operation is scoped to the authenticated user; it does not accept a user ID.
- If the product is already in that user's wishlist, the endpoint removes it and returns `added: false`.
- Otherwise, the service checks that the product exists, adds it, and returns `added: true`.
- Unlike the dedicated add endpoint, this route has no request validation class. A non-existent product ID reaches the service and returns `422`.
- The service does not check the product's active status before adding it.
- No endpoint-specific throttling is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated wishlist toggle route
- `WishlistController::toggle` — response wrapper and service error mapping
- `WishlistService::toggle` and `WishlistService::add` — toggle semantics, product lookup, and user scoping
- `WishlistRepository::findItem`, `WishlistRepository::add`, and `WishlistRepository::remove` — persistence operations
- `bootstrap/app.php` — API authentication error response
