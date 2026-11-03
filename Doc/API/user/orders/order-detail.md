# Get an Order

Returns the details of an order owned by the authenticated user, including its item snapshots.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/orders/{order}` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `order` | integer | Yes | ID of the order to retrieve. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/orders/24" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example IDs, order numbers, names, prices, and timestamps are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Order retrieved successfully.",
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
      "customer_note": null,
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

Monetary values are serialized as decimal strings.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.order.id` | Order identifier. |
| `data.order.order_number` | Order number. |
| `data.order.status` | Current order status. |
| `data.order.payment_status` | Current payment status. |
| `data.order.subtotal` | Order subtotal. |
| `data.order.shipping_fee` | Shipping fee recorded on the order. |
| `data.order.discount` | Discount recorded on the order. |
| `data.order.total` | Order total. |
| `data.order.shipping` | Shipping recipient and address stored on the order. |
| `data.order.customer_note` | Customer note, or `null` if none was recorded. |
| `data.order.items` | Order item snapshots associated with the order. |
| `data.order.items[].id` | Order item identifier. |
| `data.order.items[].product_id` | Product UUID associated with the item. |
| `data.order.items[].variant_id` | Variant UUID, or `null` if the item has no variant. |
| `data.order.items[].vendor_id` | Vendor identifier. |
| `data.order.items[].store_id` | Store identifier. |
| `data.order.items[].product_name` | Product name saved with the order item. |
| `data.order.items[].variant_name` | Variant option values/name, or `null` if there is no variant. |
| `data.order.items[].sku` | SKU saved with the order item, or `null`. |
| `data.order.items[].quantity` | Ordered quantity. |
| `data.order.items[].unit_price` | Unit price saved with the order item. |
| `data.order.items[].subtotal` | Item subtotal. |
| `data.order.items[].total` | Item total. |
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

Returned when the order ID does not exist or the order belongs to a different user. Both cases use the same response, so the endpoint does not reveal whether another user's order exists.

```json
{
  "status": "error",
  "message": "Order not found."
}
```

## Behavior Notes

- The order ID is looked up together with the authenticated user's ID. A user can only retrieve their own orders.
- The response includes order item snapshots. The order's product, variant, vendor, and store relations are loaded by the repository, but the current `OrderItemResource` returns snapshot fields rather than nested relation objects.
- The endpoint does not modify the order.
- No endpoint-specific throttling is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated order detail route
- `OrderController::show` — route parameter handling, user-scoped lookup, and response/error wrappers
- `OrderRepository::findById` — ownership filtering and relation loading
- `OrderResource` and `OrderItemResource` — response fields
- `bootstrap/app.php` — API authentication error response
