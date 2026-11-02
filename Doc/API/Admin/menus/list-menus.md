# List Menus for Administration

Returns all root menus and their direct children for administrative management, including inactive menus.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/menus` |
| Authentication | Required; Sanctum bearer token with `menu.view` permission |
| Response format | `application/json` |

The route is registered through `Route::apiResource('menus', ...)` in `routes/api.php` and uses the `permission:menu.view` middleware. It is also within the protected route group requiring authentication, a verified account, and an active account.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid token for a user with permission to view menus.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/menus" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All sample IDs, labels, and routes below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Menus fetched successfully",
  "data": {
    "menus": [
      {
        "id": 1,
        "name": "dashboard",
        "label": "Dashboard",
        "route": "/dashboard",
        "permission": "dashboard.view",
        "group": "Main",
        "parent_id": null,
        "sort_order": 0,
        "is_active": true,
        "is_system": true,
        "created_at": "2026-10-31 09:00:00",
        "updated_at": "2026-10-31 09:00:00",
        "children": [
          {
            "id": 2,
            "name": "users",
            "label": "Users",
            "route": "/users",
            "permission": "user.view",
            "group": "Main",
            "parent_id": 1,
            "sort_order": 1,
            "is_active": false,
            "is_system": false,
            "created_at": "2026-10-31 09:00:00",
            "updated_at": "2026-10-31 09:00:00",
            "children": []
          }
        ]
      }
    ]
  }
}
```

The `menus` collection contains root menus only; each root includes its direct children.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary returned by the controller. |
| `data.menus` | Root menus returned for administration. |
| `data.menus[].id` | Menu ID. |
| `data.menus[].name` | Menu key/name. |
| `data.menus[].label` | Display label. |
| `data.menus[].route` | Associated route, or `null`. |
| `data.menus[].permission` | Permission required to view the menu, or `null`. |
| `data.menus[].group` | Menu group. |
| `data.menus[].parent_id` | Parent ID; `null` for root menus. |
| `data.menus[].sort_order` | Menu ordering value. |
| `data.menus[].is_active` | Whether the menu is active. |
| `data.menus[].is_system` | Whether the menu is a system menu. |
| `data.menus[].created_at` | Creation timestamp formatted as `Y-m-d H:i:s`, or `null`. |
| `data.menus[].updated_at` | Last update timestamp formatted as `Y-m-d H:i:s`, or `null`. |
| `data.menus[].children` | Direct child menus; each child uses the same fields and may have its own `children` array. |

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

Returned when the authenticated user does not have the `menu.view` permission.

```json
{
  "status": "error",
  "message": "You do not have the required permission."
}
```

## Behavior Notes

- Unlike `/api/my-menus`, this endpoint does not filter inactive menus or apply per-menu permission checks.
- Only root menus are selected at the top level, and the `children` relation returns their direct children.
- Root menus and children are ordered by `sort_order`, then `label`.
- The route also requires a verified and active authenticated account. The active-user middleware returns `403` for accounts with `suspended` or `blocked` status; the exact unverified-account response is determined by the framework's `verified` middleware.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — menu index route and `menu.view` permission middleware
- `MenuController::index` — response wrapper
- `MenuService::adminMenus` — root selection, direct child loading, and ordering
- `MenuResource` — menu fields and nested children
- `bootstrap/app.php` — API authentication and permission error formatting
