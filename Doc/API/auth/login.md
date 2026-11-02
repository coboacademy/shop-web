# Log In

Authenticates a user with an email address and password, then returns a bearer token.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/login` |
| Route name | `api.login` |
| Authentication | Not required |
| Content-Type | `application/json` |
| Response format | `application/json` |

The route is registered in `routes/api.php`.

### Request headers

```http
Accept: application/json
Content-Type: application/json
```

Successful login returns `200 OK`. The response helper does not set a `Location` header.

## Request Body

| Field | Type | Required | Validation Rules |
|---|---|---|---|
| `email` | string | Yes | Must be a valid email address |
| `password` | string | Yes | Must be a string |

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/login" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alex@example.com",
    "password": "example-password"
  }'
```

Replace `<API_BASE_URL>` with the base URL of your API.

All example values in this document—including user IDs, email addresses, timestamps, and tokens—are illustrative and are not actual account data or guaranteed response values.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Login successfully",
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

The `user` object uses the application's user resource. The primary `role`, roles, and permissions depend on the configured authorization system. The `redirect_to` value is selected from the user's roles and permissions and may differ from the example.

## Using the Bearer Token

Include the returned token in the `Authorization` header on authenticated requests:

```http
Authorization: Bearer <YOUR_TOKEN>
```

The token is a Laravel Sanctum personal access token created with the default `*` abilities and no per-token expiry. The current Sanctum configuration sets global token expiration to `null`, so the application does not configure time-based expiry. Tokens can still be revoked, and deployment-specific configuration may differ.

## Error Responses

### 401 Unauthorized

Returned when the email and password do not authenticate:

```json
{
  "status": "error",
  "message": "Invalid email or password"
}
```

### 403 Forbidden

Users whose account status is `suspended` or `blocked` cannot log in. The response message depends on the status:

```json
{
  "status": "error",
  "message": "Your account has been suspended. Please contact support."
}
```

Blocked accounts return `Your account has been blocked. Please contact support.` The controller logs the user out and does not issue a token for these statuses.

### 422 Unprocessable Content

Returned when request validation fails. The response includes field-specific messages:

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "email": ["Email format is invalid."]
  }
}
```

Common validation messages include `Email is required.`, `Email format is invalid.`, and `Password is required.` No minimum password length is defined by this endpoint's login request rules.

Malformed JSON sent with `Content-Type: application/json` is decoded as empty input by the current Laravel request handling, so required-field validation returns `422` rather than a distinct `400` response.

### 500 Internal Server Error

An unexpected login error returns an error response. In non-debug environments, its message is `Login failed`; when application debug mode is enabled, the response may contain the exception message.

## Login Behavior

- The endpoint is public and does not require an existing bearer token.
- The controller authenticates using the supplied email and password.
- The controller denies accounts with `suspended` or `blocked` status.
- The login handler does not check email verification status or require `active` status before issuing a token. Access to protected application routes is subject to their separate middleware.
- The route does not declare endpoint-specific throttling in its route definition. External infrastructure may apply limits not visible in the application configuration.
- The user resource and redirect path reflect the account's current roles and permissions.

## Implementation References

This documentation is based on:

- `routes/api.php` — route registration for `api.login`
- `AuthenticationController::login` — credential authentication, status checks, and token issuance
- `LoginRequest` — request validation
- `UserResource` — user response structure
- `ApiResponse` — standardized success and error responses
- API validation exception handling — validation error responses
- `config/sanctum.php` — token expiration configuration

The route middleware was checked with `php artisan route:list`. No feature test specific to this login endpoint was found during the documented review.

## Testing Recommendations

Consider adding automated tests for:

- Successful login and the `200 OK` response.
- Missing email or password and invalid email format.
- Incorrect email/password combinations.
- Suspended and blocked accounts.
- Login by an unverified, pending user and access to protected routes.
- Token issuance and use on authenticated endpoints.
