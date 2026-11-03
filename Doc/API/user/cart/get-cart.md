# Get the Authenticated User's Cart

Returns the authenticated user's cart and its items. If the user does not yet have a cart, the request creates an empty one.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
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
curl -X GET "<API_BASE_URL>/api/cart" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL. Example IDs, values, names, and dates below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Cart retrieved successfully.",
  "data": {
    "cart": {
      "id": 12,
      "user_id": 25,
      "total_items": 2,
      "subtotal": "25.00",
      "items": [
        {
          "id": 41,
          "product_id": "00000000-0000-4000-8000-000000000001",
          "variant_id": null,
          "quantity": 2,
          "unit_price": "12.50",
          "line_total": "25.00",
          "product": {
            "id": "00000000-0000-4000-8000-000000000001",
            "name": "Example Coffee",
            "slug": "example-coffee",
            "sku": "EXAMPLE-COFFEE",
            "price": "12.50"
          },
          "variant": null,
          "created_at": "2026-10-30T09:00:00.000000Z",
          "updated_at": "2026-10-30T09:00:00.000000Z"
        }
      ],
      "created_at": "2026-10-30T09:00:00.000000Z",
      "updated_at": "2026-10-30T09:00:00.000000Z"
    }
  }
}
```

When the cart has no items, `items` is an empty array, `total_items` is `0`, and `subtotal` is `"0.00"`. Monetary values may be serialized as strings.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.cart.id` | Cart identifier. |
| `data.cart.user_id` | ID of the authenticated cart owner. |
| `data.cart.total_items` | Sum of item quantities in the cart. |
| `data.cart.subtotal` | Sum of each item's quantity multiplied by its unit price. |
| `data.cart.items` | Cart items. |
| `data.cart.items[].id` | Cart item identifier. |
| `data.cart.items[].product_id` | Product UUID. |
| `data.cart.items[].variant_id` | Variant UUID, or `null` when the item is not associated with a variant. |
| `data.cart.items[].quantity` | Quantity in the cart. |
| `data.cart.items[].unit_price` | Unit price stored for the cart item. |
| `data.cart.items[].line_total` | Item quantity multiplied by its unit price. |
| `data.cart.items[].product` | Product summary with ID, name, slug, SKU, and product price. |
| `data.cart.items[].variant` | Variant summary with ID, SKU, price, and active state, or `null` if there is no variant. |
| `data.cart.items[].created_at` | Cart item creation timestamp. |
| `data.cart.items[].updated_at` | Last cart item update timestamp. |
| `data.cart.created_at` | Cart creation timestamp. |
| `data.cart.updated_at` | Last cart update timestamp. |

Cart and item timestamps are serialized as ISO 8601 date-time strings.

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

- The cart belongs to the authenticated user; the request does not accept a user ID.
- Retrieving a cart creates one if the user does not already have one, so this `GET` request can create a database record.
- The response includes product and variant summaries for each cart item.
- The subtotal is calculated from stored cart-item unit prices and quantities. It does not include taxes, shipping, or discounts.
- The route does not define endpoint-specific throttling.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated cart route
- `CartController::show` — authenticated user lookup and response wrapper
- `CartService::getCart` and `CartRepository::getCart` — cart retrieval and create-if-missing behavior
- `CartResource` and `CartItemResource` — cart totals and response fields
- `bootstrap/app.php` — API authentication error response
- `database/migrations/2026_09_26_094528_create_carts_table.php` and `database/migrations/2026_09_26_094624_create_cart_items_table.php` — persisted cart structure

The route middleware was checked with `php artisan route:list`. No feature test specific to the cart retrieval endpoint was found during the documented review.
