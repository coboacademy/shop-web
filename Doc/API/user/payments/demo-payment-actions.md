# Demo Payment Actions

The demo payment page can submit a simulated success or failure for an attempt using the same opaque token returned in the payment URL. These endpoints are public and are only available for the `demo` provider.

## Endpoints

| Action | Method | Path | Authentication |
|---|---|---|---|
| Simulate success | `POST` | `/api/payments/demo/{token}/success` | None |
| Simulate failure | `POST` | `/api/payments/demo/{token}/failure` | None |

Both use the named `demo-payment-action` limiter: 5 requests per minute per client IP. No request body fields are used; the server determines the payment and amount from the token and persisted records.

## Successful Action

For a valid pending attempt, the server creates a unique server-generated transaction reference, marks the payment `paid`, sets `paid_at`, copies the amount from the persisted order total, and sets order `payment_status` to `paid` and order `status` to `confirmed`.

The response contains the same minimal public payment shape as token lookup, with status `paid`:

```json
{
  "status": "success",
  "message": "Demo payment completed successfully.",
  "data": {
    "payment": {
      "order_reference": "COBO-12345678",
      "amount": "25.00",
      "status": "paid",
      "expires_at": "2026-11-13T02:00:00.000000Z"
    }
  }
}
```

Repeating success for that already-paid attempt returns the same successful state and does not send vendor notifications again. A different attempt cannot pay an already-paid order.

## Failed Action

Failure marks only the current pending payment attempt as `failed`. The order remains unchanged and pending; inventory reservations are unchanged. Repeating failure for the failed attempt is idempotent. The failed attempt remains in history, so the authenticated order owner may create a new attempt through `POST /api/payments`.

No vendor notifications are sent for failure.

An expired pending attempt is processed by the shared expiration service and cannot be failed. If another valid pending attempt exists for the order, the order remains pending and its reservation is retained.

## Unusable Attempts

Malformed, unknown, non-demo, expired, failed, or otherwise ineligible attempts return the same generic response:

```json
{
  "status": "error",
  "message": "Payment is unavailable."
}
```

The response does not expose internal IDs, transaction references, customer details, provider metadata, or token storage fields. On-demand success/failure checks and the scheduled expiration command process expired pending demo attempts. The final expired attempt cancels its still-pending order and releases its reserved inventory atomically; another valid pending attempt prevents cancellation and release.

## Vendor Notifications

After a first successful payment commits, the existing notification service sends one notification per relevant vendor/store. Each notification contains only that vendor/store's order-item snapshots and the order reference; customer contact and shipping details and other vendors' items are excluded. Notification failures are logged and do not roll back a paid order. Repeated success does not enqueue or send another notification.

These are simulated demo outcomes. The endpoints do not contact a real payment gateway, perform confirmation callbacks, alter inventory on success/failure, or transition the order to `processing`.
