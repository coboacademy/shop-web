# Validate Checkout

Validates the shipping details and the authenticated user's current cart, then returns a checkout summary with the submitted shipping information. This endpoint does not create an order or persist the shipping details.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/checkout/validate` |
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
| `shipping_name` | string | Yes | Maximum 100 characters |
| `shipping_phone` | string | Yes | Maximum 30 characters |
| `shipping_country` | string | Yes | Maximum 100 characters |
| `shipping_province` | string | Yes | Maximum 100 characters |
| `shipping_city` | string | Yes | Maximum 100 characters |
| `shipping_address` | string | Yes | Maximum 500 characters |
| `shipping_postal_code` | string or `null` | No | If provided, maximum 30 characters |

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/checkout/validate" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "shipping_name": "Alex Example",
    "shipping_phone": "+1-555-0100",
    "shipping_country": "Example Country",
    "shipping_province": "Example Province",
    "shipping_city": "Example City",
    "shipping_address": "123 Example Street",
    "shipping_postal_code": "12345"
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example values, IDs, prices, and timestamps below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Checkout validated successfully.",
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
      "shipping": {
        "name": "Alex Example",
        "phone": "+1-555-0100",
        "country": "Example Country",
        "province": "Example Province",
        "city": "Example City",
        "address": "123 Example Street",
        "postal_code": "12345"
      },
      "subtotal": "25.00",
      "shipping_fee": "0.00",
      "discount": "0.00",
      "total": "25.00"
    }
  }
}
```

Monetary values are returned as strings with two decimal places. If `shipping_postal_code` is omitted or `null`, `shipping.postal_code` is `null`.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.checkout.items` | Items currently in the authenticated user's cart. |
| `data.checkout.items[]` | Cart item details, including product and optional variant summaries. |
| `data.checkout.shipping.name` | Submitted shipping recipient name. |
| `data.checkout.shipping.phone` | Submitted shipping phone number. |
| `data.checkout.shipping.country` | Submitted shipping country. |
| `data.checkout.shipping.province` | Submitted shipping province or region. |
| `data.checkout.shipping.city` | Submitted shipping city. |
| `data.checkout.shipping.address` | Submitted shipping address. |
| `data.checkout.shipping.postal_code` | Submitted postal code, or `null` if omitted. |
| `data.checkout.subtotal` | Sum of item quantities multiplied by their stored unit prices. |
| `data.checkout.shipping_fee` | Shipping fee; currently `"0.00"` in the implementation. |
| `data.checkout.discount` | Discount amount; currently `"0.00"` in the implementation. |
| `data.checkout.total` | Subtotal plus shipping fee minus discount. |

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

Returned when the authenticated user does not have a cart.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

### 422 Unprocessable Content

Returned when the shipping fields fail validation or a cart item violates a checkout validation rule.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "shipping_name": [
      "The shipping name field is required."
    ]
  }
}
```

Cart validation errors use the `items` key. For example:

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "items": [
      "Only 1 item(s) are available."
    ]
  }
}
```

Cart validation failures include a missing variant selection for a product with variants, missing inventory, or a requested cart quantity greater than available stock. Availability is calculated as inventory quantity minus reserved quantity.

### 500 Internal Server Error

Returned when the cart is empty or an unexpected runtime error occurs while validating cart contents, such as a cart item whose product or selected variant is no longer available. In a non-debug environment, the response uses the generic message:

```json
{
  "status": "error",
  "message": "Server error."
}
```

When debug mode is enabled, the response may contain the exception message.

## Behavior Notes

- The authenticated user's cart is used; the request does not accept a user or cart ID.
- The endpoint validates shipping fields and current cart contents, then returns the checkout summary with shipping details.
- The submitted shipping details are included in this response but are not persisted by this endpoint.
- This endpoint does not place an order.
- It checks each cart item's product, variant selection, inventory availability, and quantity before returning totals.
- Shipping fees and discounts are currently zero; shipping calculation is a placeholder.
- If no cart exists, the API returns `404`. If a cart exists but is empty, the service throws a runtime exception and the API returns `500`.
- No endpoint-specific throttling is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated checkout validation route
- `CheckoutController::validate` — request handling and response wrapper
- `CheckoutRequest` — shipping field validation rules
- `CheckoutService::validateCheckout` and `CheckoutService::getSummary` — shipping summary assembly, cart validation, and totals
- `CheckoutResource` — checkout response structure
- `CartItemResource` — item-level fields in the response
- `bootstrap/app.php` — API validation, authentication, and generic exception responses

The route could not be rechecked with `php artisan route:list` during this documentation pass because application boot failed while loading a missing `app/Services/AdminVendorService.php` file. The route definition and middleware were inspected in `routes/api.php`.
