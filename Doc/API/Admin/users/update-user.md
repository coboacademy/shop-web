# Update a User

Updates a user's name, email, status, and optionally password or assigned role.

## Endpoint

| Property | Value |
|---|---|
| Method | `PUT` or `PATCH` |
| Path | `/api/users/{user}` |
| Authentication | Required; Sanctum bearer token with `user.update` permission |
| Response format | `application/json` |

The route is registered through `Route::apiResource('users', ...)` in `routes/api.php` and uses the `permission:user.update` middleware. It is also within the protected route group requiring authentication, a verified account, and an active account.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `user` | integer | Yes | User ID to update. Laravel resolves this route parameter to a `User` model. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json
```

Replace `<YOUR_TOKEN>` with a valid token for a user with permission to manage users.

## Request Body

```json
{
  "name": "Alex Example",
  "email": "alex@example.com",
  "password": "new-example-password",
  "password_confirmation": "new-example-password",
  "status": "active",
  "role": "Customer"
}
```

All example values are illustrative; do not use example credentials in a real environment.

### Request Fields

| Field | Type | Required | Constraints / Default | Description |
|---|---|---|---|---|
| `name` | string | Yes | Maximum 255 characters | Updated user name. |
| `email` | string | Yes | Valid email address, maximum 255 characters, unique in `users.email` except for this user | Updated user email address. |
| `password` | string | No | If supplied, minimum 6 characters and must match `password_confirmation` | New password. Omit or send `null` to leave the existing password unchanged. |
| `password_confirmation` | string | Required when changing the password | Must match `password` | Password confirmation. |
| `status` | string | Yes | One of `active`, `pending`, `suspended`, `blocked` | Updated account status. |
| `role` | string or `null` | No | If non-null, must match an existing role name | Role to assign. Omit to keep the current role; send `null` to clear assigned roles. |

Although this endpoint accepts both `PUT` and `PATCH`, the validator still requires `name`, `email`, and `status` for either method.

## Example Request

```bash
curl -X PUT "<API_BASE_URL>/api/users/42" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "name": "Alex Example",
    "email": "alex@example.com",
    "status": "active",
    "role": "Customer"
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example values are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "User updated successfully",
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
      "status": "active",
      "created_at": "2026-10-30 09:00:00",
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
| `data.user.id` | User ID. |
| `data.user.name` | Updated user name. |
| `data.user.email` | Updated user email address. |
| `data.user.email_verified_at` | Email verification timestamp, or `null`. |
| `data.user.is_email_verified` | Whether the user's email is verified. |
| `data.user.role` | First assigned role name, or `null` if there is no role. |
| `data.user.roles` | List of assigned role names. |
| `data.user.permissions` | Permissions granted to the user. |
| `data.user.status` | Updated account status. |
| `data.user.created_at` | User creation timestamp formatted as `Y-m-d H:i:s`. |
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

Returned when the authenticated user does not have the `user.update` permission, or does not meet the protected route group's authorization requirements.

```json
{
  "status": "error",
  "message": "You do not have the required permission."
}
```

### 404 Not Found

Returned when the user ID does not match an existing user.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

### 422 Unprocessable Entity

Returned when validation fails, for example when a required field is missing, the email is invalid or already used by another user, a supplied password is too short or unconfirmed, the status is unsupported, or the specified role does not exist.

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

- The service hashes a non-empty supplied password before storing it; if no password is supplied, the existing password remains unchanged.
- If `role` is omitted, the current role assignment is left unchanged. If `role` is provided, the service synchronizes the user's roles to that role; a `null` value clears the roles.
- The controller records a `user.updated` audit event with the previous and updated name, email, status, and primary role.
- The response uses `UserResource`.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — users resource update route and `user.update` permission middleware
- `UserController::update` — audit event and response wrapper
- `UpdateUserRequest` — authorization and validation rules
- `UserService::update` — password hashing, persistence, and role synchronization
- `UserResource` — returned user fields
- `bootstrap/app.php` — API authentication, permission, and validation error formatting
