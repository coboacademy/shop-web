# Create a Role

Creates a role with a unique name and guard.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/roles` |
| Authentication | Required; Sanctum bearer token with `role.create` permission |
| Response format | `application/json` |

The route is registered through `Route::apiResource('roles', ...)` in `routes/api.php` and uses the `permission:role.create` middleware. It is also within the protected route group requiring authentication, a verified account, and an active account.

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

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `name` | string | Yes | Maximum 100 characters; must be unique in the `roles.name` column | Role name. |
| `guard_name` | string | Yes | Maximum 50 characters | Authentication guard for the role. |

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/roles" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "name": "Vendor Support",
    "guard_name": "web"
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. The example role name is illustrative.

## Successful Response

**HTTP status:** `201 Created`

```json
{
  "status": "success",
  "message": "Role created successfully",
  "data": {
    "role": {
      "id": 8,
      "name": "Vendor Support",
      "guard_name": "web",
      "is_protected": false,
      "permissions": [],
      "permissions_count": 0,
      "users_count": 0,
      "created_at": "2026-10-31 09:00:00",
      "updated_at": "2026-10-31 09:00:00"
    }
  }
}
```

The newly created role has no permissions or assigned users.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary returned by the controller. |
| `data.role.id` | New role ID. |
| `data.role.name` | Role name. |
| `data.role.guard_name` | Authentication guard associated with the role. |
| `data.role.is_protected` | Whether the role name is configured as protected. |
| `data.role.permissions` | Permission names loaded for the role; empty for a newly created role. |
| `data.role.permissions_count` | Number of assigned permissions. |
| `data.role.users_count` | Number of users assigned to the role. |
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

Returned when the authenticated user does not have the `role.create` permission.

```json
{
  "status": "error",
  "message": "You do not have the required permission."
}
```

### 422 Unprocessable Entity

Returned when a required value is missing, a field exceeds its maximum length, or the role name is already in use.

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

- The request requires both `name` and `guard_name`, even though the service contains a `web` default for an omitted guard.
- The role name uniqueness rule checks the `roles.name` column.
- After creation, the controller records a `role.created` audit event.
- The endpoint returns HTTP `201`; no `Location` header behavior is defined in the inspected controller.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — roles resource route and `role.create` permission middleware
- `StoreRoleRequest` — request authorization and field validation
- `RoleController::store` — audit event and response wrapper
- `RoleService::create` — role persistence
- `RoleResource` — returned role fields
- `bootstrap/app.php` — API authentication and validation error formatting
