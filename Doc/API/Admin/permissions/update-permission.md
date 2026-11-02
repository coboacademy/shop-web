# Update a Permission

Updates a permission's name and authentication guard.

## Endpoint

| Property | Value |
|---|---|
| Method | `PUT` or `PATCH` |
| Path | `/api/permissions/{permission}` |
| Authentication | Required; Sanctum bearer token with `permission.update` permission |
| Response format | `application/json` |

The route is registered through `Route::apiResource('permissions', ...)` in `routes/api.php` and uses the `permission:permission.update` middleware. It is also within the protected route group requiring authentication, a verified account, and an active account.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `permission` | integer | Yes | Permission ID to update. Laravel resolves the parameter to a permission model. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json
```

Replace `<YOUR_TOKEN>` with a valid token for a user authorized to update permissions.

## Request Body

```json
{
  "name": "inventory.manage",
  "guard_name": "web"
}
```

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `name` | string | Yes | Maximum 100 characters; unique in `permissions.name` except for the current permission | Updated permission name. |
| `guard_name` | string | Yes | Maximum 50 characters | Authentication guard for the permission. |

Although both `PUT` and `PATCH` are accepted by the resource route, both fields remain required by the request validator.

## Example Request

```bash
curl -X PUT "<API_BASE_URL>/api/permissions/18" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "name": "inventory.manage",
    "guard_name": "web"
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example values and IDs are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Permission updated successfully",
  "data": {
    "permission": {
      "id": 18,
      "name": "inventory.manage",
      "guard_name": "web",
      "module": "inventory",
      "action": "manage",
      "is_protected": false,
      "created_at": "2026-10-30 09:00:00",
      "updated_at": "2026-10-31 09:00:00"
    }
  }
}
```

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary returned by the controller. |
| `data.permission.id` | Permission ID. |
| `data.permission.name` | Updated permission name. |
| `data.permission.guard_name` | Updated authentication guard. |
| `data.permission.module` | First dot-separated segment of the permission name, or `general` if absent. |
| `data.permission.action` | Second dot-separated segment of the permission name, or `null` if absent. |
| `data.permission.is_protected` | Whether the permission name is configured as protected. |
| `data.permission.created_at` | Creation timestamp formatted as `Y-m-d H:i:s`. |
| `data.permission.updated_at` | Last update timestamp formatted as `Y-m-d H:i:s`. |

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

Returned when the authenticated user lacks the `permission.update` permission or when the target is a protected system permission.

```json
{
  "status": "error",
  "message": "This system permission cannot be edited."
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

### 422 Unprocessable Entity

Returned when `name` or `guard_name` is missing, exceeds its maximum length, or the permission name is already in use by another permission.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "name": [
      "This permission already exists."
    ]
  }
}
```

## Behavior Notes

- Permissions listed in `rbac.protected_permissions` cannot be edited. A blocked attempt also sends a warning notification to the authenticated user.
- The name uniqueness rule ignores the current permission ID.
- After updating, the service synchronizes all permissions to the configured Super Admin role, if present, and clears the permission cache.
- The controller records a `permission.updated` audit event with the previous and updated ID, name, and guard.
- No validation rule requires the permission name to use a particular dotted format; `module` and `action` in the response are derived from the first two dot-separated segments.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — permissions resource update route and `permission.update` middleware
- `UpdatePermissionRequest` — authorization and validation rules
- `PermissionController::update` — protected-permission guard, audit/notification behavior, and response wrapper
- `PermissionService::update` — persistence, Super Admin synchronization, and cache invalidation
- `RbacService` — protected-permission and Super Admin synchronization behavior
- `PermissionResource` — returned permission fields
- `bootstrap/app.php` — API authentication and validation error formatting
