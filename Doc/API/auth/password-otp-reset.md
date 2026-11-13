# Reset a Password with an OTP

Resets a user's password after the email address and password reset OTP have been verified.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/password/otp/reset` |
| Route name | `api.password.otp.reset` |
| Authentication | Not required; guest route |
| Rate limit | 5 requests per minute |
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
| `password` | string | Yes | Must be a string and at least 6 characters |
| `password_confirmation` | string | Yes | Must exactly match `password` |

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/password/otp/reset" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alex@example.com",
    "otp": "123456",
    "password": "new-example-password",
    "password_confirmation": "new-example-password"
  }'
```

Replace `<API_BASE_URL>` with the base URL of your API. The example email, OTP, and password are illustrative and are not real credentials.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Password reset successfully. Please login with your new password.",
  "data": []
}
```

The endpoint does not return a new authentication token. Log in using the new password.

## Error Responses

### 422 Unprocessable Content

Returned when request validation fails, or when there is no verified, unexpired, unused OTP for the email.

Example for an OTP that is invalid, expired, or has not been verified:

```json
{
  "status": "error",
  "message": "Invalid, expired, or unverified OTP code.",
  "errors": {
    "otp": [
      "Invalid, expired, or unverified OTP code."
    ]
  }
}
```

Validation errors also occur when the email is missing, invalid, or does not belong to an existing user; the OTP is missing or not exactly six digits; the password is missing or shorter than six characters; or `password_confirmation` does not match.

### Rate limit exceeded

The route allows 5 requests per minute. When the limit is exceeded, Laravel raises a throttle exception. The application's catch-all API exception handler currently renders uncaught API exceptions as `500 Internal Server Error` with a generic `Server error.` message in non-debug mode, rather than the standard `429 Too Many Requests` response. Do not rely on a `429` response until this exception handling is changed.

### 500 Internal Server Error

An unexpected reset error returns an error response. In non-debug environments, its message is `Failed to reset password.`; when application debug mode is enabled, the response may contain the exception message.

## Reset Behavior

- The route is for unauthenticated guests and uses the `guest` middleware.
- The OTP must belong to the supplied email, be verified, remain unused, and not be expired.
- The submitted OTP is checked again during reset. Invalid-code attempts count toward the OTP attempt limit.
- The password is updated after validation.
- All Sanctum tokens belonging to the user are deleted after the password update. The user must authenticate again.
- The OTP is marked used and other password reset OTP records for the email are deleted after the password update and token deletion.
- The reset flow does not use a database transaction. If an operation after the password update fails, the request may return an error even though the password has already changed.
- OTP lifetime defaults to 10 minutes and is configurable with `OTP_EXPIRE_MINUTES`. The default maximum of 5 invalid OTP attempts is configurable with `OTP_MAX_ATTEMPTS`.

## Implementation References

This documentation is based on:

- `routes/api.php` — route registration, guest middleware, and rate limit
- `AuthenticationController::resetPasswordWithOtp` — OTP checks, password update, token revocation, and response
- `ResetPasswordWithOtpRequest` — email, OTP, password, and confirmation validation
- `OtpService` — verified OTP lookup, expiry, attempt limit, and used state
- `ApiResponse` and API exception handling — response shapes and error behavior

The route middleware was checked with `php artisan route:list`. No feature test specific to resetting a password with an OTP was found during the documented review.
