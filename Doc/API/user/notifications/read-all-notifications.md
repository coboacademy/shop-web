# Mark All Notifications as Read

Marks all unread notifications belonging to the authenticated user as read.

## Endpoint

| Property | Value |
|---|---|
| Method | `PATCH` |
| Path | `/api/notifications/read-all` |
| Authentication | Required; Sanctum bearer token, verified account, and active account |
| Response format | `application/json` |

The route is registered in `routes/api.php` in the protected app route group. It has no additional route-level permission middleware.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Request Body

This endpoint does not accept a request body.

## Example Request

```bash
curl -X PATCH "<API_BASE_URL>/api/notifications/read-all" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "All notifications marked as read.",
  "data": {
    "unread_count": 0
  }
}
```

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary returned by the controller. |
| `data.unread_count` | Always returned as `0` after this operation. |

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

Returned when the authenticated account is suspended or blocked:

```json
{
  "status": "error",
  "message": "Your account is not active."
}
```

The route also requires a verified account. The exact response for an unverified account is determined by the framework's `verified` middleware.

## Behavior Notes

- The service updates only notifications whose `user_id` matches the authenticated user and whose `read_at` is currently null.
- Notifications already marked as read are unchanged.
- The endpoint is safe to repeat: subsequent requests leave all notifications read.
- No notification IDs or filter parameters are accepted.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — read-all route and protected route-group middleware
- `NotificationController::readAll` — authenticated user forwarding and response wrapper
- `NotificationService::markAllAsRead` — user-scoped update of unread notifications
- `EnsureUserIsActive` — inactive-account response
- `bootstrap/app.php` — API authentication error formatting
