# Create a Payment

Creates a pending payment record for an order owned by the authenticated user. This endpoint records a payment method and amount; it does not process a charge with a payment provider.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/payments` |
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
| `order_id` | integer | Yes | Must match an existing order ID. The service additionally requires that the order belongs to the authenticated user. |
| `method` | string | Yes | One of `cash_on_delivery`, `bank_transfer`, or `online`. |
| `provider` | string or `null` | No | Maximum 100 characters. |
| `metadata` | object or `null` | No | Must be a JSON object/array. |

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/payments" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "order_id": 24,
    "method": "online",
    "provider": "ExamplePay",
    "metadata": {
      "checkout_reference": "example-reference"
    }
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All IDs, references, amounts, and timestamps below are illustrative.

## Successful Response

**HTTP status:** `201 Created`

```json
{
  "status": "success",
  "message": "Payment created successfully.",
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

Monetary values are serialized as decimal strings. The response does not include the submitted `metadata`.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the operation succeeded. |
| `message` | Response message. |
| `data.payment.id` | Payment record identifier. |
| `data.payment.order_id` | Associated order identifier. |
| `data.payment.method` | Payment method selected in the request. |
| `data.payment.status` | Payment status; newly created payments use `pending`. |
| `data.payment.amount` | Amount copied from the order total. |
| `data.payment.transaction_id` | Provider transaction ID; initially `null`. |
| `data.payment.provider` | Provider name submitted with the request, or `null`. |
| `data.payment.paid_at` | Payment timestamp; initially `null`. |
| `data.payment.failed_at` | Failure timestamp; initially `null`. |
| `data.payment.failure_reason` | Failure reason; initially `null`. |
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

### 422 Unprocessable Content

Returned when request validation fails, for example when `order_id` is missing or does not identify an existing order, or when `method` is not one of the allowed values.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "method": [
      "The selected method is invalid."
    ]
  }
}
```

### 500 Internal Server Error

The service throws runtime exceptions if the order is not owned by the authenticated user, is cancelled, or is already paid. These exceptions are handled by the generic API error handler. In a non-debug environment, the response is:

```json
{
  "status": "error",
  "message": "Server error."
}
```

In debug mode, the response may contain the exception message.

## Behavior Notes

- The payment amount is copied from the associated order's `total`; the client does not submit an amount.
- New payment records have `pending` status. The service sets the order's `payment_status` to `pending`.
- The request's `metadata` is stored on the payment but is not included in the response resource.
- If a payment record already exists for the order, the service returns that record rather than creating another. The controller still responds with `201 Created`; the request's new method/provider/metadata are not applied to that existing payment.
- Cancelled orders and orders already marked paid cannot receive a payment through this endpoint.
- Creating the record does not contact a payment provider, mark the payment paid, or update the order status to confirmed.
- No endpoint-specific throttling is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated payment creation route
- `PaymentController::store` — request handling and `201 Created` response
- `CreatePaymentRequest` — input validation rules
- `PaymentService::createPayment` — order ownership/status checks, existing-payment behavior, payment persistence, and payment-status update
- `PaymentResource` — payment response fields
- `bootstrap/app.php` — API validation, authentication, and generic exception responses
