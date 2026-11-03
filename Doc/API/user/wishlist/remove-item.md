# Remove a Product from the Wishlist

Removes a product from the authenticated user's wishlist.

## Endpoint

| Property | Value |
|---|---|
| Method | `DELETE` |
| Path | `/api/wishlist/{product}` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `product` | string | Yes | Product ID to remove from the wishlist. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Example Request

```bash
curl -X DELETE "<API_BASE_URL>/api/wishlist/00000000-0000-4000-8000-000000000001" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. The example product ID is illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Product removed from wishlist successfully.",
  "data": []
}
```

The endpoint returns no wishlist item resource after removal.

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

Returned when the product is not currently in the authenticated user's wishlist.

```json
{
  "status": "error",
  "message": "Product is not in your wishlist."
}
```

## Behavior Notes

- The removal is scoped to the authenticated user and the supplied product ID.
- This endpoint does not validate whether the product exists; it checks only whether that product ID is in the user's wishlist.
- If no matching wishlist item exists, the service returns `422` rather than treating the request as an idempotent success.
- No endpoint-specific throttling is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated wishlist removal route
- `WishlistController::destroy` — request handling, response wrapper, and service error mapping
- `WishlistService::remove` — user-scoped lookup and missing-item behavior
- `WishlistRepository::findItem` and `WishlistRepository::remove` — user/product filters and deletion
- `bootstrap/app.php` — API authentication error response
