# Clear the Wishlist

Removes all wishlist items belonging to the authenticated user.

## Endpoint

| Property | Value |
|---|---|
| Method | `DELETE` |
| Path | `/api/wishlist` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Example Request

```bash
curl -X DELETE "<API_BASE_URL>/api/wishlist" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Wishlist cleared successfully.",
  "data": []
}
```

## Error Responses

### 401 Unauthenticated

Returned when the request does not include a valid authenticated session or bearer token.

```json
{
  "status": "error",
  "message": "Unauthenticated."
}
```

## Behavior Notes

- The delete operation is scoped to the authenticated user's ID and removes all matching wishlist item records.
- Clearing an already empty wishlist succeeds with the same response.
- This endpoint deletes wishlist items; it does not delete products.
- No endpoint-specific throttling is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated wishlist clear route
- `WishlistController::clear` — authenticated user selection and response wrapper
- `WishlistService::clear` — passes the user ID to the repository
- `WishlistRepository::clear` — deletes wishlist items for the specified user only
- `bootstrap/app.php` — API authentication error response
