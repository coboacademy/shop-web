# Get a Role

Returns the details of a role, including its assigned permission names and user count.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/roles/{role}` |
| Authentication | Required; Sanctum bearer token with `role.view` permission |
| Response format | `application/json` |

The route is registered through `Route::apiResource('roles', ...)` in `routes/api.php` and uses the `permission:role.view` middleware. It is also within the protected route group requiring authentication, a verified account, and an active account.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `role` | integer | Yes | Role ID to retrieve. Laravel resolves the parameter to a role model. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid token for a user with permission to view roles.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/roles/3" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example values and IDs are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Role fetched successfully",
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
| `data.role.is_protected` | Whether the role name is configured as protected. |
| `data.role.permissions` | Permission names assigned to the role. |
| `data.role.permissions_count` | Number of assigned permissions. |
| `data.role.users_count` | Number of user-role assignment records for this role. |
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

Returned when the authenticated user does not have the `role.view` permission.

```json
{
  "status": "error",
  "message": "You do not have the required permission."
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

## Behavior Notes

- The role is resolved using Laravel implicit model binding.
- The controller explicitly loads the role's `permissions` relation before creating the resource, so this endpoint includes the permission names unlike the roles list endpoint.
- The endpoint does not modify the role.
- The route also requires a verified and active authenticated account. The active-user middleware returns `403` for accounts with `suspended` or `blocked` status; the exact unverified-account response is determined by the framework's `verified` middleware.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — roles resource detail route and `role.view` permission middleware
- `RoleController::show` — permission relation loading and response wrapper
- `RoleResource` — returned role fields
- `bootstrap/app.php` — API authentication, permission, and model-not-found error formatting
