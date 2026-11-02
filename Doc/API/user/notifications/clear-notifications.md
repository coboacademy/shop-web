# Clear Notifications

Deletes all notifications belonging to the authenticated user, including both read and unread notifications.

## Endpoint

| Property | Value |
|---|---|
| Method | `DELETE` |
| Path | `/api/notifications/clear` |
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
curl -X DELETE "<API_BASE_URL>/api/notifications/clear" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Notifications cleared successfully.",
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
| `data.unread_count` | Always returned as `0` after clearing notifications. |

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

- The service deletes all notification records whose `user_id` matches the authenticated user; read state is not used as a filter.
- This operation is destructive and cannot be undone through this endpoint.
- If the user has no notifications, the endpoint still returns the success response.
- The response reports an unread count of zero after clearing.
- No notification IDs or filter parameters are accepted.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — notification clear route and protected route-group middleware
- `NotificationController::clear` — authenticated user forwarding and response wrapper
- `NotificationService::clearAll` — user-scoped deletion of all notifications
- `EnsureUserIsActive` — inactive-account response
- `bootstrap/app.php` — API authentication error formatting
