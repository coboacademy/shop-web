# Update a User Status

Updates the status of a specific user and invalidates active tokens when the user is suspended or blocked.

## Endpoint

| Property | Value |
|---|---|
| Method | `PATCH` |
| Path | `/api/users/{user}/status` |
| Authentication | Required; Sanctum bearer token with `user.update` permission |
| Response format | `application/json` |

The route is registered in `routes/api.php` in the protected app route group and uses the `permission:user.update` middleware.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `user` | integer | Yes | User ID whose status should be updated. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json
```

Replace `<YOUR_TOKEN>` with a valid bearer token for a user with permission to manage users.

## Request Body

```json
{
  "status": "suspended"
}
```

### Request Fields

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `status` | string | Yes | One of `active`, `pending`, `suspended`, `blocked` | New account status. |

## Example Request

```bash
curl -X PATCH "<API_BASE_URL>/api/users/42/status" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "status": "suspended"
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. Example values and IDs below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "User status updated successfully",
  "data": {
    "user": {
      "id": 42,
      "name": "Example User",
      "email": "user@example.com",
      "email_verified_at": "2026-10-31 09:00:00",
      "is_email_verified": true,
      "role": "Customer",
      "roles": [
        "Customer"
      ],
      "permissions": [],
      "status": "suspended",
      "created_at": "2026-10-30 10:00:00",
      "updated_at": "2026-10-31 09:15:00"
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
| `data.user.email_verified_at` | Email verification timestamp, or `null`. |
| `data.user.is_email_verified` | Whether the user has a verified email address. |
| `data.user.role` | Primary role name, or `null` if none exists. |
| `data.user.roles` | Ordered list of role names. |
| `data.user.permissions` | Permission names granted to the user. |
| `data.user.status` | Updated user status. |
| `data.user.created_at` | Creation timestamp. |
| `data.user.updated_at` | Last update timestamp. |

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

Returned when the authenticated user does not have the `user.update` permission.

```json
{
  "status": "error",
  "message": "You do not have the required permission."
}
```

### 422 Unprocessable Entity

Returned when the request payload is invalid or when the authenticated user tries to suspend or block their own account.

Validation error example:

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "status": [
      "Selected status is invalid."
    ]
  }
}
```

Self-suspension guard example:

```json
{
  "status": "error",
  "message": "You cannot suspend or block your own account.",
  "errors": {
    "status": [
      "You cannot suspend or block your own account."
    ]
  }
}
```

## Behavior Notes

- The request validates the new status against `active,pending,suspended,blocked`.
- If the target user is the authenticated user and the new status is `suspended` or `blocked`, the controller rejects the request before updating.
- A successful status change updates the user and immediately deletes all personal access tokens when the new status is `suspended` or `blocked`.
- The route uses the `UserResource` serializer to return the updated user payload.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — user status-update route and `user.update` permission middleware
- `UserController::updateStatus` — self-protection check, status update, notifications, and response wrapping
- `UpdateUserStatusRequest` — allowed values and validation messages
- `UserService::updateStatus` — persistence and token invalidation for suspended or blocked accounts
- `UserResource` — returned user fields and role/permission data
- `bootstrap/app.php` — standard API validation and permission error formatting
