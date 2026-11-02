# Register a Customer Account

Creates a new customer account, sends an email verification OTP, and returns a bearer token.

**Important:** Email verification is required to complete account verification. The endpoint returns a bearer token before email verification is completed.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/register` |
| Route name | `api.register` |
| Authentication | Not required |
| Content-Type | `application/json` |
| Response format | `application/json` |

The route is registered in `routes/api.php`.

### Request headers

```http
Accept: application/json
Content-Type: application/json
```

The endpoint responds with `201 Created` on success. Its response helper does not set a `Location` header.

## Request Body

Send the following JSON fields in the request body.

| Field | Type | Required | Validation Rules |
|---|---|---|---|
| `name` | string | Yes | Maximum 255 characters |
| `email` | string | Yes | Must be a valid email address, maximum 255 characters, and unique |
| `password` | string | Yes | Minimum 6 characters; must match `password_confirmation` |
| `password_confirmation` | string | Yes | Must exactly match `password` |

All example values in this document—including IDs, email addresses, timestamps, tokens, and OTPs—are illustrative and are not actual account data or guaranteed response values.

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/register" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alex Example",
    "email": "alex@example.com",
    "password": "example-password",
    "password_confirmation": "example-password"
  }'
```

Replace `<API_BASE_URL>` with the base URL of your API.

## Successful Response

**HTTP status:** `201 Created`

When registration succeeds, the API creates the user account, sends an email verification OTP, and returns the user resource and bearer token.

### Example response

```json
{
  "status": "success",
  "message": "User registered successfully. Please verify your email with the OTP code.",
  "data": {
    "user": {
      "id": 123,
      "name": "Alex Example",
      "email": "alex@example.com",
      "email_verified_at": null,
      "is_email_verified": false,
      "role": "Customer",
      "roles": [
        "Customer"
      ],
      "permissions": [],
      "status": "pending",
      "created_at": "2026-10-29 08:00:00",
      "updated_at": "2026-10-29 08:00:00"
    },
    "token": "<YOUR_TOKEN>",
    "token_type": "Bearer",
    "redirect_to": "/app"
  }
}
```

### Response fields

| Field | Description |
|---|---|
| `status` | Indicates whether the operation succeeded. |
| `message` | Describes the registration result and next step. |
| `data.user` | Contains the newly registered user's information. |
| `data.user.id` | Unique identifier of the user. |
| `data.user.name` | Registered user's name. |
| `data.user.email` | Registered email address. |
| `data.user.email_verified_at` | Email verification timestamp; `null` before verification. |
| `data.user.is_email_verified` | Indicates whether the email has been verified. |
| `data.user.role` | First role returned by the user resource, or `null` if there is no role. |
| `data.user.roles` | List of roles associated with the user. |
| `data.user.permissions` | List of permissions returned by the user resource. |
| `data.user.status` | Account status; newly registered accounts have `pending` status. |
| `data.user.created_at` | Account creation timestamp. |
| `data.user.updated_at` | Last update timestamp. |
| `data.token` | Issued bearer token. |
| `data.token_type` | Token type, returned as `Bearer`. |
| `data.redirect_to` | Redirect path selected according to the user's roles and permissions. |

**Notes:**

- The example values are illustrative and may differ from actual responses.
- The controller attempts to assign the default `Customer` role. It ignores an assignment failure if that role is not configured.
- The role, roles, and permissions fields depend on the configured authorization system and user resource.
- The `redirect_to` value may vary according to the user's roles and permissions.

## Using the Bearer Token

Include the returned token in the `Authorization` header when making subsequent authenticated requests.

```http
Authorization: Bearer <YOUR_TOKEN>
```

The endpoint returns a Laravel Sanctum personal access token with the default `*` abilities and no per-token expiry. The current Sanctum configuration sets global token expiration to `null`, so the application does not configure time-based expiry. Tokens can still be revoked, and deployment-specific configuration may differ. The email verification handler does not revoke the token when the account changes from `pending` to `active`.

The token can be used on authenticated basic routes, including email OTP verification, before the account is verified. Protected application routes require a verified, active user.

## Verify the Email Address

Registration sends a six-digit email verification OTP. To complete verification, use the returned bearer token:

See the [email OTP verification reference](./verify-email-otp.md) for request,
response, and error details.

```http
POST /api/email/otp/verify
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json
Accept: application/json
```

```json
{
  "otp": "123456"
}
```

The `otp` field is required and must contain exactly six digits. This authenticated route is limited to 10 requests per minute. A successful verification marks the email verified and changes the account status to `active`. Invalid or expired OTPs return `422 Unprocessable Content`.

## Error Responses

### 422 Unprocessable Content

Returned when the request fails validation.

#### Example: Email already exists

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "email": [
      "This email already exists."
    ]
  }
}
```

The `errors` object contains field-specific validation messages. The response may vary depending on which validation rules fail.

#### Common validation errors

| Condition | Example message |
|---|---|
| Missing name | `Name is required.` |
| Invalid email format | `Email format is invalid.` |
| Email already exists | `This email already exists.` |
| Password shorter than 6 characters | `Password must be at least 6 characters.` |
| Password confirmation mismatch | `Password confirmation does not match.` |

Malformed JSON sent with `Content-Type: application/json` is decoded as empty input by the current Laravel request handling, so it results in the normal `422` required-field validation response rather than a distinct `400` response. If a JSON body is sent without the JSON content type, Laravel does not parse it as JSON; required-field validation will fail unless the data is supplied in another supported request format.

### 500 Internal Server Error

Returned when an unexpected error occurs during registration.

In a non-debug environment, the error message is:

```json
{
  "status": "error",
  "message": "Registration failed"
}
```

When application debug mode is enabled, the response may contain the exception message.

**Important implementation detail:** The user record is created before the verification notification and token are issued. The registration flow does not use a database transaction. Therefore, if a later operation fails, the API may return `500 Internal Server Error` even though the user record has already been created. Clients should not assume that every `500` response means no account was created.

## Rate Limiting

The registered route's expanded middleware does not include throttling, and no `429 Too Many Requests` response is defined for registration by this route. An upstream proxy or hosting layer may still apply its own rate limit; that behavior is outside the application route configuration and is not verified here.

## Registration Behavior

- The endpoint is public and does not require authentication.
- A new user account is created with `pending` status.
- An email verification OTP is sent as part of the registration flow.
- A bearer token is returned before email verification is completed.
- The controller attempts to assign the `Customer` role and ignores an assignment failure if that role is not configured.
- The user resource includes role and permission information from the configured authorization system.
- The redirect path is selected based on the user's roles and permissions.

## Implementation References

This documentation is based on the following application components:

- `routes/api.php` — route registration and middleware for `api.register` and `api.email.otp.verify`
- `AuthenticationController::register` — registration logic
- `AuthenticationController::verifyEmailOtp` — email verification behavior
- `RegisterRequest` — registration request validation
- `VerifyEmailOtpRequest` — OTP validation
- `UserResource` — user response structure
- `ApiResponse` — standardized API responses
- API validation exception handling — validation error responses
- `config/sanctum.php` — token expiration configuration

The route middleware was checked with `php artisan route:list`. No feature test specific to this customer registration endpoint was found during the documented review.

## Testing Recommendations

Consider adding automated tests for:

- Successful registration and the `201 Created` response.
- Missing or invalid request fields.
- Duplicate email addresses.
- Password confirmation mismatch.
- OTP notification failures.
- Token issuance failures.
- Role assignment behavior when the `Customer` role is unavailable.
- Partial registration failures and their effect on existing user records.
