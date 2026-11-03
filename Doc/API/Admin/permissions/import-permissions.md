# Import Permissions from CSV

Creates or updates permissions from an uploaded CSV file.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/permissions/import` |
| Authentication | Required; Sanctum bearer token with `permission.create` permission |
| Response format | `application/json` |

The route is registered in `routes/api.php` in the protected app route group and uses the `permission:permission.create` middleware. The request must be sent as `multipart/form-data`.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
Content-Type: multipart/form-data
```

Replace `<YOUR_TOKEN>` with a valid token for a user authorized to create permissions. Let the HTTP client set the multipart boundary for `Content-Type`.

## Request Body

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `file` | file | Yes | CSV or TXT file; maximum 2048 KB (2 MB) | CSV document containing permissions. |

The first row must contain a `name` column. Header names are trimmed and compared case-insensitively. The optional `guard_name` column defaults to `web` when absent or empty.

| CSV column | Required | Description |
|---|---|---|
| `name` | Yes | Permission name, expected in `module.action` format. |
| `guard_name` | No | Authentication guard for the permission. Defaults to `web`. |

Other columns are ignored.

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/permissions/import" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -F "file=@permissions.csv;type=text/csv"
```

Example `permissions.csv` content:

```csv
name,guard_name
product.view,web
order.view,web
```

All example permission names are illustrative. Replace `<API_BASE_URL>` and `<YOUR_TOKEN>` with your API base URL and a valid token.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Permissions imported successfully",
  "data": {
    "result": {
      "created": 1,
      "updated": 1,
      "skipped": 1,
      "errors": [
        "Row 3: permission name should use module.action format."
      ]
    }
  }
}
```

Rows that do not meet import rules are counted as skipped and described in `errors`; they do not prevent the rest of the CSV from being processed.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary returned by the controller. |
| `data.result.created` | Number of new permissions created. |
| `data.result.updated` | Number of existing permissions updated. |
| `data.result.skipped` | Number of rows skipped, including empty or malformed names and protected permissions. |
| `data.result.errors` | Import warnings/errors, with CSV row numbers where applicable. |

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

Returned when the authenticated user does not have the `permission.create` permission.

```json
{
  "status": "error",
  "message": "You do not have the required permission."
}
```

### 422 Unprocessable Entity

Returned when `file` is missing, is not a valid uploaded file, is not CSV/TXT, or exceeds 2 MB. Example:

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "file": [
      "CSV file is required."
    ]
  }
}
```

## Behavior Notes

- Permission names without a `.` are skipped with a `module.action` format error.
- Permissions are matched by `name`. Existing non-protected permissions have their guard updated; new names create permissions.
- Permissions listed in `rbac.protected_permissions` are skipped rather than updated.
- Missing or empty `guard_name` values default to `web`.
- An empty file or a file without a `name` header is returned as an import result with errors rather than as a request-validation failure.
- Rows are processed inside a database transaction. After import, the service clears the permission cache and synchronizes all permissions to the configured Super Admin role.
- The controller records a `permission.imported` audit event and notifies administrators with the result counts and errors.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — permission import route and `permission.create` middleware
- `ImportPermissionRequest` — upload validation and custom messages
- `PermissionController::import` — import invocation, audit event, notification, and response wrapper
- `PermissionService::importCsv` — CSV parsing, permission create/update behavior, protected permission handling, and result counts
- `bootstrap/app.php` — API authentication and validation error formatting
