# Sync Permissions for a Role

Replaces the permissions assigned to a role with the permission names provided in the request.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/roles/{role}/permissions` |
| Authentication | Required; Sanctum bearer token with `role.update` permission |
| Response format | `application/json` |

The route is registered in `routes/api.php` in the protected app route group and uses the `permission:role.update` middleware.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `role` | integer | Yes | Role ID whose permissions will be replaced. Laravel resolves the parameter to a role model. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json
```

Replace `<YOUR_TOKEN>` with a valid token for a user authorized to update roles.

## Request Body

```json
{
  "permissions": [
    "product.view",
    "order.view"
  ]
}
```

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `permissions` | array of strings | Yes | Every item must match an existing permission name. An empty array is allowed. | Complete permission set to assign to the role. |

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/roles/3/permissions" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "permissions": [
      "product.view",
      "order.view"
    ]
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. Example role and permission names and IDs are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Role permissions updated successfully",
  "data": {
    "role": {
      "id": 3,
      "name": "Vendor",
      "guard_name": "web",
      "is_protected": false,
      "permissions": [
        "product.view",
        "order.view"
      ],
      "permissions_count": 2,
      "users_count": 5,
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
| `data.role.id` | Role ID. |
| `data.role.name` | Role name. |
| `data.role.guard_name` | Authentication guard associated with the role. |
| `data.role.is_protected` | Whether the role is configured as protected. |
| `data.role.permissions` | Permission names assigned after synchronization. |
| `data.role.permissions_count` | Number of assigned permissions. |
| `data.role.users_count` | Number of user-role assignment records. |
| `data.role.created_at` | Role creation timestamp formatted as `Y-m-d H:i:s`. |
| `data.role.updated_at` | Last update timestamp formatted as `Y-m-d H:i:s`. |

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

Returned when the authenticated user lacks the `role.update` permission or when the target is a protected system role.

```json
{
  "status": "error",
  "message": "This system role permissions cannot be changed manually."
}
```

### 404 Not Found

Returned when the role ID does not match an existing role.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

### 422 Unprocessable Entity

Returned when `permissions` is missing, is not an array, or contains a permission name that does not exist.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "permissions.0": [
      "One or more selected permissions do not exist."
    ]
  }
}
```

## Behavior Notes

- Synchronization replaces the role's entire permission set with the supplied array; an empty array removes all permissions from the role.
- Each permission is validated by its name against the `permissions` table.
- Roles listed in `rbac.protected_roles` cannot be changed manually. The default configured protected role is `Super Admin`; an attempted change also triggers a warning notification to the authenticated user.
- On success, the controller records a `role.permissions.synced` audit event and notifies administrators with the previous and new permission lists.
- The response returns the updated role with its permissions loaded.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — role permissions sync route and `role.update` middleware
- `SyncRolePermissionsRequest` — authorization and payload validation
- `RoleController::syncPermissions` — protected-role guard, audit/notification side effects, and response wrapper
- `RoleService::syncPermissions` — permission replacement and refreshed relation
- `RbacService` — protected-role configuration
- `RoleResource` — returned role fields
- `bootstrap/app.php` — API authentication and validation error formatting
