# List Permissions

Returns a paginated list of permissions with optional name, guard, and module filters, plus summary counts.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/permissions` |
| Authentication | Required; Sanctum bearer token with `permission.view` permission |
| Response format | `application/json` |

The route is registered through `Route::apiResource('permissions', ...)` in `routes/api.php` and uses the `permission:permission.view` middleware. It is also within the protected route group requiring authentication, a verified account, and an active account.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid token for a user with permission to view permissions.

## Query Parameters

| Parameter | Type | Required | Constraints / Default | Description |
|---|---|---|---|---|
| `search` | string | No | Optional free-text value | Searches permission names using a `LIKE` pattern. |
| `guard_name` | string | No | Optional guard name | Filters permissions to the specified authentication guard. |
| `module` | string | No | Optional module prefix | Filters permissions whose names begin with `<module>.`. |
| `per_page` | integer | No | Default `10` | Number of permissions per page. The controller does not define a maximum. |
| `page` | integer | No | Default `1` | Page number selected by Laravel's paginator. |

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/permissions?module=user&guard_name=web&per_page=10&page=1" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example values and timestamps are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Permissions fetched successfully",
  "data": {
    "permissions": [
      {
        "id": 12,
        "name": "user.view",
        "guard_name": "web",
        "module": "user",
        "action": "view",
        "is_protected": false,
        "created_at": "2026-10-30 09:00:00",
        "updated_at": "2026-10-31 09:00:00"
      }
    ],
    "pagination": {
      "current_page": 1,
      "last_page": 1,
      "per_page": 10,
      "total": 1
    },
    "stats": {
      "total_permissions": 35,
      "protected_permissions": 3
    }
  }
}
```

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary returned by the controller. |
| `data.permissions` | Permissions on the current page. |
| `data.permissions[].id` | Permission ID. |
| `data.permissions[].name` | Permission name as stored. |
| `data.permissions[].guard_name` | Authentication guard associated with the permission. |
| `data.permissions[].module` | First dot-separated segment of the permission name, or `general` if absent. |
| `data.permissions[].action` | Second dot-separated segment of the permission name, or `null` if absent. |
| `data.permissions[].is_protected` | Whether the permission name is configured as protected. |
| `data.permissions[].created_at` | Creation timestamp formatted as `Y-m-d H:i:s`, or `null`. |
| `data.permissions[].updated_at` | Last update timestamp formatted as `Y-m-d H:i:s`, or `null`. |
| `data.pagination` | Pagination summary. |
| `data.pagination.current_page` | Current page number. |
| `data.pagination.last_page` | Total number of pages. |
| `data.pagination.per_page` | Page size requested or selected by the paginator. |
| `data.pagination.total` | Number of permissions matching the filters. |
| `data.stats.total_permissions` | Total permissions across the system, independent of filters. |
| `data.stats.protected_permissions` | Number of permissions whose names are listed in `rbac.protected_permissions`, independent of filters. |

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

Returned when the authenticated user does not have the `permission.view` permission.

```json
{
  "status": "error",
  "message": "You do not have the required permission."
}
```

## Behavior Notes

- Results are ordered alphabetically by permission name.
- The `module` filter uses a prefix pattern of `<module>.%`.
- The `per_page` input is cast to an integer and defaults to 10; the controller does not define an upper bound or explicit validation for it.
- The pagination response contains summary metadata but not pagination links.
- The `stats` values are global counts and are not affected by the query filters.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — permissions resource route and `permission.view` middleware
- `PermissionController::index` — filter handling, pagination, global stats, and response wrapper
- `PermissionQuery` — search, guard and module filters, and name ordering
- `PermissionResource` — serialized permission fields
- `bootstrap/app.php` — API authentication and permission error formatting
