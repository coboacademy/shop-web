# Clone a Role

Creates a new role using a source role's guard and permissions, with a caller-provided name.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/roles/{role}/clone` |
| Authentication | Required; Sanctum bearer token with `role.create` permission |
| Response format | `application/json` |

The route is registered in `routes/api.php` in the protected app route group and uses the `permission:role.create` middleware.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `role` | integer | Yes | ID of the role to clone. Laravel resolves this parameter to a role model. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json
```

Replace `<YOUR_TOKEN>` with a valid token for a user authorized to create roles.

## Request Body

```json
{
  "name": "Vendor Support",
  "guard_name": "web"
}
```

| Field | Type | Required | Constraints / Default | Description |
|---|---|---|---|---|
| `name` | string | Yes | Maximum 100 characters; must be unique in the `roles.name` column | Name for the cloned role. |
| `guard_name` | string or `null` | No | Maximum 50 characters; defaults to the source role's guard | Guard to use for the new role. |

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/roles/3/clone" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "name": "Vendor Support",
    "guard_name": "web"
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example values and IDs are illustrative.

## Successful Response

**HTTP status:** `201 Created`

```json
{
  "status": "success",
  "message": "Role cloned successfully",
  "data": {
    "role": {
      "id": 8,
      "name": "Vendor Support",
      "guard_name": "web",
      "is_protected": false,
      "permissions": [
        "product.view",
        "order.view"
      ],
      "permissions_count": 2,
      "users_count": 0,
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
| `data.role.id` | ID of the newly created role. |
| `data.role.name` | New role name. |
| `data.role.guard_name` | Guard used by the new role. |
| `data.role.is_protected` | Whether the new role is configured as a protected role. |
| `data.role.permissions` | Permission names copied from the source role. |
| `data.role.permissions_count` | Number of permissions on the new role. |
| `data.role.users_count` | Number of users assigned to the new role; initially zero. |
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

Returned when the authenticated user does not have the `role.create` permission, or when the source role is protected.

```json
{
  "status": "error",
  "message": "This system role cannot be cloned."
}
```

### 404 Not Found

Returned when the source role ID does not match an existing role.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

### 422 Unprocessable Entity

Returned when `name` is missing, is not a string, exceeds 100 characters, or is already present in the `roles.name` column.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "name": [
      "This role name already exists."
    ]
  }
}
```

## Behavior Notes

- Roles configured in `rbac.protected_roles` cannot be used as clone sources. The default configured protected role is `Super Admin`.
- The clone receives the source role's current permissions.
- If `guard_name` is omitted or `null`, the new role uses the source role's guard.
- The controller records a `role.cloned` audit event and notifies administrators after creating the role.
- The response uses `RoleResource` with permissions loaded and returns HTTP `201`.
- The request checks uniqueness on `roles.name` alone, while the roles system can distinguish roles by guard; therefore a duplicate name in another guard is still rejected by request validation.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — role clone route and `role.create` permission middleware
- `CloneRoleRequest` — request authorization and input validation
- `RoleController::clone` — protected-role guard, audit/notification side effects, and response wrapper
- `RoleService::clone` — role creation and permission copying
- `RbacService` — protected-role configuration
- `RoleResource` — returned role fields
- `bootstrap/app.php` — API authentication and validation error formatting
