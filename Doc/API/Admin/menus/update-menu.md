# Update a Menu

Updates a menu's name, label, route, permission, group, hierarchy, ordering, and active state.

## Endpoint

| Property | Value |
|---|---|
| Method | `PUT` or `PATCH` |
| Path | `/api/menus/{menu}` |
| Authentication | Required; Sanctum bearer token with `menu.update` permission |
| Response format | `application/json` |

The route is registered through `Route::apiResource('menus', ...)` in `routes/api.php` and uses the `permission:menu.update` middleware. It is also within the protected route group requiring authentication, a verified account, and an active account.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `menu` | integer | Yes | Menu ID to update. Laravel resolves the parameter to a menu model. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json
```

Replace `<YOUR_TOKEN>` with a valid token for a user authorized to update menus.

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
  "is_active": true
}
```

All example values and IDs are illustrative.

### Request Fields

| Field | Type | Required | Constraints / Default | Description |
|---|---|---|---|---|
| `name` | string | Yes | Maximum 100 characters; must match `alpha_dash`; unique in `menus.name` except for this menu | Menu key/name. |
| `label` | string | Yes | Maximum 100 characters | Display label. |
| `route` | string or `null` | No | Maximum 255 characters; if omitted or `null`, service stores `null` | Associated route or URL. |
| `permission` | string or `null` | No | Maximum 150 characters; if omitted or `null`, service stores `null` | Permission checked when showing this menu to users. The value is not checked against the permissions table. |
| `group` | string or `null` | No | Maximum 100 characters; defaults to `Main` if omitted or `null` | Menu group. |
| `parent_id` | integer or `null` | No | Must reference an existing menu and cannot equal this menu's ID; if omitted or `null`, service stores `null` | Parent menu ID. |
| `sort_order` | integer | No | Minimum `0`; if omitted or `null`, keeps the current value | Ordering value. |
| `is_active` | boolean | No | If omitted or `null`, keeps the current value | Whether the menu is active. |

The validator does not include `is_system` as an accepted field. The controller nevertheless checks the raw request value for system menus; see Behavior Notes.

## Example Request

```bash
curl -X PUT "<API_BASE_URL>/api/menus/9" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "name": "inventory",
    "label": "Inventory",
    "route": "/inventory",
    "permission": "inventory.view",
    "group": "Main",
    "parent_id": null,
    "sort_order": 2,
    "is_active": true
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example values and IDs are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Menu updated successfully",
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
| `data.menu.is_active` | Whether the menu is active. |
| `data.menu.is_system` | Whether the menu is a system menu. This field is not updated by this endpoint. |
| `data.menu.created_at` | Creation timestamp formatted as `Y-m-d H:i:s`, or `null`. |
| `data.menu.updated_at` | Last update timestamp formatted as `Y-m-d H:i:s`, or `null`. |
| `data.menu.children` | Child menus loaded by the service; each child uses the same resource shape. |

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

### 422 Unprocessable Entity

Returned when validation fails, including missing required fields, an invalid or duplicate name, an invalid parent ID, or attempting to set the menu as its own parent.

For an existing system menu, the controller returns this error when the raw request's `is_system` value is false or omitted:

```json
{
  "status": "error",
  "message": "System menu cannot be converted to normal menu."
}
```

This response is generated directly by the controller and does not include a validation `errors` object.

## Behavior Notes

- Both `PUT` and `PATCH` are accepted by the resource route, but `name` and `label` are required for both methods.
- Omitted `route`, `permission`, `group`, and `parent_id` values are written using the service's defaults (`null`, `null`, `Main`, and `null`, respectively). Omitted `sort_order` and `is_active` retain their existing values.
- A menu cannot be its own parent, but the validator does not otherwise prevent deeper circular menu hierarchies.
- The controller rejects an existing system menu unless the raw request includes a truthy `is_system` value. However, `is_system` is not part of the validated fields and the service does not update it; the request value only bypasses this guard.
- The service refreshes the menu with its direct children before returning it.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — menu update route and `menu.update` middleware
- `UpdateMenuRequest` — authorization and validation constraints
- `MenuController::update` — system-menu guard and response wrapper
- `MenuService::update` — persisted fields, defaults, and child relation loading
- `MenuResource` — returned menu fields
- `bootstrap/app.php` — API authentication and validation error formatting
