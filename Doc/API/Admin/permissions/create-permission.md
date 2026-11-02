# Create a Permission

Creates a permission with a unique name and guard.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/permissions` |
| Authentication | Required; Sanctum bearer token with `permission.create` permission |
| Response format | `application/json` |

The route is registered through `Route::apiResource('permissions', ...)` in `routes/api.php` and uses the `permission:permission.create` middleware. It is also within the protected route group requiring authentication, a verified account, and an active account.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json
```

Replace `<YOUR_TOKEN>` with a valid token for a user authorized to create permissions.

## Request Body

```json
{
  "name": "inventory.view",
  "guard_name": "web"
}
```

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `name` | string | Yes | Maximum 100 characters; unique in `permissions.name` | Permission name. The validator does not require a particular naming format. |
| `guard_name` | string | Yes | Maximum 50 characters | Authentication guard for the permission. |

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/permissions" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "name": "inventory.view",
    "guard_name": "web"
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. The example permission name is illustrative.

## Successful Response

**HTTP status:** `201 Created`

```json
{
  "status": "success",
  "message": "Permission created successfully",
  "data": {
    "permission": {
      "id": 18,
      "name": "inventory.view",
      "guard_name": "web",
      "module": "inventory",
      "action": "view",
      "is_protected": false,
      "created_at": "2026-10-31 09:00:00",
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
| `data.permission.id` | New permission ID. |
| `data.permission.name` | Permission name. |
| `data.permission.guard_name` | Authentication guard associated with the permission. |
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

Returned when the authenticated user does not have the `permission.create` permission.

```json
{
  "status": "error",
  "message": "You do not have the required permission."
}
```

### 422 Unprocessable Entity

Returned when a required value is missing, a field exceeds its maximum length, or the permission name is already in use.

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

- Both `name` and `guard_name` are required, even though the service has a fallback guard value of `web`.
- After creating the permission, the service synchronizes all permissions to the configured Super Admin role, if that role exists, and clears the permission cache.
- The controller records a `permission.created` audit event.
- The endpoint returns HTTP `201`; no `Location` header behavior is defined in the inspected controller.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — permissions resource route and `permission.create` middleware
- `StorePermissionRequest` — request authorization and field validation
- `PermissionController::store` — audit event and response wrapper
- `PermissionService::create` — permission creation, Super Admin permission synchronization, and cache invalidation
- `RbacService` — Super Admin synchronization behavior
- `PermissionResource` — returned permission fields
- `bootstrap/app.php` — API authentication and validation error formatting
