# Remove an Item from the Cart

Removes one item from the authenticated user's cart and returns the updated cart.

## Endpoint

| Property | Value |
|---|---|
| Method | `DELETE` |
| Path | `/api/cart/items/{item}` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Description |
|---|---|---|
| `item` | Integer | Cart item ID to remove. The item must belong to the authenticated user. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Example Request

```bash
curl -X DELETE "<API_BASE_URL>/api/cart/items/41" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL. Example IDs and values below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Cart item removed successfully.",
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

When other items remain, the response contains those items and their updated cart totals. Monetary values may be serialized as strings.

## Error Responses

### 401 Unauthenticated

Returned when the request does not include a valid authenticated session or bearer token.

```json
{
  "status": "error",
  "message": "Unauthenticated."
}
```

### 404 Resource Not Found

Returned when the item does not exist or does not belong to the authenticated user.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

## Behavior Notes

- The cart item is looked up within the authenticated user's cart; a user cannot remove another user's item.
- Removing the final item leaves the cart in place with an empty `items` array, `total_items` of `0`, and `subtotal` of `"0.00"`.
- This endpoint removes only the specified item; use `DELETE /api/cart` to clear the entire cart.
- The route does not define endpoint-specific throttling.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated cart item removal route
- `CartController::removeItem` — request handling and response wrapper
- `CartService::removeItem` — item deletion and updated cart retrieval
- `CartRepository::findItemForUserOrFail` — item ownership scoping
- `CartRepository::deleteItem` — item deletion
- `CartResource` and `CartItemResource` — response fields and totals
- `bootstrap/app.php` — API authentication and not-found error responses
