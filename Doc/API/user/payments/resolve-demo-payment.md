# Resolve a Demo Payment

Resolves a pending demo payment using the opaque token from `payment_url`. This endpoint is public and does not return payment details for unusable attempts.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/payments/demo/{token}` |
| Authentication | None |
| Rate limit | 10 requests per minute per client IP |

The route is registered in `routes/api.php` and uses the named `demo-payment-lookup` limiter.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Payment resolved successfully.",
  "data": {
    "payment": {
      "order_reference": "COBO-12345678",
      "amount": "25.00",
      "status": "pending",
      "expires_at": "2026-11-13T02:00:00.000000Z"
    }
  }
}
```

The public response includes only the order reference, payment amount, pending status, and expiry timestamp. The current schema does not define a payment currency or separate public payment reference.

## Unusable Token Response

Invalid, unknown, non-demo, failed, paid, expired, missing-expiry, or otherwise ineligible attempts all return the same response.

**HTTP status:** `404 Not Found`

```json
{
  "status": "error",
  "message": "Payment is unavailable."
}
```

## Behavior and Security

- The endpoint hashes the supplied token with SHA-256 and looks up the matching `token_hash`; it does not query by payment ID.
- A payment is returned only when it belongs to provider `demo`, remains `pending`, has a future `expires_at`, and its order exists and is not cancelled or paid.
- The raw token, token hash, encrypted token, internal IDs, customer contact/shipping details, provider metadata, and provider references are not returned.
- If the matching pending attempt has expired, the shared expiration service marks that attempt expired. If it was the order's final valid pending attempt, the service also cancels the order and releases its inventory reservation in the same transaction. Expiration never changes physical stock or sends notifications.
- The scheduled `payments:expire-demo` command also processes expired demo attempts in batches; it runs every minute with overlap prevention.
- The limiter is keyed by client IP, not token, so submitted credentials are not used in the rate-limit key.
- Separate public `POST /api/payments/demo/{token}/success` and `POST /api/payments/demo/{token}/failure` actions accept the demo customer's simulated choice. Both use the same opaque token credential and a dedicated 5-requests-per-minute-per-IP limiter.
- A valid lookup never confirms or modifies payment state. See [Demo Payment Actions](./demo-payment-actions.md) for action behavior.
