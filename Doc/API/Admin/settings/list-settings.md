# List Settings

Returns all application settings ordered by group and then key.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/settings` |
| Authentication | Required; Sanctum bearer token with `setting.view` permission |
| Response format | `application/json` |

The route is registered in `routes/api.php` and uses the `setting.view` permission middleware. It is also within the protected route group requiring authentication, a verified account, and an active account.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid token for a user with permission to view settings.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/settings" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example setting values and IDs are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Settings fetched successfully",
  "data": {
    "settings": [
      {
        "id": 1,
        "key": "app_name",
        "value": "Example Shop",
        "raw_value": "Example Shop",
        "type": "string",
        "group": "general",
        "updated_at": "2026-10-31 09:00:00"
      },
      {
        "id": 2,
        "key": "allow_registration",
        "value": true,
        "raw_value": "true",
        "type": "boolean",
        "group": "general",
        "updated_at": "2026-10-31 09:00:00"
      }
    ]
  }
}
```

The `value` field is cast according to the setting's `type`; `raw_value` contains the stored string value.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary returned by the controller. |
| `data.settings` | All settings, ordered by `group`, then `key`. |
| `data.settings[].id` | Setting ID. |
| `data.settings[].key` | Setting key. |
| `data.settings[].value` | Cast setting value: boolean for `boolean`, integer for `integer`, decoded JSON for `json`, and otherwise the stored string value. |
| `data.settings[].raw_value` | Uncast stored value string, or `null` if the database value is null. |
| `data.settings[].type` | Cast type, such as `string`, `boolean`, `integer`, or `json`. |
| `data.settings[].group` | Setting group. |
| `data.settings[].updated_at` | Last update timestamp formatted as `Y-m-d H:i:s`, or `null`. |

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

Returned when the authenticated user does not have the `setting.view` permission.

```json
{
  "status": "error",
  "message": "You do not have the required permission."
}
```

### 500 Internal Server Error

If fetching settings raises an exception, the controller logs it and returns HTTP 500. With debug disabled, the message is `Failed to fetch settings`; with debug enabled, the exception message may be returned.

## Behavior Notes

- The endpoint returns the full settings collection; there are no query filters or pagination.
- Rows are ordered by `group`, then `key`.
- The resource includes both the cast `value` and the stored `raw_value`.
- This controller method catches `Exception` errors from the query/resource-building path and logs the exception message.
- The route also requires a verified and active authenticated account. The active-user middleware returns `403` for accounts with `suspended` or `blocked` status; the exact unverified-account response is determined by the framework's `verified` middleware.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — settings index route and `setting.view` permission middleware
- `SettingsController::index` — query, ordering, response wrapper, and exception handling
- `SettingResource` — response fields and cast value
- `Setting` — cast behavior based on the `type` field
- Settings migration — stored columns, types, and group default
- `bootstrap/app.php` — API authentication and permission error formatting
