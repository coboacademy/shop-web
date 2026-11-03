# Clear the Cart

Removes all items from the authenticated user's cart and returns the empty cart.

## Endpoint

| Property | Value |
|---|---|
| Method | `DELETE` |
| Path | `/api/cart` |
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
curl -X DELETE "<API_BASE_URL>/api/cart" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL. Example IDs and values below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Cart cleared successfully.",
  "data": {
    "cart": {
      "id": 12,
      "user_id": 25,
      "total_items": 0,
      "subtotal": "0.00",
      "items": [],
      "created_at": "2026-10-30T09:00:00.000000Z",
      "updated_at": "2026-10-30T09:00:00.000000Z"
    }
  }
}
```

The cart record remains; all its items are deleted. Monetary values may be serialized as strings.

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

- The cart is selected using the authenticated user; the request does not accept a user ID.
- If the user does not yet have a cart, the endpoint creates an empty cart and returns it.
- Clearing an already empty cart also succeeds and returns an empty cart.
- This endpoint deletes every item in the cart; use `DELETE /api/cart/items/{item}` to remove only one item.
- The route does not define endpoint-specific throttling.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated cart clear route
- `CartController::clear` — request handling and response wrapper
- `CartService::clearCart` — cart creation, item clearing, and cart retrieval
- `CartRepository::getOrCreate` and `CartRepository::getCart` — cart lookup or creation
- `CartRepository::clear` — deletion of all cart items
- `CartResource` — response fields and totals
- `bootstrap/app.php` — API authentication error response
