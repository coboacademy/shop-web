# Get the RBAC Dashboard

Returns system-wide user and access-control statistics, roles with their user and permission counts, and permissions grouped by module.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/rbac/dashboard` |
| Authentication | Required; Sanctum bearer token, verified account, active account, and `role.view` permission |
| Response format | `application/json` |

The route is registered in `routes/api.php` and uses the `auth:sanctum`, `verified`, and `active.user` middleware, plus the `permission:role.view` permission middleware.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token for an authorized user.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/rbac/dashboard" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example counts and IDs are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "RBAC dashboard fetched successfully",
  "data": {
    "stats": {
      "total_users": 120,
      "active_users": 98,
      "inactive_users": 6,
      "pending_users": 12,
      "total_roles": 8,
      "total_permissions": 35
    },
    "roles": [
      {
        "id": 1,
        "name": "Admin",
        "guard_name": "web",
        "users_count": 3,
        "permissions_count": 35
      }
    ],
    "permission_modules": [
      {
        "module": "user",
        "total": 3,
        "permissions": [
          "user.create",
          "user.update",
          "user.view"
        ]
      }
    ]
  }
}
```

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary returned by the controller. |
| `data.stats.total_users` | Total number of users. |
| `data.stats.active_users` | Number of users whose status is `active`. |
| `data.stats.inactive_users` | Number of users whose status is `inactive`. |
| `data.stats.pending_users` | Number of users whose status is `pending`. |
| `data.stats.total_roles` | Total number of roles. |
| `data.stats.total_permissions` | Total number of permissions. |
| `data.roles` | Roles ordered alphabetically by name. |
| `data.roles[].id` | Role ID. |
| `data.roles[].name` | Role name. |
| `data.roles[].guard_name` | Authentication guard associated with the role. |
| `data.roles[].users_count` | Number of records assigned to the role in the `model_has_roles` table. |
| `data.roles[].permissions_count` | Number of permissions assigned to the role. |
| `data.permission_modules` | Permission groups ordered by permission name, with each group derived from the prefix before the first `.` in a permission name. |
| `data.permission_modules[].module` | Module prefix, or `other` if the permission name has no prefix separator. |
| `data.permission_modules[].total` | Number of permissions in the module group. |
| `data.permission_modules[].permissions` | Permission names in that group, ordered by permission name. |

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

Returned when the authenticated user lacks the `role.view` permission.

```json
{
  "status": "error",
  "message": "You do not have the required permission."
}
```

The active-user middleware also returns `403 Forbidden` when the account status is `suspended` or `blocked`:

```json
{
  "status": "error",
  "message": "Your account is not active."
}
```

The route requires a verified account. The exact response for an unverified account is determined by the framework's `verified` middleware.

### 500 Internal Server Error

If the dashboard query fails, the controller logs the exception and returns a server error. With application debug disabled, the response is:

```json
{
  "status": "error",
  "message": "Failed to fetch RBAC dashboard"
}
```

When application debug is enabled, the response message contains the exception message.

## Behavior Notes

- The statistics and lists are system-wide, not scoped to the authenticated user.
- User statistics count the `active`, `inactive`, and `pending` statuses specifically; other user statuses are not included in those individual counts.
- Roles are ordered by name. Permission names are ordered before grouping by their first dot-separated prefix.
- `users_count` is derived from rows in `model_has_roles` for each role.
- The controller catches exceptions from its queries, logs exception details, and returns HTTP 500.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — RBAC dashboard route and middleware
- `RbacDashboardController::index` — query logic, response shape, and exception handling
- `EnsureUserIsActive` — inactive-account response
- `bootstrap/app.php` — API authentication and permission error formatting
