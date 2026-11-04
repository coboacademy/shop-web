# Mark a Notification as Read

Marks a specific notification belonging to the authenticated user as read.

## Endpoint

| Property | Value |
|---|---|
| Method | `PATCH` |
| Path | `/api/notifications/{notification}/read` |
| Authentication | Required; Sanctum bearer token, verified account, and active account |
| Response format | `application/json` |

The route is registered in `routes/api.php` in the protected app route group. It has no additional route-level permission middleware.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `notification` | integer | Yes | Notification ID to mark as read. Laravel resolves the parameter to an `AppNotification` model. |

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
curl -X PATCH "<API_BASE_URL>/api/notifications/18/read" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. The example notification ID is illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Notification marked as read.",
  "data": {
    "notification": {
      "id": 18,
      "title": "User status updated",
      "message": "Alex Example status changed to active.",
      "type": "info",
      "action_url": "/users",
      "data": {
        "user_id": 42,
        "status": "active"
      },
      "read": true,
      "read_at": "2026-10-31 10:00:00",
      "created_at": "2 hours ago",
      "created_at_raw": "2026-10-31 08:00:00"
    },
    "unread_count": 2
  }
}
```

`created_at` is a relative-time string and can vary based on when the response is requested.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary returned by the controller. |
| `data.notification.id` | Notification ID. |
| `data.notification.title` | Notification title. |
| `data.notification.message` | Notification message. |
| `data.notification.type` | Notification type. |
| `data.notification.action_url` | Optional related action URL. |
| `data.notification.data` | Optional notification-specific data object. |
| `data.notification.read` | Whether the notification has a non-null `read_at` value; `true` after a successful response. |
| `data.notification.read_at` | Read timestamp formatted as `Y-m-d H:i:s`. |
| `data.notification.created_at` | Relative creation time from `diffForHumans()`, or `null`. |
| `data.notification.created_at_raw` | Creation timestamp formatted as `Y-m-d H:i:s`, or `null`. |
| `data.unread_count` | Total unread notifications belonging to the authenticated user after the operation. |

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

Returned when the notification exists but belongs to another user, or when the authenticated account is suspended or blocked.

```json
{
  "status": "error",
  "message": "You cannot access this notification."
}
```

The inactive-account middleware uses this response:

```json
{
  "status": "error",
  "message": "Your account is not active."
}
```

### 404 Not Found

Returned when the notification ID does not match an existing notification.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

The route also requires a verified account. The exact response for an unverified account is determined by the framework's `verified` middleware.

## Behavior Notes

- The controller checks that the notification's `user_id` matches the authenticated user's ID before updating it.
- If the notification is already read, the service leaves its existing `read_at` timestamp unchanged; the operation is idempotent.
- After marking it read, the response includes the updated notification and the authenticated user's current unread count.
- The endpoint does not accept a request body.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — notification read route and protected route-group middleware
- `NotificationController::read` — ownership check, response wrapper, and unread count
- `NotificationService::markAsRead` — read timestamp update behavior
- `NotificationService::unreadCount` — user-scoped unread count
- `NotificationResource` — notification response fields
- `AppNotification` and notifications migration — model/read-state fields and integer ID
- `EnsureUserIsActive` — inactive-account response
- `bootstrap/app.php` — API authentication and model-not-found error formatting
