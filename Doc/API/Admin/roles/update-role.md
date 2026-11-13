# Update a Role

Updates a role's name and authentication guard.

## Endpoint

| Property | Value |
|---|---|
| Method | `PUT` or `PATCH` |
| Path | `/api/roles/{role}` |
| Authentication | Required; Sanctum bearer token with `role.update` permission |
| Response format | `application/json` |

The route is registered through `Route::apiResource('roles', ...)` in `routes/api.php` and uses the `permission:role.update` middleware. It is also within the protected route group requiring authentication, a verified account, and an active account.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `role` | integer | Yes | Role ID to update. Laravel resolves the parameter to a role model. |

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
  "name": "Vendor Support",
  "guard_name": "web"
}
```

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `name` | string | Yes | Maximum 100 characters; unique in `roles.name` except for the current role | Updated role name. |
| `guard_name` | string | Yes | Maximum 50 characters | Authentication guard for the role. |

Although both `PUT` and `PATCH` are accepted by the resource route, both fields remain required by the request validator.

## Example Request

```bash
curl -X PUT "<API_BASE_URL>/api/roles/3" \
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

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Role updated successfully",
  "data": {
    "role": {
      "id": 3,
      "name": "Vendor Support",
      "guard_name": "web",
      "is_protected": false,
      "permissions": [],
      "permissions_count": 0,
      "users_count": 5,
      "created_at": "2026-10-30 09:00:00",
      "updated_at": "2026-10-31 09:00:00"
    }
  }
}
```

The update endpoint does not load the permissions relation; therefore the `permissions` field is an empty array in this response even if the role has assigned permissions.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary returned by the controller. |
| `data.role.id` | Role ID. |
| `data.role.name` | Updated role name. |
| `data.role.guard_name` | Updated authentication guard. |
| `data.role.is_protected` | Whether the role name is configured as protected. |
| `data.role.permissions` | Loaded permission names; empty in this update response because the relation is not loaded. |
| `data.role.permissions_count` | Permission count; zero when no relation or count is loaded by the query. |
| `data.role.users_count` | Number of user-role assignment records for the role. |
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
  "message": "This system role cannot be edited."
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

Returned when `name` or `guard_name` is missing, exceeds its maximum length, or the role name is already in use by another role.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "name": [
      "This role already exists."
    ]
  }
}
```

## Behavior Notes

- Roles configured in `rbac.protected_roles` cannot be edited. The default configured protected role is `Super Admin`.
- The request uniqueness rule ignores the current role ID and checks role name uniqueness in `roles.name`.
- The controller records a `role.updated` audit event with the previous and updated ID, name, and guard.
- Updating the role does not change its permission assignments.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — roles resource update route and `role.update` middleware
- `UpdateRoleRequest` — authorization and validation rules
- `RoleController::update` — protected-role guard, audit event, and response wrapper
- `RoleService::update` — role persistence
- `RbacService` — protected-role configuration
- `RoleResource` — returned role fields
- `bootstrap/app.php` — API authentication and validation error formatting
