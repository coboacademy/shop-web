# Create a Menu

Creates a menu entry with optional route, permission, grouping, hierarchy, ordering, and active/system flags.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/menus` |
| Authentication | Required; Sanctum bearer token with `menu.create` permission |
| Response format | `application/json` |

The route is registered through `Route::apiResource('menus', ...)` in `routes/api.php` and uses the `permission:menu.create` middleware. It is also within the protected route group requiring authentication, a verified account, and an active account.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json
```

Replace `<YOUR_TOKEN>` with a valid token for a user authorized to create menus.

## Request Body

```json
{
  "name": "inventory",
  "label": "Inventory",
  "route": "/inventory",
  "permission": "inventory.view",
  "group": "Main",
  "parent_id": null,
  "sort_order": 2,
  "is_active": true,
  "is_system": false
}
```

All example values and IDs are illustrative.

### Request Fields

| Field | Type | Required | Constraints / Default | Description |
|---|---|---|---|---|
| `name` | string | Yes | Maximum 100 characters; must match `alpha_dash`; unique in `menus.name` | Menu key/name. |
| `label` | string | Yes | Maximum 100 characters | Display label. |
| `route` | string or `null` | No | Maximum 255 characters | Associated route or URL. |
| `permission` | string or `null` | No | Maximum 150 characters | Permission checked to display this menu to users. The value is not validated against the permissions table. |
| `group` | string or `null` | No | Maximum 100 characters; defaults to `Main` if omitted or null | Menu group. |
| `parent_id` | integer or `null` | No | Must reference an existing menu | Parent menu ID. Defaults to `null`. |
| `sort_order` | integer | No | Minimum `0`; defaults to `0` | Ordering value. |
| `is_active` | boolean | No | Defaults to `true` | Whether the menu is active. |
| `is_system` | boolean | No | Defaults to `false` | Whether the menu is marked as a system menu. |

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/menus" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "name": "inventory",
    "label": "Inventory",
    "route": "/inventory",
    "permission": "inventory.view",
    "group": "Main",
    "sort_order": 2,
    "is_active": true,
    "is_system": false
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example values are illustrative.

## Successful Response

**HTTP status:** `201 Created`

```json
{
  "status": "success",
  "message": "Menu created successfully",
  "data": {
    "menu": {
      "id": 9,
      "name": "inventory",
      "label": "Inventory",
      "route": "/inventory",
      "permission": "inventory.view",
      "group": "Main",
      "parent_id": null,
      "sort_order": 2,
      "is_active": true,
      "is_system": false,
      "created_at": "2026-10-31 09:00:00",
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
| `data.menu.id` | Created menu ID. |
| `data.menu.name` | Menu key/name. |
| `data.menu.label` | Display label. |
| `data.menu.route` | Associated route, or `null`. |
| `data.menu.permission` | Permission required to view the menu, or `null`. |
| `data.menu.group` | Menu group. |
| `data.menu.parent_id` | Parent menu ID, or `null` for a root menu. |
| `data.menu.sort_order` | Menu ordering value. |
| `data.menu.is_active` | Whether the menu is active. |
| `data.menu.is_system` | Whether the menu is a system menu. |
| `data.menu.created_at` | Creation timestamp formatted as `Y-m-d H:i:s`, or `null`. |
| `data.menu.updated_at` | Last update timestamp formatted as `Y-m-d H:i:s`, or `null`. |
| `data.menu.children` | Child menus loaded for this response; an empty array when none are loaded. |

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

Returned when the authenticated user does not have the `menu.create` permission.

```json
{
  "status": "error",
  "message": "You do not have the required permission."
}
```

### 422 Unprocessable Entity

Returned when required fields are missing, values exceed limits or types, the name is not alpha-dash or is already used, or a provided parent ID does not exist.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "name": [
      "The name has already been taken."
    ]
  }
}
```

## Behavior Notes

- The service applies defaults of `group: Main`, `parent_id: null`, `sort_order: 0`, `is_active: true`, and `is_system: false` when those values are omitted.
- The permission string is stored as supplied; it is not checked against existing permission records.
- The response uses `MenuResource`; children are not eager-loaded by the creation action, so `children` is empty.
- The endpoint returns HTTP `201`; no `Location` header behavior is defined in the inspected controller.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — menu create route and `menu.create` permission middleware
- `StoreMenuRequest` — request authorization and validation constraints
- `MenuController::store` — creation flow and response wrapper
- `MenuService::create` — persisted fields and defaults
- `MenuResource` — returned menu fields
- `bootstrap/app.php` — API authentication and validation error formatting
