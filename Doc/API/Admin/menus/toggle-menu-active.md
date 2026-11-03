# Toggle a Menu's Active State

Flips a menu's `is_active` value and returns the updated menu.

## Endpoint

| Property | Value |
|---|---|
| Method | `PATCH` |
| Path | `/api/menus/{menu}/toggle-active` |
| Authentication | Required; Sanctum bearer token with `menu.update` permission |
| Response format | `application/json` |

The route is registered in `routes/api.php` in the protected app route group and uses the `permission:menu.update` middleware.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `menu` | integer | Yes | Menu ID whose active state should be toggled. Laravel resolves the parameter to a menu model. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid token for a user authorized to update menus.

## Request Body

This endpoint does not accept a request body. Each request toggles the current `is_active` value, so repeating the request toggles it back.

## Example Request

```bash
curl -X PATCH "<API_BASE_URL>/api/menus/2/toggle-active" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. The example menu ID is illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Menu status updated successfully",
  "data": {
    "menu": {
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
      "created_at": "2026-10-30 09:00:00",
      "updated_at": "2026-10-31 09:00:00",
      "children": []
    }
  }
}
```

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary returned by the controller. |
| `data.menu.id` | Menu ID. |
| `data.menu.name` | Menu key/name. |
| `data.menu.label` | Display label. |
| `data.menu.route` | Associated route, or `null`. |
| `data.menu.permission` | Permission required to view the menu, or `null`. |
| `data.menu.group` | Menu group. |
| `data.menu.parent_id` | Parent menu ID, or `null` for a root menu. |
| `data.menu.sort_order` | Menu ordering value. |
| `data.menu.is_active` | Updated active state. |
| `data.menu.is_system` | Whether the menu is a system menu. |
| `data.menu.created_at` | Creation timestamp formatted as `Y-m-d H:i:s`, or `null`. |
| `data.menu.updated_at` | Last update timestamp formatted as `Y-m-d H:i:s`, or `null`. |
| `data.menu.children` | Child menus loaded by the service; each item uses the same menu resource shape. |

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

Returned when the authenticated user does not have the `menu.update` permission.

```json
{
  "status": "error",
  "message": "You do not have the required permission."
}
```

### 404 Not Found

Returned when the menu ID does not match an existing menu.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

## Behavior Notes

- The service sets `is_active` to the inverse of its current value and refreshes the menu with its children.
- The endpoint does not prevent toggling system menus.
- The operation is not idempotent: repeating the same request toggles the state again.
- The route also requires a verified and active authenticated account. The active-user middleware returns `403` for accounts with `suspended` or `blocked` status; the exact unverified-account response is determined by the framework's `verified` middleware.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — menu toggle route and `menu.update` middleware
- `MenuController::toggleActive` — response wrapper
- `MenuService::toggleActive` — boolean inversion and child relation loading
- `MenuResource` — returned menu fields
- `bootstrap/app.php` — API authentication and model-not-found error formatting
