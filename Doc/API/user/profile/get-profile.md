# Get the Authenticated User's Profile

Returns the profile of the currently authenticated user.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/profile` |
| Authentication | Required; Sanctum bearer token with `profile.view` permission |
| Response format | `application/json` |

The route is registered in `routes/api.php` and uses the `profile.view` permission middleware. It is also within the protected route group requiring authentication, a verified account, and an active account.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid token for the authenticated user.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/profile" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All sample IDs, names, email addresses, and timestamps are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Profile fetched successfully",
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
| `data.user.id` | Authenticated user ID. |
| `data.user.name` | User name. |
| `data.user.email` | User email address. |
| `data.user.email_verified_at` | Email verification timestamp formatted as `Y-m-d H:i:s`, or `null`. |
| `data.user.is_email_verified` | Whether the user's email is verified. |
| `data.user.role` | First assigned role name, or `null` if there is no role. |
| `data.user.roles` | List of assigned role names. |
| `data.user.permissions` | Permission names granted to the user. |
| `data.user.status` | Account status; defaults to `pending` if the stored value is empty. |
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

Returned when the authenticated user does not have the `profile.view` permission.

```json
{
  "status": "error",
  "message": "You do not have the required permission."
}
```

The active-user middleware also returns `403 Forbidden` when the account status is `suspended` or `blocked`:

```json
{
  "status": "error",
  "message": "Your account is not active."
}
```

The route requires a verified account. The exact response for an unverified account is determined by the framework's `verified` middleware.

## Behavior Notes

- The endpoint returns the authenticated user from the request; it does not accept a user ID and cannot be used to select another user's profile.
- The response uses `UserResource`, including role and permission details.
- This endpoint is read-only.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — profile route and middleware
- `ProfileController::show` — authenticated user selection and response wrapper
- `UserResource` — profile response fields
- `EnsureUserIsActive` — inactive-account response
- `bootstrap/app.php` — API authentication and permission error formatting
