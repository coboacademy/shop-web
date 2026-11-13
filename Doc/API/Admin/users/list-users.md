# List Users

Returns a paginated list of users with supporting stats, search, and status filters.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/users` |
| Authentication | Required; Sanctum bearer token with `user.view` permission |
| Response format | `application/json` |

The route is registered in `routes/api.php` as an `apiResource('users')` endpoint and is protected by the `permission:user.view` middleware.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid bearer token for a user with permission to view users.

## Query Parameters

| Parameter | Type | Required | Constraints / Default | Description |
|---|---|---|---|---|
| `search` | string | No | Free text search | Matches user `name` and `email` using a case-insensitive `LIKE` search pattern. |
| `status` | string | No | `active`, `pending`, `suspended`, `blocked` | Filters to a specific status. |
| `email_verified` | string | No | `verified` or `unverified` | Filters records by whether `email_verified_at` is null or set. |
| `per_page` | integer | No | Default `10` | Number of users per page. |

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/users?search=alex&status=active&per_page=10" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. Example values and timestamps below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Users fetched successfully",
  "data": {
    "users": [
      {
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
    ],
    "pagination": {
      "current_page": 1,
      "last_page": 1,
      "per_page": 10,
      "total": 1
    },
    "stats": {
      "total_users": 120,
      "active_users": 98,
      "pending_users": 12,
      "suspended_users": 6,
      "blocked_users": 4,
      "verified_users": 110,
      "unverified_users": 10
    }
  }
}
```

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary returned by the controller. |
| `data.users` | Paginated list of users for the current page. |
| `data.users[].id` | User ID. |
| `data.users[].name` | User display name. |
| `data.users[].email` | User email address. |
| `data.users[].email_verified_at` | Email verification timestamp, or `null`. |
| `data.users[].is_email_verified` | Whether the user has a verified email address. |
| `data.users[].role` | The first assigned role name, or `null` when no role is assigned. |
| `data.users[].roles` | All assigned role names. |
| `data.users[].permissions` | All permissions granted to the user. |
| `data.users[].status` | Current user status. |
| `data.users[].created_at` | User creation timestamp. |
| `data.users[].updated_at` | Last user update timestamp. |
| `data.pagination` | Pagination metadata. |
| `data.pagination.current_page` | Current page number. |
| `data.pagination.last_page` | Total number of pages. |
| `data.pagination.per_page` | Number of records per page. |
| `data.pagination.total` | Total number of matching users. |
| `data.stats.total_users` | Total user count in the system. |
| `data.stats.active_users` | Number of active users. |
| `data.stats.pending_users` | Number of users in pending status. |
| `data.stats.suspended_users` | Number of suspended users. |
| `data.stats.blocked_users` | Number of blocked users. |
| `data.stats.verified_users` | Number of users with a non-null `email_verified_at`. |
| `data.stats.unverified_users` | Number of users with a null `email_verified_at`. |

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

## Behavior Notes

- The endpoint applies the same search, status, and email-verification filters as the user export route.
- Results are sorted newest first by default via `latest()` before pagination.
- Pagination uses the `per_page` query parameter and defaults to `10`, with no explicit upper bound enforced in the controller.
- The controller returns a list of `UserResource` items rather than the raw model objects.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — `users` resource route and `user.view` permission middleware
- `UserController::index` — query filtering, pagination, and response wrapper
- `UserQuery` — filter behavior for `search`, `status`, and `email_verified`
- `UserResource` — user serialization and status/role/permission fields
- `UserService::stats` — summary counts returned in the response
- `bootstrap/app.php` — API authentication and permission error formatting
