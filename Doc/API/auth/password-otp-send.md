# Send a Password Reset OTP

Sends a one-time password (OTP) code to the email address of an existing user so they can continue the password reset flow.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/password/otp/send` |
| Route name | `api.password.otp.send` |
| Authentication | Not required; guest route |
| Rate limit | 3 requests per minute |
| Content-Type | `application/json` |
| Response format | `application/json` |

The route is registered in `routes/api.php`.

### Request headers

```http
Accept: application/json
Content-Type: application/json
```

## Request Body

| Field | Type | Required | Validation Rules |
|---|---|---|---|
| `email` | string | Yes | Must be a valid email address belonging to an existing user |

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/password/otp/send" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alex@example.com"
  }'
```

Replace `<API_BASE_URL>` with the base URL of your API. The example email address is illustrative and does not represent an actual account.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "OTP code has been sent to your email.",
  "data": []
}
```

The OTP is delivered by email and is not included in the API response.

## Continue the Password Reset Flow

Submit the received code to `POST /api/password/otp/verify` with both the email address and OTP:

```json
{
  "email": "alex@example.com",
  "otp": "123456"
}
```

The OTP is six digits and expires after 10 minutes by default. The expiry can be changed through `OTP_EXPIRE_MINUTES`. Sending another OTP for the same email deletes the previous password reset OTP record, so only the newest code remains usable. After verification, continue with `POST /api/password/otp/reset`.

## Error Responses

### 422 Unprocessable Content

Returned when the email is missing, invalid, or does not belong to an existing user. The response includes field-specific validation messages:

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "email": [
      "We could not find a user with that email address."
    ]
  }
}
```

Other validation messages include `Email is required.` and `Email format is invalid.` Because the endpoint returns a distinct error for an unknown email, callers can determine whether an email address belongs to an account.

### Rate limit exceeded

The route allows 3 requests per minute. When the limit is exceeded, Laravel raises a throttle exception. The application's catch-all API exception handler currently renders uncaught API exceptions as `500 Internal Server Error` with a generic `Server error.` message in non-debug mode, rather than the standard `429 Too Many Requests` response. Do not rely on a `429` response until this exception handling is changed.

### 500 Internal Server Error

If creating or emailing the OTP fails, the endpoint returns an error response. In a non-debug environment, its message is:

```json
{
  "status": "error",
  "message": "Failed to send OTP code."
}
```

When application debug mode is enabled, the response may contain the exception message. The endpoint creates the OTP record before sending the email; a delivery failure may therefore leave a stored code even though the request returned an error.

## Behavior Notes

- The route is for unauthenticated guests and uses the `guest` middleware.
- Email existence is checked before the controller sends the OTP.
- A new request replaces any existing password reset OTP record for that email address.
- The OTP is stored hashed; only the plaintext code sent by email is shown to the user.
- OTP lifetime defaults to 10 minutes and is configurable using `OTP_EXPIRE_MINUTES`.

## Implementation References

This documentation is based on:

- `routes/api.php` — route registration, guest middleware, and rate limit
- `AuthenticationController::sendPasswordOtp` — account lookup, OTP creation, notification, and response
- `SendPasswordOtpRequest` — email validation
- `OtpService::createPasswordResetOtp` — code creation, replacement, storage, and expiry
- `PasswordResetOtpNotification` — email delivery
- `ApiResponse` and API exception handling — response shapes and error behavior

The route middleware was checked with `php artisan route:list`. No feature test specific to sending a password reset OTP was found during the documented review.
