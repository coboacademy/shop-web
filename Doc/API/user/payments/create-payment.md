# Create a Payment

Creates a pending payment attempt for an order owned by the authenticated user. The amount is taken from the persisted order total. This endpoint does not process a charge with a payment provider.

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
| `metadata` | object or `null` | No | Must be a JSON object/array. |

The provider is selected by the backend and is currently `demo`. A client-supplied `provider` is rejected. The request does not accept a payment amount. Any unvalidated `amount` field is ignored.

Set `DEMO_PAYMENT_URL_TEMPLATE` to the full payment-page URL template for the deployment. It must use `http` or `https` and contain exactly one `{token}` placeholder. This backend does not define or host that page.

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/payments" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "order_id": 24,
    "method": "online",
    "metadata": {
      "checkout_reference": "example-reference"
    }
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All IDs, references, amounts, and timestamps below are illustrative.

## Successful Responses

**HTTP status:** `201 Created` for a new attempt; `200 OK` when an active pending attempt is reused.

Both responses use the same resource shape:

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
      "provider": "demo",
      "paid_at": null,
      "failed_at": null,
      "failure_reason": null,
      "created_at": "2026-10-31T00:53:00.000000Z"
    },
    "payment_url": "https://payments.example.test/checkout/0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
  }
}
```

Monetary values are serialized as decimal strings. The response does not include the submitted `metadata`, token hash, or encrypted token. The raw token appears only within `payment_url`.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the operation succeeded. |
| `message` | Response message. |
| `data.payment.id` | Payment record identifier. |
| `data.payment.order_id` | Associated order identifier. |
| `data.payment.method` | Payment method selected in the request. |
| `data.payment.status` | Payment status; new and reused attempts are `pending`. |
| `data.payment.amount` | Amount copied from the order total. |
| `data.payment.transaction_id` | Provider transaction ID; initially `null`. |
| `data.payment.provider` | Backend-selected provider name (`demo`). |
| `data.payment_url` | URL constructed from the configured template and the payment's high-entropy token. |
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

Returned when request validation fails, for example when `order_id` is missing or does not identify an existing order, or when `method` is not one of the allowed values. It is also returned when a pending attempt has expired and cannot be reused.

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

An expired pending attempt response is:

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "order_id": [
      "A pending payment attempt has expired. The expired attempt cannot be reused."
    ]
  }
}
```

### 500 Internal Server Error

The service throws runtime exceptions if the order is not owned by the authenticated user, is cancelled, is already paid, or has multiple pending attempts. These exceptions are handled by the generic API error handler. In a non-debug environment, the response is:

```json
{
  "status": "error",
  "message": "Server error."
}
```

In debug mode, the response may contain the exception message.

## Behavior Notes

- The payment amount is copied from the associated order's persisted `total`; a client-supplied amount is not used.
- New attempts use the backend-selected `demo` provider. The provider creates a cryptographically random token; only its SHA-256 hash and Laravel-encrypted original are stored.
- A deployment must configure `DEMO_PAYMENT_URL_TEMPLATE`. If it is unset or malformed, creation fails rather than returning an invented payment-page URL.
- New attempts have `pending` status and expire 30 minutes after creation. The expiry timestamp is not included in the payment response.
- When one unexpired pending attempt exists, the endpoint verifies its stored token data, reconstructs the payment URL, and returns `200 OK`; it does not create another row, generate a new token, or change expiry.
- A failed attempt remains in payment history. A later request creates a new pending attempt for the same order and returns `201 Created`.
- A pending attempt that has expired cannot be reused. The scheduled `payments:expire-demo` command processes it in a bounded batch every minute; if there is no other valid pending attempt, the order is cancelled and its inventory reservation is released. The public lookup and success/failure actions also invoke the shared expiration service on demand.
- If multiple pending attempts are detected for one order, the service refuses to choose one or create another.
- The order's `payment_status` is set to `pending` on attempt creation and remains pending after a failed attempt. This endpoint does not mark an order paid or change its processing status.
- The request's `metadata` is stored on the payment but is not included in the response resource.
- Cancelled orders and orders already marked paid cannot receive a payment through this endpoint.
- Creating the record does not contact a real payment provider, mark the payment paid, or update the order status to confirmed.
- No endpoint-specific throttling is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated payment creation route
- `PaymentController::store` — request handling and created/reused response status
- `CreatePaymentRequest` — input validation rules
- `PaymentService::createPayment` — order ownership/status checks, existing-payment behavior, payment persistence, and payment-status update
- `PaymentResource` — payment response fields
- `bootstrap/app.php` — API validation, authentication, and generic exception responses
