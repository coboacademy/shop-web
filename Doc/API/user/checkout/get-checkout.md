# Get the Checkout Summary

Returns the authenticated user's current checkout summary, including cart items and computed totals.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/checkout` |
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
curl -X GET "<API_BASE_URL>/api/checkout" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. Example IDs, names, prices, and timestamps used below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Checkout summary retrieved successfully.",
  "data": {
    "checkout": {
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
      "shipping": null,
      "subtotal": "25.00",
      "shipping_fee": "0.00",
      "discount": "0.00",
      "total": "25.00"
    }
  }
}
```

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.checkout.items` | Items currently in the authenticated user's cart. |
| `data.checkout.items[].id` | Cart item identifier. |
| `data.checkout.items[].product_id` | Product UUID for the item. |
| `data.checkout.items[].variant_id` | Variant UUID, or `null` when no variant is associated with the item. |
| `data.checkout.items[].quantity` | Quantity selected for the item. |
| `data.checkout.items[].unit_price` | Unit price stored for the cart item. |
| `data.checkout.items[].line_total` | Item quantity multiplied by unit price. |
| `data.checkout.items[].product` | Product summary for the cart item. |
| `data.checkout.items[].variant` | Variant summary when applicable, otherwise `null`. |
| `data.checkout.shipping` | Shipping details if they are attached later; currently `null` by default. |
| `data.checkout.subtotal` | Sum of all item totals before shipping and discounts. |
| `data.checkout.shipping_fee` | Current shipping fee. The current implementation returns `"0.00"`. |
| `data.checkout.discount` | Discount amount. The current implementation returns `"0.00"`. |
| `data.checkout.total` | Final calculated total: subtotal + shipping fee - discount. |

Monetary values are returned as strings with two decimal places.

## Error Responses

### 401 Unauthenticated

Returned when the request does not include a valid authenticated session or bearer token.

```json
{
  "status": "error",
  "message": "Unauthenticated."
}
```

### 404 Not Found

Returned when the authenticated user does not have a cart yet.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

### 422 Unprocessable Content

Returned when the cart contains a product or variant that is invalid, unavailable, or missing required selection information.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "items": [
      "Select a variant for this product."
    ]
  }
}
```

Examples of conditions that can trigger this error include:

- A cart item with a product that no longer exists.
- A product variant that no longer exists or does not belong to the original product.
- A product with variants selected without a valid variant.
- A product or variant whose inventory is unavailable.
- A quantity that exceeds the current available stock.

### 500 Internal Server Error

Returned when the cart is empty or an unexpected exception occurs during summary generation.

```json
{
  "status": "error",
  "message": "Server error."
}
```

In debug mode, the raw exception message may be returned instead of the generic server error message.

## Behavior Notes

- The route is public to authenticated users only; it does not permit guest access.
- The checkout summary reads the cart for the authenticated user only.
- If the cart does not exist, the service throws a model-not-found exception and the API returns `404`.
- If the cart exists but has no items, the service throws a runtime exception and the API returns `500`.
- Each cart item is validated before totals are calculated. This includes checking product availability, variant integrity, and inventory availability.
- `shipping_fee` and `discount` are currently hard-coded to `0.00` in the implementation; the shipping calculation is intentionally left as a placeholder.
- The route does not define endpoint-specific throttling.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated checkout summary route
- `CheckoutController::show` — request handling and success response wrapper
- `CheckoutService::getSummary` — validation of cart contents and calculation of totals
- `CheckoutResource` — checkout response structure
- `CartItemResource` — item-level cart detail returned inside the summary
- `bootstrap/app.php` — JSON validation, authentication, and generic API exception handling

The route middleware was checked with `php artisan route:list`. No dedicated feature test for the checkout summary endpoint was found during the documented review.
