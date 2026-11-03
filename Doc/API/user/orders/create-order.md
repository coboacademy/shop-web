# Create an Order

Creates an order from the authenticated user's current cart using the submitted shipping details. On success, the order and its item snapshots are created, inventory is reserved, and the cart items are removed.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/orders` |
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
| `customer_note` | string or `null` | No | If provided, maximum 1000 characters |

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/orders" \
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
    "shipping_postal_code": "12345",
    "customer_note": "Please leave the package at the front desk."
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example IDs, order numbers, names, prices, and timestamps below are illustrative.

## Successful Response

**HTTP status:** `201 Created`

```json
{
  "status": "success",
  "message": "Order created successfully.",
  "data": {
    "order": {
      "id": 24,
      "order_number": "COBO-20261030-ABC123",
      "status": "pending",
      "payment_status": "pending",
      "subtotal": "25.00",
      "shipping_fee": "0.00",
      "discount": "0.00",
      "total": "25.00",
      "shipping": {
        "name": "Alex Example",
        "phone": "+1-555-0100",
        "country": "Example Country",
        "province": "Example Province",
        "city": "Example City",
        "address": "123 Example Street",
        "postal_code": "12345"
      },
      "customer_note": "Please leave the package at the front desk.",
      "items": [
        {
          "id": 83,
          "product_id": "00000000-0000-4000-8000-000000000001",
          "variant_id": null,
          "vendor_id": 7,
          "store_id": 4,
          "product_name": "Example Coffee",
          "variant_name": null,
          "sku": "EXAMPLE-COFFEE",
          "quantity": 2,
          "unit_price": "12.50",
          "subtotal": "25.00",
          "total": "25.00"
        }
      ],
      "created_at": "2026-10-30T09:00:00.000000Z",
      "updated_at": "2026-10-30T09:00:00.000000Z"
    }
  }
}
```

Monetary values are serialized as decimal strings. Order numbers include the current date and a generated random suffix; the example is illustrative.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the operation succeeded. |
| `message` | Response message. |
| `data.order.id` | Order identifier. |
| `data.order.order_number` | Generated order number. |
| `data.order.status` | Order status; newly created orders use `pending`. |
| `data.order.payment_status` | Payment status; newly created orders use `pending`. |
| `data.order.subtotal` | Sum of the cart item unit prices multiplied by their quantities. |
| `data.order.shipping_fee` | Shipping fee; currently `0.00`. |
| `data.order.discount` | Discount; currently `0.00`. |
| `data.order.total` | Subtotal plus shipping fee minus discount. |
| `data.order.shipping` | Shipping recipient and address submitted in the request. |
| `data.order.customer_note` | Submitted customer note, or `null` if omitted. |
| `data.order.items` | Order item snapshots created from the cart items. |
| `data.order.items[].id` | Order item identifier. |
| `data.order.items[].product_id` | Product UUID associated with the item. |
| `data.order.items[].variant_id` | Variant UUID, or `null` when the cart item has no variant. |
| `data.order.items[].vendor_id` | Vendor identifier associated with the product's store. |
| `data.order.items[].store_id` | Store identifier associated with the product. |
| `data.order.items[].product_name` | Product name saved on the order item. |
| `data.order.items[].variant_name` | Variant option values/name, or `null` when the item has no variant. |
| `data.order.items[].sku` | Variant SKU or product SKU, or `null` if neither is set. |
| `data.order.items[].quantity` | Ordered quantity copied from the cart. |
| `data.order.items[].unit_price` | Unit price copied from the cart item. |
| `data.order.items[].subtotal` | Item unit price multiplied by quantity. |
| `data.order.items[].total` | Item total; currently equal to the item subtotal. |
| `data.order.created_at` | Order creation timestamp. |
| `data.order.updated_at` | Last order update timestamp. |

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

Returned if a required inventory record cannot be found during order creation.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

### 422 Unprocessable Content

Returned when request validation fails or a cart item fails inventory/variant validation. The `errors` object contains field-specific messages.

Example request validation error:

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

Example cart validation error:

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

Cart validation errors can occur when a product with variants has no variant selected, inventory is missing, or the cart quantity exceeds available stock. Available stock is inventory quantity minus reserved quantity.

### 500 Internal Server Error

Returned when the authenticated user's cart does not exist or is empty, or when an unexpected runtime error occurs during order creation. The service raises runtime exceptions for missing/empty carts and unavailable products or variants. In a non-debug environment, the response uses the generic message:

```json
{
  "status": "error",
  "message": "Server error."
}
```

When debug mode is enabled, the response may contain the exception message.

## Behavior Notes

- The order is created from the authenticated user's cart; the request does not accept a user or cart ID.
- The order creation runs in a database transaction. A failure during creation, inventory reservation, or cart-item removal rolls back the transaction.
- Each cart item is checked against its product, variant, and inventory before the order is persisted.
- The service locks the cart and relevant inventory rows during the transaction, checks available stock, then increases each inventory record's `reserved_quantity` by the ordered quantity.
- The service copies item details such as product name, SKU, quantity, and unit price into order items.
- On success, the cart's items are deleted; the cart record itself is not deleted.
- Shipping fees and discounts are currently zero in the implementation.
- An empty cart raises a runtime exception and currently becomes a `500` API response.
- No endpoint-specific throttling is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated order creation route
- `OrderController::store` — request handling and `201 Created` response
- `CreateOrderRequest` — request validation rules
- `OrderService::create` — transaction, cart validation, total calculation, order/item creation, inventory reservation, and cart-item deletion
- `OrderResource` and `OrderItemResource` — response fields
- `bootstrap/app.php` — API validation, authentication, and generic exception responses

The endpoint behavior was verified against the route definition and implementation. A fresh `php artisan route:list` check was unavailable because application boot previously failed while loading a missing unrelated `app/Services/AdminVendorService.php` file.
