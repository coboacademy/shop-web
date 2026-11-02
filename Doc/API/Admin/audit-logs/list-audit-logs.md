# List Audit Logs

Returns a paginated list of audit logs, newest first. Results can be filtered by search text, module, action, and creation date.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/audit-logs` |
| Authentication | Required; Sanctum bearer token with `audit.view` permission and a verified, active account |
| Response format | `application/json` |

The route is registered in `routes/api.php` inside the protected app route group and uses the `permission:audit.view` middleware.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid bearer token for an authorized user.

## Query Parameters

All parameters are optional.

| Parameter | Type | Constraints / Default | Description |
|---|---|---|---|
| `search` | string | Optional free-text value | Case-insensitive partial match against the action, module, IP address, related user's name, or related user's email. |
| `module` | string | Optional | Exact match for the audit log module. |
| `action` | string | Optional | Exact match for the audit log action. |
| `date_from` | date string | Optional | Includes logs created on or after this date. |
| `date_to` | date string | Optional | Includes logs created on or before this date. |
| `per_page` | integer | Defaults to `10`; no explicit maximum is applied by the controller. | Number of log entries requested per page. |
| `page` | integer | Laravel paginator parameter; defaults to `1`. | Page number to return. |

Date filters compare the date portion of `created_at`; use `YYYY-MM-DD` values. The controller does not define endpoint-specific validation for these parameters.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/audit-logs?search=updated&module=users&date_from=2026-10-01&per_page=20&page=1" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. Query values and example data are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Audit logs fetched successfully",
  "data": {
    "logs": [
      {
        "id": 105,
        "action": "user.updated",
        "module": "users",
        "user": {
          "id": 7,
          "name": "Example Admin",
          "email": "admin@example.com"
        },
        "auditable_type": "App\\Models\\User",
        "auditable_id": "42",
        "old_values": {
          "status": "pending"
        },
        "new_values": {
          "status": "active"
        },
        "ip_address": "192.0.2.10",
        "user_agent": "Example client",
        "created_at": "2026-10-31 09:00:00"
      }
    ],
    "pagination": {
      "current_page": 1,
      "last_page": 4,
      "per_page": 20,
      "total": 73
    }
  }
}
```

All IDs, values, and timestamps in this response are illustrative. `user` is `null` when the audit log has no related user. The `old_values` and `new_values` fields contain JSON-decoded values and may be `null`.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary. |
| `data.logs` | Audit log entries for the requested page. |
| `data.logs[].id` | Audit log ID. |
| `data.logs[].action` | Recorded action. |
| `data.logs[].module` | Recorded module. |
| `data.logs[].user` | Related user object (`id`, `name`, and `email`), or `null` when there is no related user. |
| `data.logs[].auditable_type` | Morph type of the associated record, if present. |
| `data.logs[].auditable_id` | ID of the associated record, if present. |
| `data.logs[].old_values` | Previous values recorded for the action, or `null`. |
| `data.logs[].new_values` | New values recorded for the action, or `null`. |
| `data.logs[].ip_address` | Recorded client IP address, if present. |
| `data.logs[].user_agent` | Recorded user-agent string, if present. |
| `data.logs[].created_at` | Creation timestamp formatted as `Y-m-d H:i:s`, or `null`. |
| `data.pagination.current_page` | Current page number. |
| `data.pagination.last_page` | Last available page number. |
| `data.pagination.per_page` | Number of records requested per page. |
| `data.pagination.total` | Total number of matching records across all pages. |

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

Returned when the authenticated user does not have the `audit.view` permission.

```json
{
  "status": "error",
  "message": "You do not have the required permission."
}
```

The active-account middleware also returns `403` for suspended or blocked accounts:

```json
{
  "status": "error",
  "message": "Your account is not active."
}
```

The route also requires a verified account. The exact response for an unverified account is determined by the framework's `verified` middleware.

## Behavior Notes

- Search is a partial match across action, module, IP address, user name, and user email. Module and action filters are exact matches.
- When both date filters are provided, both apply to the same `created_at` date.
- Results are ordered newest first.
- The pagination object contains summary metadata only; it does not include page links.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — list route, `audit.view` permission, and protected route-group middleware
- `AuditLogController::index` — query parameter handling and response wrapper
- `AuditLogQuery` — filtering, eager-loaded user relation, pagination, and ordering
- `AuditLogResource` — audit log and related-user response fields
- `ApiResponse` — pagination metadata shape
- `bootstrap/app.php` — API authentication and permission error formatting
- `EnsureUserIsActive` — inactive-account response
