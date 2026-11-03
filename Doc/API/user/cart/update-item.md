# Update a Cart Item

Updates the quantity of an item in the authenticated user's cart.

## Endpoint

| Property | Value |
|---|---|
| Method | `PATCH` |
| Path | `/api/cart/items/{item}` |
| Authentication | Required; Sanctum bearer token |
| Content-Type | `application/json` |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Description |
|---|---|---|
| `item` | Integer | Cart item ID to update. The item must belong to the authenticated user. |

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
| `quantity` | Integer | Yes | Minimum `1`, maximum `9999` |

## Example Request

```bash
curl -X PATCH "<API_BASE_URL>/api/cart/items/41" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "quantity": 3
  }'
```

Replace `<API_BASE_URL>` with the API base URL. Example IDs, values, names, and dates below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Cart item updated successfully.",
  "data": {
    "cart": {
      "id": 12,
      "user_id": 25,
      "total_items": 3,
      "subtotal": "37.50",
      "items": [
        {
          "id": 41,
          "product_id": "00000000-0000-4000-8000-000000000001",
          "variant_id": null,
          "quantity": 3,
          "unit_price": "12.50",
          "line_total": "37.50",
          "product": {
            "id": "00000000-0000-4000-8000-000000000001",
            "name": "Example Coffee",
            "slug": "example-coffee",
            "sku": "EXAMPLE-COFFEE",
            "price": "12.50"
          },
          "variant": null,
          "created_at": "2026-10-30T09:00:00.000000Z",
          "updated_at": "2026-10-30T09:05:00.000000Z"
        }
      ],
      "created_at": "2026-10-30T09:00:00.000000Z",
      "updated_at": "2026-10-30T09:00:00.000000Z"
    }
  }
}
```

The response contains the full updated cart. Monetary values may be serialized as strings.

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

Returned when the cart item does not exist or does not belong to the authenticated user.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

### 422 Unprocessable Content

Returned when the quantity is invalid or the item cannot be updated under the current product availability and inventory rules. The `errors` object contains field-specific messages.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "quantity": [
      "Only 2 item(s) are currently available."
    ]
  }
}
```

Possible causes include:

- Missing `quantity`, a non-integer quantity, or a quantity outside `1`–`9999`.
- The product is inactive, its store is inactive, or its vendor is not approved.
- The item's variant is inactive.
- Inventory is missing or the requested quantity exceeds available stock. Available stock is inventory quantity minus reserved quantity.

## Behavior Notes

- The cart item is located within the authenticated user's cart; the request cannot update another user's item.
- The item's unit price is refreshed from the product's current price or, if present, its variant's current price.
- Updating the quantity to a value above available stock fails with a validation error.
- The update and stock check run in a database transaction.
- The route does not define endpoint-specific throttling.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated cart item update route
- `CartController::updateItem` — request handling and response wrapper
- `UpdateCartItemRequest` — quantity validation
- `CartService::updateItem` — ownership, product availability, pricing, and stock behavior
- `CartRepository::findItemForUserOrFail` — item ownership scoping
- `CartResource` and `CartItemResource` — response fields and totals
- `bootstrap/app.php` — API validation, authentication, and not-found error responses
