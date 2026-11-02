# Verify an Email Verification OTP

Verifies the six-digit email OTP for the currently authenticated user. Successful
verification marks the email as verified and activates the account.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/email/otp/verify` |
| Route name | `api.email.otp.verify` |
| Authentication | Required; Sanctum bearer token |
| Rate limit | 10 requests per minute |
| Content-Type | `application/json` |
| Response format | `application/json` |

The route is registered in `routes/api.php` and requires `auth:sanctum`.

## Request Headers

```http
Accept: application/json
Content-Type: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Use the bearer token returned during registration.

## Request Body

| Field | Type | Required | Validation |
|---|---|---|---|
| `otp` | string | Yes | Exactly 6 digits |

The authenticated user's email address is used to locate the OTP; do not send an
email address in the request.

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/email/otp/verify" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "otp": "123456"
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with the
Sanctum token. The example OTP is illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Email verified successfully.",
  "data": {
    "user": {
      "id": 1,
      "email": "alex@example.com",
      "email_verified_at": "2026-11-02T00:00:00.000000Z",
      "status": "active"
    }
  }
}
```

The user object is returned through the configured `UserResource`; fields may
vary with the application's resource configuration. If the email is already
verified, the endpoint still succeeds and returns the user.

## Error Responses

### 401 Unauthenticated

Returned when the request does not include a valid authenticated session or
bearer token.

```json
{
  "status": "error",
  "message": "Unauthenticated."
}
```

### 422 Unprocessable Content

Returned when the OTP is missing, is not six digits, or is invalid, expired, or
has exceeded its attempt limit.

```json
{
  "status": "error",
  "message": "Invalid or expired OTP code.",
  "errors": {
    "otp": [
      "Invalid or expired OTP code."
    ]
  }
}
```

A wrong code returns `Invalid OTP code.` After the configured maximum number of
invalid attempts, the OTP is deleted and the user must request another code.

### Rate Limit Exceeded

The route allows 10 requests per minute. The application's API exception
handler currently renders uncaught throttle exceptions as `500 Internal Server
Error` (`Server error.` when debug mode is disabled), rather than the standard
`429 Too Many Requests`. Do not rely on a `429` response until that handling is
updated.

### 500 Internal Server Error

An unexpected verification error returns `Failed to verify email OTP.` when
debug mode is disabled; the message may contain the exception message when
debug mode is enabled.

## Verification Behavior

- The OTP is scoped to the authenticated user's ID and email address.
- Only an unused, unexpired OTP can be verified.
- OTPs are compared against their stored hash.
- On success, the account's `email_verified_at` is set and its status becomes
  `active`. The OTP is marked used and other email verification OTPs for that
  user are deleted.
- OTPs expire after 10 minutes by default (`OTP_EXPIRE_MINUTES`) and allow 5
  invalid attempts by default (`OTP_MAX_ATTEMPTS`).

## Implementation References

- `routes/api.php` — route authentication and throttle middleware
- `AuthenticationController::verifyEmailOtp` — verification and response behavior
- `VerifyEmailOtpRequest` — OTP validation
- `OtpService` — OTP lookup, expiry, attempt limit, and hash comparison
- `UserResource` and `ApiResponse` — response shape
- `bootstrap/app.php` — API exception handling
