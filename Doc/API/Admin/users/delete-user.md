# Delete a User

Deletes a user account and records a user-deletion audit event.

## Endpoint

| Property | Value |
|---|---|
| Method | `DELETE` |
| Path | `/api/users/{user}` |
| Authentication | Required; Sanctum bearer token with `user.delete` permission |
| Response format | `application/json` |

The route is registered through `Route::apiResource('users', ...)` in `routes/api.php` and uses the `permission:user.delete` middleware. It is also within the protected route group requiring authentication, a verified account, and an active account.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `user` | integer | Yes | User ID to delete. Laravel resolves this route parameter to a `User` model. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid token for a user with permission to delete users.

## Example Request

```bash
curl -X DELETE "<API_BASE_URL>/api/users/42" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. The example user ID is illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "User deleted successfully"
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

Returned when the authenticated user does not have the `user.delete` permission.

```json
{
  "status": "error",
  "message": "You do not have the required permission."
}
```

### 404 Not Found

Returned when the user ID does not match an existing user.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

## Behavior Notes

- The controller captures the user's ID, name, email, status, and first assigned role for the audit record before deletion.
- A `user.deleted` audit event is recorded, then the service calls Eloquent's `delete()` method.
- The `User` model does not use Laravel's `SoftDeletes` trait, so this action uses the model's normal deletion behavior.
- No explicit guard preventing deletion of the authenticated user's own account was identified in the inspected action.
- The route also requires a verified and active authenticated account. The active-user middleware returns `403` for accounts with `suspended` or `blocked` status; the exact unverified-account response is determined by the framework's `verified` middleware.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — users resource delete route and `user.delete` permission middleware
- `UserController::destroy` — audit data, audit event, and response wrapper
- `UserService::delete` — Eloquent deletion behavior
- `User` — model traits, including the absence of `SoftDeletes`
- `bootstrap/app.php` — API authentication, permission, and model-not-found error formatting
