# Resend an Email Verification OTP

Issues a new email verification OTP to the currently authenticated user. The
previous verification OTP is replaced.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/email/otp/resend` |
| Route name | `api.email.otp.resend` |
| Authentication | Required; Sanctum bearer token |
| Rate limit | 3 requests per minute |
| Response format | `application/json` |

The route is registered in `routes/api.php` and requires `auth:sanctum`.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

No request body or query parameters are required. Use the bearer token returned
during registration.

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/email/otp/resend" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with the
Sanctum token.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Verification OTP has been sent to your email.",
  "data": []
}
```

If the user's email is already verified, the request also succeeds, but no
additional OTP is sent:

```json
{
  "status": "success",
  "message": "Email is already verified.",
  "data": []
}
```

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

### Rate Limit Exceeded

The route allows 3 requests per minute. The application's API exception handler
currently renders uncaught throttle exceptions as `500 Internal Server Error`
(`Server error.` when debug mode is disabled), rather than the standard `429 Too
Many Requests`. Do not rely on a `429` response until that handling is updated.

### 500 Internal Server Error

An unexpected error while generating or sending the OTP returns
`Failed to resend verification OTP.` when debug mode is disabled; the message
may contain the exception message when debug mode is enabled.

## Resend Behavior

- The OTP is sent to the authenticated user's email address; the request cannot
  choose another recipient.
- Generating a new email verification OTP deletes the user's previous OTP
  record, so only the newly sent code can be used.
- OTPs expire after 10 minutes by default (`OTP_EXPIRE_MINUTES`).
- No OTP is sent if the user's email is already verified.

## Implementation References

- `routes/api.php` — route authentication and throttle middleware
- `AuthenticationController::resendEmailVerificationOtp` — resend and response
  behavior
- `OtpService::createEmailVerificationOtp` — OTP generation and replacement
- `EmailVerificationOtpNotification` — email content
- `ApiResponse` and `bootstrap/app.php` — response and exception handling
