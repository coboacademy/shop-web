# Get a Payment

Returns the payment details for a payment associated with an order owned by the authenticated user.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/payments/{payment}` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `payment` | integer | Yes | ID of the payment to retrieve. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/payments/16" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example IDs, amounts, and timestamps below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Payment retrieved successfully.",
  "data": {
    "payment": {
      "id": 16,
      "order_id": 24,
      "method": "online",
      "status": "pending",
      "amount": "25.00",
      "transaction_id": null,
      "provider": "ExamplePay",
      "paid_at": null,
      "failed_at": null,
      "failure_reason": null,
      "created_at": "2026-10-31T00:53:00.000000Z"
    }
  }
}
```

Monetary values are serialized as decimal strings. The response includes only the payment resource; it does not include payment metadata or the related order.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.payment.id` | Payment record identifier. |
| `data.payment.order_id` | Associated order identifier. |
| `data.payment.method` | Payment method recorded for the payment. |
| `data.payment.status` | Current payment status. |
| `data.payment.amount` | Payment amount. |
| `data.payment.transaction_id` | Transaction ID, or `null` if not set. |
| `data.payment.provider` | Provider name, or `null` if not set. |
| `data.payment.paid_at` | Payment timestamp, or `null` if the payment has not been marked paid. |
| `data.payment.failed_at` | Failure timestamp, or `null` if the payment has not been marked failed. |
| `data.payment.failure_reason` | Failure reason, or `null` if none is recorded. |
| `data.payment.created_at` | Payment record creation timestamp. |

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

Returned when the payment ID does not exist or its associated order does not belong to the authenticated user. Both cases use the same response, so the endpoint does not reveal whether another user's payment exists.

```json
{
  "status": "error",
  "message": "Payment not found."
}
```

## Behavior Notes

- The payment is selected by its ID and constrained to payments whose related order belongs to the authenticated user.
- The endpoint does not modify payment or order state.
- No endpoint-specific throttling is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated payment detail route
- `PaymentController::show` — payment lookup, ownership constraint, and response/error wrappers
- `PaymentResource` — payment response fields
- `bootstrap/app.php` — API authentication error response
