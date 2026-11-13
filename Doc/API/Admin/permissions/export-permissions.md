# Export Permissions to CSV

Downloads a CSV file containing permissions, including the module and action parsed from each permission name.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/permissions/export` |
| Authentication | Required; Sanctum bearer token with `permission.view` permission |
| Response format | `text/csv` |

The route is registered in `routes/api.php` in the protected app route group and uses the `permission:permission.view` middleware.

## Request Headers

```http
Accept: text/csv
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid token for a user with permission to view permissions.

## Query Parameters

| Parameter | Type | Required | Constraints / Default | Description |
|---|---|---|---|---|
| `search` | string | No | Optional free-text value | Searches permission names using a `LIKE` pattern. |
| `guard_name` | string | No | Optional guard name | Filters permissions to the specified authentication guard. |
| `module` | string | No | Optional module prefix | Filters permission names that begin with `<module>.`. |

## Example Request

```bash
curl -L -X GET "<API_BASE_URL>/api/permissions/export?module=user&guard_name=web" \
  -H "Accept: text/csv" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -o "permissions-export.csv"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. The response is sent as a CSV attachment named `permissions-export-<timestamp>.csv`.

## Successful Response

**HTTP status:** `200 OK`

**Content-Type:** `text/csv`

Example CSV content:

```csv
ID,Name,Module,Action,Guard,Created At
12,user.view,user,view,web,2026-10-31 09:00:00
```

The export contains one header row followed by one row per matching permission. Columns are returned in this order:

1. `ID`
2. `Name`
3. `Module`
4. `Action`
5. `Guard`
6. `Created At`

## Response Fields

| Column | Description |
|---|---|
| `ID` | Permission ID. |
| `Name` | Permission name as stored. |
| `Module` | First dot-separated segment of the permission name, or `general` if there is no segment. |
| `Action` | Second dot-separated segment of the permission name, or an empty value if absent. |
| `Guard` | Authentication guard associated with the permission. |
| `Created At` | Permission creation timestamp formatted as `Y-m-d H:i:s`, or an empty CSV field if absent. |

Permission names with more than two dot-separated segments use only the first two segments for the `Module` and `Action` columns.

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

Returned when the authenticated user does not have the `permission.view` permission.

```json
{
  "status": "error",
  "message": "You do not have the required permission."
}
```

### 500 Internal Server Error

If an unexpected exception occurs while building or streaming the export, it is handled by the application exception middleware. With debug disabled, the response message is `Server error.`; with debug enabled, the exception message may be returned.

## Behavior Notes

- The export applies the same search, guard, and module filters as the permissions list.
- Matching permissions are ordered alphabetically by name.
- The endpoint returns a streamed CSV attachment, not a JSON response.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — permission export route and `permission.view` middleware
- `PermissionController::export` — filtering, CSV row mapping, headers, and filename pattern
- `PermissionQuery` — search, guard and module filters, and name ordering
- `ExportService::downloadCsv` — streamed CSV response and content type
- `bootstrap/app.php` — API authentication and permission error formatting
