# Update the Authenticated User's Profile

Updates the authenticated user's name and email address.

## Endpoint

| Property | Value |
|---|---|
| Method | `PUT` |
| Path | `/api/profile` |
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
  "name": "Alex Example",
  "email": "alex@example.com"
}
```

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `name` | string | Yes | Maximum 255 characters | Updated display name. |
| `email` | string | Yes | Valid email address, maximum 255 characters, unique among other users | Updated email address. |

## Example Request

```bash
curl -X PUT "<API_BASE_URL>/api/profile" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "name": "Alex Example",
    "email": "alex@example.com"
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example values and timestamps are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": 42,
      "name": "Alex Example",
      "email": "alex@example.com",
      "email_verified_at": "2026-10-31 09:00:00",
      "is_email_verified": true,
      "role": "Customer",
      "roles": [
        "Customer"
      ],
      "permissions": [
        "profile.view",
        "profile.update"
      ],
      "status": "active",
      "created_at": "2026-10-30 09:00:00",
      "updated_at": "2026-10-31 09:15:00"
    }
  }
}
```

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary returned by the controller. |
| `data.user.id` | Authenticated user ID. |
| `data.user.name` | Updated user name. |
| `data.user.email` | Updated user email address. |
| `data.user.email_verified_at` | Email verification timestamp, or `null`. |
| `data.user.is_email_verified` | Whether the user's email is verified. |
| `data.user.role` | First assigned role name, or `null` if there is no role. |
| `data.user.roles` | List of assigned role names. |
| `data.user.permissions` | Permission names granted to the user. |
| `data.user.status` | Account status. |
| `data.user.created_at` | Creation timestamp formatted as `Y-m-d H:i:s`, or `null`. |
| `data.user.updated_at` | Last update timestamp formatted as `Y-m-d H:i:s`, or `null`. |

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

Returned when `name` or `email` is missing, the name exceeds 255 characters, the email is invalid or longer than 255 characters, or the email is already used by another account.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "email": [
      "This email address is already used."
    ]
  }
}
```

## Behavior Notes

- The endpoint updates only the authenticated user's record; it does not accept a user ID.
- The controller records a `profile.updated` audit event containing the old and new user ID, name, and email.
- The inspected controller updates the email field but does not explicitly reset email verification or send a verification notification when the email changes. Email-verification behavior on email updates is therefore not guaranteed by this endpoint.
- No password or status changes are accepted by this request.
- The route also requires a verified and active authenticated account. The active-user middleware returns `403` for accounts with `suspended` or `blocked` status; the exact unverified-account response is determined by the framework's `verified` middleware.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — profile update route and middleware
- `UpdateProfileRequest` — authorization and validation rules
- `ProfileController::update` — authenticated-user update, audit event, and response wrapper
- `UserResource` — returned user fields
- `EnsureUserIsActive` — inactive-account response
- `bootstrap/app.php` — API authentication and validation error formatting
