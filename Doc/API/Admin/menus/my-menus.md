# Get Menus for the Authenticated User

Returns active root menus and their active child menus that the authenticated user is authorized to view.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/my-menus` |
| Authentication | Required; Sanctum bearer token, verified account, and active account |
| Response format | `application/json` |

The route is registered in `routes/api.php` in the protected app route group. It has no additional route-level permission middleware; each menu's optional `permission` value is checked against the authenticated user.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/my-menus" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All sample IDs, labels, and routes below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "User menus fetched successfully",
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
            "is_active": true,
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

Menus with a permission the user lacks, inactive menus, and menus that are not root-level or direct children are excluded from this response.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary returned by the controller. |
| `data.menus` | Root menus visible to the authenticated user, ordered by `sort_order` and then `label`. |
| `data.menus[].id` | Menu ID. |
| `data.menus[].name` | Menu key/name. |
| `data.menus[].label` | Display label. |
| `data.menus[].route` | Associated route or `null`. |
| `data.menus[].permission` | Required permission name, or `null` when the menu has no permission restriction. |
| `data.menus[].group` | Menu group. |
| `data.menus[].parent_id` | Parent menu ID; `null` for root menus. |
| `data.menus[].sort_order` | Menu ordering value. |
| `data.menus[].is_active` | Active flag. Returned menus and child menus are active. |
| `data.menus[].is_system` | Whether the menu is a system menu. |
| `data.menus[].created_at` | Creation timestamp formatted as `Y-m-d H:i:s`, or `null`. |
| `data.menus[].updated_at` | Last update timestamp formatted as `Y-m-d H:i:s`, or `null`. |
| `data.menus[].children` | Visible active direct child menus, ordered by `sort_order` and then `label`. Child objects use the same fields and can have an empty `children` array. |

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

Returned when the authenticated account is suspended or blocked:

```json
{
  "status": "error",
  "message": "Your account is not active."
}
```

The route also requires a verified account. The exact response for an unverified account is determined by the framework's `verified` middleware.

## Behavior Notes

- The endpoint returns active root menus, with active direct children loaded.
- A menu without a `permission` value is visible to any authenticated user who can access the route; otherwise, the user's `can()` check for that permission determines visibility.
- Root menus and children are independently filtered for view permission.
- Both root menus and children are ordered by `sort_order`, then `label`.
- The endpoint has no additional route-level `menu.view` permission requirement.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — `/my-menus` route and protected route-group middleware
- `MenuController::myMenus` — authenticated user forwarding and response wrapper
- `MenuService::myMenus` and `canViewMenu` — active/root selection, permission filtering, and ordering
- `MenuResource` — menu fields and nested children
- `EnsureUserIsActive` — inactive-account response
- `bootstrap/app.php` — API authentication and error formatting
