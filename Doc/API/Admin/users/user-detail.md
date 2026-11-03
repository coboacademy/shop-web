# Get a User

Returns the details of a single user, including email verification state, assigned roles, and permissions.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/users/{user}` |
| Authentication | Required; Sanctum bearer token with `user.view` permission |
| Response format | `application/json` |

The route is registered through `Route::apiResource('users', ...)` in `routes/api.php` and is protected by `auth:sanctum`, `verified`, `active.user`, and `permission:user.view` middleware.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `user` | integer | Yes | User ID to retrieve. Laravel resolves this route parameter to a `User` model. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid token for a user with permission to view users.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/users/42" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example values and timestamps are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "User fetched successfully",
  "data": {
    "user": {
      "id": 42,
      "name": "Alex Example",
      "email": "alex@example.com",
      "email_verified_at": "2026-10-31 09:00:00",
      "is_email_verified": true,
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
| `data.user.name` | User name. |
| `data.user.email` | User email address. |
| `data.user.email_verified_at` | Email verification timestamp formatted as `Y-m-d H:i:s`, or `null`. |
| `data.user.is_email_verified` | Whether the user's email is verified. |
| `data.user.role` | First assigned role name, or `null` if there is no role. |
| `data.user.roles` | List of assigned role names. |
| `data.user.permissions` | List of permission names granted to the user. |
| `data.user.status` | User status; defaults to `pending` if the stored value is empty. |
| `data.user.created_at` | User creation timestamp formatted as `Y-m-d H:i:s`, or `null`. |
| `data.user.updated_at` | Last update timestamp formatted as `Y-m-d H:i:s`, or `null`. |

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

Returned when the authenticated user does not have the `user.view` permission.

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

## Behavior Notes

- The route uses Laravel implicit model binding to resolve `{user}` before invoking the controller.
- The endpoint does not modify user data.
- The controller catches exceptions raised while producing the response, logs the exception, and returns `500` with `Failed to fetch user`; model-binding failures are handled separately as `404`.
- The route also requires a verified and active authenticated account. The active-user middleware returns `403` for accounts with `suspended` or `blocked` status; the exact unverified-account response is determined by the framework's `verified` middleware.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — users resource route and middleware
- `UserController::show` — model handling and response wrapper
- `UserResource` — user response fields
- `EnsureUserIsActive` — inactive-account response
- `bootstrap/app.php` — API authentication, permission, and model-not-found error formatting
