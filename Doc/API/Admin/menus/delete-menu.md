# Delete a Menu

Deletes a menu unless it is marked as a system menu.

## Endpoint

| Property | Value |
|---|---|
| Method | `DELETE` |
| Path | `/api/menus/{menu}` |
| Authentication | Required; Sanctum bearer token with `menu.delete` permission |
| Response format | `application/json` |

The route is registered through `Route::apiResource('menus', ...)` in `routes/api.php` and uses the `permission:menu.delete` middleware. It is also within the protected route group requiring authentication, a verified account, and an active account.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `menu` | integer | Yes | Menu ID to delete. Laravel resolves the parameter to a menu model. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid token for a user authorized to delete menus.

## Example Request

```bash
curl -X DELETE "<API_BASE_URL>/api/menus/9" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. The example menu ID is illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Menu deleted successfully"
}
```

The response does not include a `data` property.

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

Returned when the authenticated user does not have the `menu.delete` permission.

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

### System menu deletion failure

The service calls `abort(422, 'System menus cannot be deleted.')` when the selected menu has `is_system: true`. The route's API exception handler also contains a generic `Throwable` renderer that may transform uncategorized exceptions into HTTP 500 (`Server error.` when debug is disabled, or the exception message when debug is enabled). The final status and body for this abort are therefore not confirmed from the inspected source alone.

## Behavior Notes

- The service blocks deletion when the menu's `is_system` flag is true.
- Non-system menus are deleted using the model's normal `delete()` method.
- No custom handling for menus that have children is defined in the controller or service; resulting relationship behavior depends on the database configuration.
- The route also requires a verified and active authenticated account. The active-user middleware returns `403` for accounts with `suspended` or `blocked` status; the exact unverified-account response is determined by the framework's `verified` middleware.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — menu delete route and `menu.delete` permission middleware
- `MenuController::destroy` — service invocation and response wrapper
- `MenuService::delete` — system-menu guard and deletion
- `bootstrap/app.php` — API authentication, permission, and generic exception handling
