# Verify a Password Reset OTP

Verifies the password reset OTP sent to a user's email address. After successful verification, the user can continue to reset their password.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/password/otp/verify` |
| Route name | `api.password.otp.verify` |
| Authentication | Not required; guest route |
| Rate limit | 10 requests per minute |
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
| `otp` | string | Yes | Must contain exactly 6 digits |

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/password/otp/verify" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alex@example.com",
    "otp": "123456"
  }'
```

Replace `<API_BASE_URL>` with the base URL of your API. The example email and OTP are illustrative and are not real credentials.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "OTP verified successfully. You can now reset your password.",
  "data": []
}
```

After verification succeeds, continue the password reset flow using `POST /api/password/otp/reset`. Verification alone does not change the account password.

## Error Responses

### 422 Unprocessable Content

Returned when request validation fails, no active OTP exists for the email, or the OTP is invalid, expired, or has exceeded its attempt limit.

Example for an invalid OTP:

```json
{
  "status": "error",
  "message": "Invalid OTP code.",
  "errors": {
    "otp": [
      "Invalid OTP code."
    ]
  }
}
```

The `email` field must identify an existing user. The `otp` field is required and must be exactly six digits. An OTP that is missing or expired returns `Invalid or expired OTP code.` A wrong OTP returns `Invalid OTP code.` After the configured number of invalid attempts, the OTP record is deleted and the response asks the user to request a new code.

### Rate limit exceeded

The route allows 10 requests per minute. When the limit is exceeded, Laravel raises a throttle exception. The application's catch-all API exception handler currently renders uncaught API exceptions as `500 Internal Server Error` with a generic `Server error.` message in non-debug mode, rather than the standard `429 Too Many Requests` response. Do not rely on a `429` response until this exception handling is changed.

### 500 Internal Server Error

An unexpected verification error returns an error response. In non-debug environments, its message is `Failed to verify OTP code.`; when application debug mode is enabled, the response may contain the exception message.

## Verification Behavior

- The route is for unauthenticated guests and uses the `guest` middleware.
- Only an active, unexpired, unused OTP for the supplied email is eligible for verification.
- OTPs are compared against their hashed value.
- The default maximum is 5 invalid-code attempts, configurable with `OTP_MAX_ATTEMPTS`. Once the attempt count has reached this limit, a further verification attempt deletes the OTP record and asks the user to request a new one.
- On success, the OTP is marked as verified. It is not marked used by this endpoint; the subsequent reset flow requires a verified, unused OTP.
- The OTP's default expiry is 10 minutes, configurable with `OTP_EXPIRE_MINUTES`.

## Implementation References

This documentation is based on:

- `routes/api.php` — route registration, guest middleware, and rate limit
- `AuthenticationController::verifyPasswordOtp` — OTP lookup, verification, and response
- `VerifyPasswordOtpRequest` — email and OTP validation
- `OtpService` — OTP expiry, attempt limit, hash comparison, and verified state
- `ApiResponse` and API exception handling — response shapes and error behavior

The route middleware was checked with `php artisan route:list`. No feature test specific to password reset OTP verification was found during the documented review.
