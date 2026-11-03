# List the Authenticated User's Orders

Returns the authenticated user's orders, ordered from newest to oldest. The endpoint returns at most 15 orders per request.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/orders` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `page` | integer | No | Page number to retrieve. Defaults to `1`; each page contains up to 15 orders. |

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/orders?page=1" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example values and timestamps below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Orders retrieved successfully.",
  "data": {
    "orders": [
      {
        "id": 24,
        "order_number": "ORD-EXAMPLE-00024",
        "status": "pending",
        "payment_status": "unpaid",
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
        "created_at": "2026-10-30T09:00:00.000000Z",
        "updated_at": "2026-10-30T09:00:00.000000Z"
      }
    ]
  }
}
```

If the user has no orders, `data.orders` is an empty array.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.orders` | Orders belonging to the authenticated user, newest first. |
| `data.orders[].id` | Order identifier. |
| `data.orders[].order_number` | Order number assigned to the order. |
| `data.orders[].status` | Current order status. |
| `data.orders[].payment_status` | Current payment status. |
| `data.orders[].subtotal` | Order subtotal. |
| `data.orders[].shipping_fee` | Shipping fee recorded on the order. |
| `data.orders[].discount` | Discount recorded on the order. |
| `data.orders[].total` | Order total. |
| `data.orders[].shipping` | Shipping recipient and address details recorded on the order. |
| `data.orders[].customer_note` | Customer note, or `null` if none was recorded. |
| `data.orders[].created_at` | Order creation timestamp. |
| `data.orders[].updated_at` | Last order update timestamp. |

Monetary values are serialized as decimal strings. The list response does not include order items.

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

- The endpoint only returns orders whose `user_id` matches the authenticated user; it does not accept a user ID.
- Orders are sorted newest first.
- The repository paginates the query at 15 orders per page and uses the `page` query parameter to select a page. The controller wraps the resource collection inside its own response, so pagination links and metadata are not included in the response.
- The list query counts order items internally, but the response resource does not expose that count or include the order items. Use the order detail endpoint to retrieve an individual order and its loaded items.
- No endpoint-specific throttling is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated orders listing route
- `OrderController::index` — user-scoped query and response wrapper
- `OrderRepository::getUserOrders` — ownership filtering, newest-first ordering, item count query, and fixed 15-item pagination
- `OrderResource` — order fields included in the list response
- `bootstrap/app.php` — API authentication error response
