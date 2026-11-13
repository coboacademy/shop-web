# Get Dashboard Summary

Returns system-wide user, role, permission, and audit-log counts, along with recent activity summaries.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/dashboard/summary` |
| Authentication | Required; Sanctum bearer token, verified account, active account, and `dashboard.view` permission |
| Response format | `application/json` |

The route is registered in `routes/api.php` and uses the `auth:sanctum`, `verified`, and `active.user` middleware, plus the `permission:dashboard.view` permission middleware.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token for an authorized user.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/dashboard/summary" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All counts, IDs, names, email addresses, and timestamps below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Dashboard summary fetched successfully",
  "data": {
    "stats": {
      "total_users": 120,
      "active_users": 98,
      "pending_users": 12,
      "suspended_users": 6,
      "blocked_users": 4,
      "total_roles": 8,
      "total_permissions": 35,
      "total_audit_logs": 540
    },
    "recent_users": [
      {
        "id": 82,
        "name": "Example User",
        "email": "user@example.com",
        "status": "active",
        "created_at": "2026-10-31 09:00:00"
      }
    ],
    "recent_audit_logs": [
      {
        "id": 510,
        "action": "vendor.approved",
        "module": "vendor_management",
        "user": {
          "id": 11,
          "name": "Example Admin",
          "email": "admin@example.com"
        },
        "created_at": "2026-10-31 08:55:00"
      }
    ],
    "role_distribution": [
      {
        "id": 1,
        "name": "Admin",
        "users_count": 3
      }
    ],
    "system": {
      "status": "Healthy",
      "environment": "production",
      "timezone": "UTC"
    }
  }
}
```

The arrays may contain fewer entries, including none, when fewer records exist. `recent_users` and `recent_audit_logs` return at most five records each.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary returned by the controller. |
| `data.stats.total_users` | Total number of user records. |
| `data.stats.active_users` | Number of users whose status is `active`. |
| `data.stats.pending_users` | Number of users whose status is `pending`. |
| `data.stats.suspended_users` | Number of users whose status is `suspended`. |
| `data.stats.blocked_users` | Number of users whose status is `blocked`. |
| `data.stats.total_roles` | Total number of roles. |
| `data.stats.total_permissions` | Total number of permissions. |
| `data.stats.total_audit_logs` | Total number of audit-log records. |
| `data.recent_users` | Up to five users, newest first. |
| `data.recent_users[].id` | User ID. |
| `data.recent_users[].name` | User name. |
| `data.recent_users[].email` | User email address. |
| `data.recent_users[].status` | User status; defaults to `active` if the stored value is empty. |
| `data.recent_users[].created_at` | User creation time formatted as `Y-m-d H:i:s`, or `null` if absent. |
| `data.recent_audit_logs` | Up to five audit logs, newest first. |
| `data.recent_audit_logs[].id` | Audit-log ID. |
| `data.recent_audit_logs[].action` | Recorded audit action. |
| `data.recent_audit_logs[].module` | Module associated with the audit event. |
| `data.recent_audit_logs[].user` | Related user summary, or `null` if the audit log has no related user. |
| `data.recent_audit_logs[].user.id` | User ID. |
| `data.recent_audit_logs[].user.name` | User name. |
| `data.recent_audit_logs[].user.email` | User email address. |
| `data.recent_audit_logs[].created_at` | Audit-log creation time formatted as `Y-m-d H:i:s`, or `null` if absent. |
| `data.role_distribution` | Roles ordered by name. |
| `data.role_distribution[].id` | Role ID. |
| `data.role_distribution[].name` | Role name. |
| `data.role_distribution[].users_count` | Number of user-role assignment records for the role. |
| `data.system.status` | Constant health label returned by the service (`Healthy`). |
| `data.system.environment` | Current Laravel application environment. |
| `data.system.timezone` | Configured application timezone. |

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

Returned when the authenticated user lacks the `dashboard.view` permission.

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

The route also requires the `verified` middleware. Its failure response is determined by the framework middleware behavior and is not specified by this controller.

## Behavior Notes

- The dashboard totals are system-wide; they are not scoped to the authenticated user's own records.
- Recent users and audit logs are sorted newest first and limited to five each.
- User and audit-log timestamps are formatted as `Y-m-d H:i:s` without an explicit timezone suffix.
- Role distribution is ordered by role name and counts records in the `model_has_roles` table for each role.
- The controller returns the service summary directly under `data`; it does not apply the imported `DashboardSummaryResource`.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — dashboard summary route and middleware
- `DashboardController::index` — response message and data wrapper
- `DashboardService::summary` — summary sections
- `DashboardService::stats`, `recentUsers`, `recentAuditLogs`, `roleDistribution`, and `system` — field values and ordering
- `EnsureUserIsActive` — inactive-account response
- `bootstrap/app.php` — API authentication and permission error formatting
