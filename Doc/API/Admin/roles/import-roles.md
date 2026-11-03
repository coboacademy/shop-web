# Import Roles from CSV

Creates or updates roles from an uploaded CSV file and optionally synchronizes each role's permissions.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/roles/import` |
| Authentication | Required; Sanctum bearer token with `role.create` permission |
| Response format | `application/json` |

The route is registered in `routes/api.php` in the protected app route group and uses the `permission:role.create` middleware. The request must be sent as `multipart/form-data`.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
Content-Type: multipart/form-data
```

Replace `<YOUR_TOKEN>` with a valid token for a user authorized to create roles. Let the HTTP client set the multipart boundary for `Content-Type`.

## Request Body

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `file` | file | Yes | CSV or TXT file; maximum 2048 KB (2 MB) | CSV document containing role data. |

The first row must contain a `name` column. Header names are trimmed and compared case-insensitively. The following columns are also recognized:

| CSV column | Required | Description |
|---|---|---|
| `name` | Yes | Role name. An empty value causes that row to be skipped. |
| `guard_name` | No | Role guard. Defaults to `web` when absent or empty. |
| `permissions` | No | Comma-separated permission names. Existing permissions are synchronized to the role; missing permissions are reported in `errors`. |

Other columns are ignored.

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/roles/import" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -F "file=@roles.csv;type=text/csv"
```

Example `roles.csv` content:

```csv
name,guard_name,permissions
Vendor,web,"product.view,order.view"
Support,web,"user.view"
```

All example role and permission names are illustrative. Replace `<API_BASE_URL>` and `<YOUR_TOKEN>` with your API base URL and a valid token.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Roles imported successfully",
  "data": {
    "result": {
      "created": 1,
      "updated": 1,
      "skipped": 1,
      "errors": [
        "Row 4: role name is empty.",
        "Row 3: missing permissions: order.view."
      ]
    }
  }
}
```

Rows with missing permissions are still processed; available permissions are synchronized, while missing names are listed in `errors`. An empty file or a file without a `name` header is returned as an import result with errors rather than as a request-validation failure.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary returned by the controller. |
| `data.result.created` | Number of new roles created. |
| `data.result.updated` | Number of existing roles updated. |
| `data.result.skipped` | Number of rows skipped, such as rows with an empty role name. |
| `data.result.errors` | Import warnings/errors, including missing permissions or invalid rows. |

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

Returned when the authenticated user does not have the `role.create` permission.

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

- Role identity is determined by the combination of role `name` and `guard_name`; matching roles have their guard updated, while new combinations create a role.
- A missing or empty `guard_name` value defaults to `web`.
- Permission names are split on commas, trimmed, deduplicated, and matched by name. Existing permissions are synchronized to the role; missing names are recorded in the result errors.
- When a row has a non-empty permission list but none of those permissions exist, the role is not synchronized to an empty list; only the missing-permission error is added.
- Rows are processed in a database transaction. After import, the permission cache is cleared.
- The controller records a `role.imported` audit event and notifies administrators with the import counts and errors.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — role import route and `role.create` permission middleware
- `ImportRoleRequest` — upload validation and custom messages
- `RoleController::import` — import invocation, audit event, notification, and response wrapper
- `RoleService::importCsv` — CSV header handling, role create/update behavior, permissions, and result counts
- `bootstrap/app.php` — API authentication and validation error formatting
