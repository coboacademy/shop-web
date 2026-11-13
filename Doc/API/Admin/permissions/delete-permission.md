# Delete a Permission

Deletes a permission and records a permission-deletion audit event.

## Endpoint

| Property | Value |
|---|---|
| Method | `DELETE` |
| Path | `/api/permissions/{permission}` |
| Authentication | Required; Sanctum bearer token with `permission.delete` permission |
| Response format | `application/json` |

The route is registered through `Route::apiResource('permissions', ...)` in `routes/api.php` and uses the `permission:permission.delete` middleware. It is also within the protected route group requiring authentication, a verified account, and an active account.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `permission` | integer | Yes | Permission ID to delete. Laravel resolves the parameter to a permission model. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid token for a user authorized to delete permissions.

## Example Request

```bash
curl -X DELETE "<API_BASE_URL>/api/permissions/18" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. The example permission ID is illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Permission deleted successfully"
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

Returned when the authenticated user lacks the `permission.delete` permission or when the target is a protected permission.

```json
{
  "status": "error",
  "message": "This system permission cannot be deleted."
}
```

### 404 Not Found

Returned when the permission ID does not match an existing permission.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

## Behavior Notes

- Permissions listed in `rbac.protected_permissions` cannot be deleted. A blocked attempt also sends a warning notification to the authenticated user.
- Before deletion, the controller records the permission ID, name, and guard in a `permission.deleted` audit event.
- After deletion, the service synchronizes all remaining permissions to the configured Super Admin role, if present, and clears the permission cache.
- No custom behavior for roles assigned the deleted permission is defined in this controller or service; resulting relationship behavior depends on the permission package and database configuration.
- The route also requires a verified and active authenticated account. The active-user middleware returns `403` for accounts with `suspended` or `blocked` status; the exact unverified-account response is determined by the framework's `verified` middleware.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — permissions resource delete route and `permission.delete` middleware
- `PermissionController::destroy` — protected-permission guard, audit/notification behavior, and response wrapper
- `PermissionService::delete` — deletion, Super Admin synchronization, and cache invalidation
- `RbacService` — protected-permission and Super Admin synchronization configuration
- `bootstrap/app.php` — API authentication and model-not-found error formatting
