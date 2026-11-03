# Resend a User Verification Email

Sends a new email verification notification to a specific user if that user has not already verified their email address.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/users/{user}/resend-verification` |
| Authentication | Required; Sanctum bearer token with `user.update` permission |
| Response format | `application/json` |

The route is registered in `routes/api.php` in the protected app route group and uses the `permission:user.update` middleware.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `user` | integer | Yes | User ID whose verification email should be resent. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid bearer token for a user with permission to manage users.

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/users/42/resend-verification" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. Example values and IDs below are illustrative.

## Successful Responses

### 200 OK — verification email sent

```json
{
  "status": "success",
  "message": "Verification email resent successfully."
}
```

### 200 OK — already verified

If the user already has a verified email, the controller returns:

```json
{
  "status": "success",
  "message": "This user email is already verified."
}
```

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary returned by the controller. |

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

Returned when the authenticated user does not have the `user.update` permission.

```json
{
  "status": "error",
  "message": "You do not have the required permission."
}
```

### 500 Internal Server Error

Returned if sending the verification email fails. In that case, the controller logs the exception and returns the framework's generic server error message or the exception message when app debug is enabled.

## Behavior Notes

- The controller checks `hasVerifiedEmail()` before sending a reminder.
- If the user is already verified, the response is still `200 OK` and it does not attempt to send another message.
- The action records an audit event only when the notification is actually sent, via `AuditService::record(...)` inside the guarded code path.
- The endpoint does not accept a request body and does not validate input beyond the route parameter.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — user verification-resend route and `user.update` permission middleware
- `UserController::resendVerification` — send-if-needed logic, success messages, and exception handling
- `bootstrap/app.php` — standard API error formatting for authentication and permission failures
