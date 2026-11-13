# Delete a Role

Deletes a role and records a role-deletion audit event.

## Endpoint

| Property | Value |
|---|---|
| Method | `DELETE` |
| Path | `/api/roles/{role}` |
| Authentication | Required; Sanctum bearer token with `role.delete` permission |
| Response format | `application/json` |

The route is registered through `Route::apiResource('roles', ...)` in `routes/api.php` and uses the `permission:role.delete` middleware. It is also within the protected route group requiring authentication, a verified account, and an active account.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `role` | integer | Yes | Role ID to delete. Laravel resolves the parameter to a role model. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid token for a user authorized to delete roles.

## Example Request

```bash
curl -X DELETE "<API_BASE_URL>/api/roles/3" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. The example role ID is illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Role deleted successfully"
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

Returned when the authenticated user lacks the `role.delete` permission or when the target is a protected system role.

```json
{
  "status": "error",
  "message": "This system role cannot be deleted."
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

- Roles listed in `rbac.protected_roles` cannot be deleted. The default configured protected role is `Super Admin`.
- Before deletion, the controller records the role ID, name, and guard in a `role.deleted` audit event.
- The service calls the role model's normal `delete()` method.
- No custom behavior for users assigned to the deleted role is defined in this controller or service; resulting relationship behavior depends on the role model/database configuration.
- The route also requires a verified and active authenticated account. The active-user middleware returns `403` for accounts with `suspended` or `blocked` status; the exact unverified-account response is determined by the framework's `verified` middleware.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — roles resource delete route and `role.delete` permission middleware
- `RoleController::destroy` — protected-role guard, audit event, and response wrapper
- `RoleService::delete` — role deletion call
- `RbacService` — protected-role configuration
- `bootstrap/app.php` — API authentication and model-not-found error formatting
