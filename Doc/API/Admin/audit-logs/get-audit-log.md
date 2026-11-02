# Get an Audit Log

Returns the details of one audit log, including its related user when available.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/audit-logs/{auditLog}` |
| Authentication | Required; Sanctum bearer token with `audit.view` permission and a verified, active account |
| Response format | `application/json` |

The route is registered in `routes/api.php` inside the protected app route group and uses the `permission:audit.view` middleware.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `auditLog` | integer | Yes | Audit log ID. Laravel resolves the value to an `AuditLog` model using its primary key. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid bearer token for an authorized user.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/audit-logs/105" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. The example audit log ID is illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Audit log fetched successfully",
  "data": {
    "log": {
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
  }
}
```

All IDs, values, and timestamps are illustrative. The `user` field is `null` when the log has no related user. `old_values` and `new_values` are JSON-decoded values and may be `null`.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary. |
| `data.log.id` | Audit log ID. |
| `data.log.action` | Recorded action. |
| `data.log.module` | Recorded module. |
| `data.log.user` | Related user object (`id`, `name`, and `email`), or `null` when there is no related user. |
| `data.log.auditable_type` | Morph type of the associated record, if present. |
| `data.log.auditable_id` | ID of the associated record, if present. |
| `data.log.old_values` | Previous values recorded for the action, or `null`. |
| `data.log.new_values` | New values recorded for the action, or `null`. |
| `data.log.ip_address` | Recorded client IP address, if present. |
| `data.log.user_agent` | Recorded user-agent string, if present. |
| `data.log.created_at` | Creation timestamp formatted as `Y-m-d H:i:s`, or `null`. |

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

### 404 Not Found

Returned when the supplied ID does not match an existing audit log.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

### 500 Internal Server Error

Returned when loading or serializing the audit log fails. The controller logs the exception. In debug mode the response message can contain the exception message; otherwise it is `Failed to fetch audit log`.

```json
{
  "status": "error",
  "message": "Failed to fetch audit log"
}
```

## Behavior Notes

- The endpoint returns one audit log and does not accept query parameters or a request body.
- The controller loads the related user so the response can include their ID, name, and email.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — detail route, `audit.view` permission, and protected route-group middleware
- `AuditLogController::show` — model handling, response wrapper, and caught-error behavior
- `AuditLogResource` — audit log and related-user response fields
- `AuditLog` — user relation and JSON casts for old/new values
- `bootstrap/app.php` — API authentication, permission, and model-not-found error formatting
- `EnsureUserIsActive` — inactive-account response
