# Update the Authenticated User's Password

Changes the password for the authenticated user after verifying the current password.

## Endpoint

| Property | Value |
|---|---|
| Method | `PUT` |
| Path | `/api/profile/password` |
| Authentication | Required; Sanctum bearer token with `profile.update` permission |
| Response format | `application/json` |

The route is registered in `routes/api.php` and uses the `profile.update` permission middleware. It is also within the protected route group requiring authentication, a verified account, and an active account.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json
```

Replace `<YOUR_TOKEN>` with a valid token for the authenticated user.

## Request Body

```json
{
  "current_password": "current-example-password",
  "password": "new-example-password",
  "password_confirmation": "new-example-password"
}
```

All example credentials are illustrative and must not be used in a real environment.

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `current_password` | string | Yes | Must match the user's current password | Current password used to authorize the change. |
| `password` | string | Yes | Minimum 6 characters; must match `password_confirmation` | New password. |
| `password_confirmation` | string | Yes | Must match `password` | Confirmation of the new password. |

## Example Request

```bash
curl -X PUT "<API_BASE_URL>/api/profile/password" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "current_password": "current-example-password",
    "password": "new-example-password",
    "password_confirmation": "new-example-password"
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example credentials are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Password updated successfully",
  "data": []
}
```

The API response helper includes an empty `data` object when no response data is provided.

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

Returned when the authenticated user does not have the `profile.update` permission.

```json
{
  "status": "error",
  "message": "You do not have the required permission."
}
```

### 422 Unprocessable Entity

Returned when required fields are missing, the new password is shorter than six characters, the confirmation does not match, or the current password is incorrect.

Incorrect current password response:

```json
{
  "status": "error",
  "message": "Current password is incorrect.",
  "errors": {
    "current_password": [
      "Current password is incorrect."
    ]
  }
}
```

Other request validation failures return the standard API validation response with field errors.

## Behavior Notes

- The controller validates the supplied fields, verifies the current password with `Hash::check`, and stores a hash of the new password.
- A successful change records a `profile.password_updated` audit event; the password value is not included in the audit payload or response.
- The inspected controller does not revoke the user's existing Sanctum tokens as part of this password update.
- The route also requires a verified and active authenticated account. The active-user middleware returns `403` for accounts with `suspended` or `blocked` status; the exact unverified-account response is determined by the framework's `verified` middleware.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — password update route and middleware
- `ProfileController::updatePassword` — validation, current-password check, hash update, audit event, and response
- `bootstrap/app.php` — API authentication and validation error formatting
- `ApiResponse` — success and validation error response envelopes
