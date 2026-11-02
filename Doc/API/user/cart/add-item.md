# Add an Item to the Cart

Adds a product or product variant to the authenticated user's cart. If the same product and variant are already in the cart, the requested quantity is added to the existing quantity.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/cart/items` |
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
| `product_id` | UUID string | Yes | Must identify an existing product |
| `variant_id` | UUID string or `null` | No | If provided, must identify an existing product variant belonging to `product_id`; an active variant is required |
| `quantity` | integer | Yes | Minimum `1`, maximum `9999` |

If a product has variants, a variant must be selected. A product without variants can be added with `variant_id` omitted or set to `null`.

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/cart/items" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "product_id": "00000000-0000-4000-8000-000000000001",
    "variant_id": null,
    "quantity": 2
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example IDs, names, prices, and timestamps are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Item added to cart successfully.",
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

The response contains the full updated cart. Decimal monetary values may be serialized as strings.

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

Returned when validation fails or the product cannot be added under the current availability and inventory rules. The `errors` object contains field-specific messages.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "quantity": [
      "Only 1 item(s) are currently available."
    ]
  }
}
```

Possible causes include:

- Missing or invalid `product_id` or `quantity`.
- A product that is inactive, has an inactive store, or belongs to a vendor that is not approved.
- A `variant_id` that does not belong to the selected product or identifies an inactive variant.
- A product with variants added without selecting a variant.
- Missing inventory, or a requested total quantity above the available stock.

`available` is calculated as inventory quantity minus reserved quantity. When increasing the quantity of an item already in the cart, the stock check uses the resulting combined quantity.

## Behavior Notes

- The cart is selected using the authenticated user; the request does not accept a user ID.
- The product's current price, or the selected variant's current price, is stored as the cart item's unit price.
- Adding an existing product/variant pair increases its quantity rather than creating a second item.
- The operation runs in a database transaction and locks the relevant inventory row while checking stock.
- A valid product ID is checked before service processing; business-rule and stock failures are returned as validation errors.
- The route does not define endpoint-specific throttling.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated add-to-cart route
- `CartController::addItem` — request handling and response wrapper
- `AddCartItemRequest` — request validation
- `CartService::addItem` — product, variant, store/vendor, stock, price, and transaction behavior
- `CartRepository` — cart item lookup, creation, and updated cart retrieval
- `CartResource` and `CartItemResource` — response fields and totals
- `bootstrap/app.php` — API validation and authentication error responses

The route middleware was checked with `php artisan route:list`. No feature test specific to the add-to-cart endpoint was found during the documented review.
