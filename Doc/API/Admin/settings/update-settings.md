# Update Application Settings

Updates the supported application settings and returns the complete settings collection.

## Endpoint

| Property | Value |
|---|---|
| Method | `PUT` |
| Path | `/api/settings` |
| Authentication | Required; Sanctum bearer token with `setting.update` permission |
| Response format | `application/json` |

The route is registered in `routes/api.php` and uses the `setting.update` permission middleware. It is also within the protected route group requiring authentication, a verified account, and an active account.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json
```

Replace `<YOUR_TOKEN>` with a valid token for a user authorized to update settings.

## Request Body

```json
{
  "app_name": "Example Shop",
  "support_email": "support@example.com",
  "allow_registration": true,
  "maintenance_mode": false,
  "default_user_role": "Customer"
}
```

All example values are illustrative.

### Request Fields

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `app_name` | string | Yes | Maximum 100 characters | Application display name. |
| `support_email` | string | Yes | Valid email address, maximum 255 characters | Support contact email. |
| `allow_registration` | boolean | Yes | Boolean value | Whether user registration is allowed. |
| `maintenance_mode` | boolean | Yes | Boolean value | Whether maintenance mode is enabled. |
| `default_user_role` | string | Yes | Must match an existing role name | Default role assigned to new users. |

All five fields are required for every request.

## Example Request

```bash
curl -X PUT "<API_BASE_URL>/api/settings" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "app_name": "Example Shop",
    "support_email": "support@example.com",
    "allow_registration": true,
    "maintenance_mode": false,
    "default_user_role": "Customer"
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example values are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Settings updated successfully",
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

The response contains the full settings collection, not only the values updated by the request. Settings are ordered by `group`, then `key`.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary returned by the controller. |
| `data.settings` | All settings after the update. |
| `data.settings[].id` | Setting ID. |
| `data.settings[].key` | Setting key. |
| `data.settings[].value` | Cast setting value: boolean for `boolean`, integer for `integer`, decoded JSON for `json`, and otherwise the stored string value. |
| `data.settings[].raw_value` | Uncast stored value string. |
| `data.settings[].type` | Setting's cast type. |
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

Returned when the authenticated user does not have the `setting.update` permission.

```json
{
  "status": "error",
  "message": "You do not have the required permission."
}
```

### 422 Unprocessable Entity

Returned when any required setting is missing or invalid, including an invalid support email or a `default_user_role` that does not exist.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "default_user_role": [
      "Selected default role does not exist."
    ]
  }
}
```

## Behavior Notes

- The service captures old and new values for all settings for the audit record.
- Only keys matching existing setting records are updated; validated request keys without a matching setting row are silently ignored.
- Boolean values are stored as the strings `"true"` or `"false"`; other values are cast to strings.
- The controller records a `settings.updated` audit event and returns the full settings list ordered by group and key.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — settings update route and `setting.update` permission middleware
- `UpdateSettingsRequest` — authorization and required fields/validation
- `SettingsController::update` — service invocation, audit event, and response wrapper
- `SettingsService::updateMany` — persistence, value serialization, and old/new values
- `SettingResource` — returned setting fields and cast values
- `bootstrap/app.php` — API authentication and validation error formatting
