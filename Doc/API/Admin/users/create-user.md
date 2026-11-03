# Create a User

Creates a user account, optionally assigns an existing role, records an audit event, and notifies administrators.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/users` |
| Authentication | Required; Sanctum bearer token with `user.create` permission |
| Response format | `application/json` |

The route is registered through `Route::apiResource('users', ...)` in `routes/api.php` and uses the `permission:user.create` middleware. It is also within the protected route group requiring authentication, a verified account, and an active account.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json
```

Replace `<YOUR_TOKEN>` with a valid token for a user authorized to create users.

## Request Body

```json
{
  "name": "Alex Example",
  "email": "alex@example.com",
  "password": "example-password",
  "password_confirmation": "example-password",
  "status": "pending",
  "role": "Customer"
}
```

All example values are illustrative; do not use example credentials in a real environment.

### Request Fields

| Field | Type | Required | Constraints / Default | Description |
|---|---|---|---|---|
| `name` | string | Yes | Maximum 255 characters | User's name. |
| `email` | string | Yes | Valid email address, maximum 255 characters, unique in `users.email` | User's email address. |
| `password` | string | Yes | Minimum 6 characters; must match `password_confirmation` | Password for the new account. |
| `password_confirmation` | string | Yes | Must match `password` | Confirmation of the password. |
| `status` | string | Yes | One of `active`, `pending`, `suspended`, `blocked` | Initial account status. |
| `role` | string or `null` | No | If provided, must match an existing role name | Role to assign to the new user. |

Although the service has a fallback status of `pending`, the request validator requires `status`, so callers must provide it.

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/users" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "name": "Alex Example",
    "email": "alex@example.com",
    "password": "example-password",
    "password_confirmation": "example-password",
    "status": "pending",
    "role": "Customer"
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example values are illustrative.

## Successful Response

**HTTP status:** `201 Created`

```json
{
  "status": "success",
  "message": "User created successfully",
  "data": {
    "user": {
      "id": 42,
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
      "created_at": "2026-10-31 09:00:00",
      "updated_at": "2026-10-31 09:00:00"
    }
  }
}
```

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary returned by the controller. |
| `data.user.id` | Created user ID. |
| `data.user.name` | User name. |
| `data.user.email` | User email address. |
| `data.user.email_verified_at` | Email verification timestamp, or `null` for an unverified account. |
| `data.user.is_email_verified` | Whether the user's email is verified. |
| `data.user.role` | First assigned role name, or `null` if no role was assigned. |
| `data.user.roles` | List of assigned role names. |
| `data.user.permissions` | Permissions granted to the user. |
| `data.user.status` | Account status. |
| `data.user.created_at` | Creation timestamp formatted as `Y-m-d H:i:s`. |
| `data.user.updated_at` | Last update timestamp formatted as `Y-m-d H:i:s`. |

## Error Responses

### 401 Unauthenticated

Returned when the request does not include a valid authenticated session or bearer token.

```json
{
  "status": "error",
  "message": "Unauthenticated."
}
```

### 403 Forbidden

Returned when the authenticated user does not have the `user.create` permission, or does not meet the protected route group's authorization requirements.

```json
{
  "status": "error",
  "message": "You do not have the required permission."
}
```

### 422 Unprocessable Entity

Returned when request validation fails. Examples include a duplicate or invalid email address, missing required values, a password shorter than six characters, mismatched password confirmation, unsupported status, or a role name that does not exist.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "email": [
      "This email address is already used."
    ]
  }
}
```

## Behavior Notes

- The password is hashed before it is stored; it is not included in the response.
- When a non-empty `role` is provided, the service assigns that existing role to the new user.
- The controller records a `user.created` audit event and sends an administrator notification after user creation.
- Email verification is not performed by this endpoint; the response can have `email_verified_at: null` and `is_email_verified: false`.
- The response uses `UserResource` and returns HTTP `201`; no `Location` header behavior is defined in the inspected controller.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — users resource route and `user.create` permission middleware
- `UserController::store` — validation, audit and notification side effects, and response wrapper
- `StoreUserRequest` — request authorization and field validation
- `UserService::create` — password hashing, persistence, and optional role assignment
- `UserResource` — returned user fields
- `ApiResponse::created` — HTTP 201 response status
- `bootstrap/app.php` — API authentication and validation error formatting
