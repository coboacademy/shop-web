# List Roles

Returns a paginated list of roles, with optional name search and guard filtering.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/roles` |
| Authentication | Required; Sanctum bearer token with `role.view` permission |
| Response format | `application/json` |

The route is registered through `Route::apiResource('roles', ...)` in `routes/api.php` and uses the `permission:role.view` middleware. It is also within the protected route group requiring authentication, a verified account, and an active account.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid token for a user with permission to view roles.

## Query Parameters

| Parameter | Type | Required | Constraints / Default | Description |
|---|---|---|---|---|
| `search` | string | No | Optional free-text value | Searches role names using a `LIKE` pattern. |
| `guard_name` | string | No | Optional guard name | Filters roles to the specified guard. |
| `per_page` | integer | No | Default `10` | Number of roles per page. The controller does not define a maximum. |
| `page` | integer | No | Default `1` | Page number selected by Laravel's paginator. |

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/roles?search=vendor&guard_name=web&per_page=10&page=1" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example values and timestamps are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Roles fetched successfully",
  "data": {
    "roles": [
      {
        "id": 3,
        "name": "Vendor",
        "guard_name": "web",
        "is_protected": false,
        "permissions": [],
        "permissions_count": 8,
        "users_count": 5,
        "created_at": "2026-10-30 09:00:00",
        "updated_at": "2026-10-31 09:00:00"
      }
    ],
    "pagination": {
      "current_page": 1,
      "last_page": 1,
      "per_page": 10,
      "total": 1
    }
  }
}
```

`roles` contains only the current page's roles. The index query counts permissions but does not eager-load their names, so `permissions` is an empty array in this list response.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary returned by the controller. |
| `data.roles` | List of roles for the current page. |
| `data.roles[].id` | Role ID. |
| `data.roles[].name` | Role name. |
| `data.roles[].guard_name` | Authentication guard associated with the role. |
| `data.roles[].is_protected` | Whether the role name is configured as protected. |
| `data.roles[].permissions` | Permission names loaded for the role; empty in this index query. |
| `data.roles[].permissions_count` | Number of permissions assigned to the role. |
| `data.roles[].users_count` | Number of user-role assignment records for the role. |
| `data.roles[].created_at` | Creation timestamp formatted as `Y-m-d H:i:s`. |
| `data.roles[].updated_at` | Last update timestamp formatted as `Y-m-d H:i:s`. |
| `data.pagination` | Pagination metadata. |
| `data.pagination.current_page` | Current page number. |
| `data.pagination.last_page` | Total number of pages. |
| `data.pagination.per_page` | Page size requested or selected by the paginator. |
| `data.pagination.total` | Total number of roles matching the filters. |

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

Returned when the authenticated user does not have the `role.view` permission.

```json
{
  "status": "error",
  "message": "You do not have the required permission."
}
```

## Behavior Notes

- Results are ordered newest first.
- The `per_page` input is cast to an integer by the controller and has a default of 10; the controller does not define an upper bound or explicit validation for it.
- The response includes pagination summary fields but not pagination links.
- The `permissions` field is empty because the list query loads `permissions_count` but does not load the permissions relation. Use the role detail endpoint to retrieve permission names.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — roles resource route and `role.view` permission middleware
- `RoleController::index` — filter handling, pagination, and response wrapper
- `RoleQuery` — role-name search, guard filter, newest-first order, and permission count
- `RoleResource` — serialized role fields
- `bootstrap/app.php` — API authentication and permission error formatting
