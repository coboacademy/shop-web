# List Notifications

Returns the authenticated user's notifications, newest first, with optional read-state filtering.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/notifications` |
| Authentication | Required; Sanctum bearer token, verified account, and active account |
| Response format | `application/json` |

The route is registered in `routes/api.php` in the protected app route group. It has no additional route-level permission middleware.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Query Parameters

| Parameter | Type | Required | Constraints / Default | Description |
|---|---|---|---|---|
| `read` | string | No | `read` or `unread` | Filters notifications by read state. Other values do not apply a read-state filter. |
| `per_page` | integer | No | Default `10`; maximum `50` | Number of notifications per page. Values below `1` use the default; values over `50` are capped at `50`. |
| `page` | integer | No | Default `1` | Page number selected by Laravel's paginator. |

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/notifications?read=unread&per_page=10&page=1" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All sample IDs, titles, data, and timestamps are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Notifications fetched successfully",
  "data": {
    "notifications": [
      {
        "id": 18,
        "title": "User status updated",
        "message": "Alex Example status changed to active.",
        "type": "info",
        "action_url": "/users",
        "data": {
          "user_id": 42,
          "status": "active"
        },
        "read": false,
        "read_at": null,
        "created_at": "1 hour ago",
        "created_at_raw": "2026-10-31 09:00:00"
      }
    ],
    "pagination": {
      "current_page": 1,
      "last_page": 1,
      "per_page": 10,
      "total": 1
    },
    "unread_count": 3
  }
}
```

`created_at` is a relative-time string and can vary based on when the response is requested. `created_at_raw` is formatted as `Y-m-d H:i:s`.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary returned by the controller. |
| `data.notifications` | Notifications for the current page matching the optional filter. |
| `data.notifications[].id` | Notification ID. |
| `data.notifications[].title` | Notification title. |
| `data.notifications[].message` | Notification message. |
| `data.notifications[].type` | Notification type, such as `info`, `success`, or `warning`. |
| `data.notifications[].action_url` | Optional related action URL. |
| `data.notifications[].data` | Optional notification-specific data object. |
| `data.notifications[].read` | Whether the notification has a non-null `read_at` value. |
| `data.notifications[].read_at` | Read timestamp formatted as `Y-m-d H:i:s`, or `null`. |
| `data.notifications[].created_at` | Relative creation time from `diffForHumans()`, or `null`. |
| `data.notifications[].created_at_raw` | Creation timestamp formatted as `Y-m-d H:i:s`, or `null`. |
| `data.pagination` | Pagination summary. |
| `data.pagination.current_page` | Current page number. |
| `data.pagination.last_page` | Total number of pages. |
| `data.pagination.per_page` | Effective page size after defaulting/capping. |
| `data.pagination.total` | Number of matching notifications. |
| `data.unread_count` | Total unread notifications belonging to the authenticated user, independent of the current filter and page. |

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

- Results are scoped to the authenticated user's `user_id`; callers cannot request another user's notifications.
- Notifications are ordered newest first.
- The `read` filter only applies when exactly `read` or `unread` is supplied. Other values result in an unfiltered list rather than a validation error.
- `unread_count` counts all unread notifications for the authenticated user, regardless of `read` filter or pagination.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — notifications list route and protected route-group middleware
- `NotificationController::index` — query parameters, pagination, and response wrapper
- `NotificationService::forUser` and `unreadCount` — user scoping, read filtering, ordering, and unread total
- `NotificationResource` — notification response fields
- `AppNotification` — `read` accessor and `data`/`read_at` casts
- `ApiResponse::perPage` — page-size default and maximum
- `EnsureUserIsActive` — inactive-account response
- `bootstrap/app.php` — API authentication error formatting
