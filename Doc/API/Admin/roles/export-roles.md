# Export Roles to CSV

Downloads a CSV file containing roles and their assigned permission names.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/roles/export` |
| Authentication | Required; Sanctum bearer token with `role.view` permission |
| Response format | `text/csv` |

The route is registered in `routes/api.php` inside the protected app route group and uses the `permission:role.view` middleware.

## Request Headers

```http
Accept: text/csv
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid token for a user with permission to view roles.

## Query Parameters

| Parameter | Type | Required | Constraints / Default | Description |
|---|---|---|---|---|
| `search` | string | No | Optional free-text value | Filters roles by role name using a `LIKE` pattern. |
| `guard_name` | string | No | Optional guard name | Filters roles by authentication guard. |

## Example Request

```bash
curl -L -X GET "<API_BASE_URL>/api/roles/export?search=vendor&guard_name=web" \
  -H "Accept: text/csv" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -o "roles-export.csv"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. The response is sent as a CSV attachment named `roles-export-<timestamp>.csv`.

## Successful Response

**HTTP status:** `200 OK`

**Content-Type:** `text/csv`

Example CSV content:

```csv
ID,Name,Guard,Permissions Count,Permissions,Created At
3,Vendor,web,2,"product.view, order.view",2026-10-31 09:00:00
```

The export contains one header row followed by one row per matching role. The columns are returned in this order:

1. `ID`
2. `Name`
3. `Guard`
4. `Permissions Count`
5. `Permissions`
6. `Created At`

## Response Fields

| Column | Description |
|---|---|
| `ID` | Role ID. |
| `Name` | Role name. |
| `Guard` | Guard name associated with the role. |
| `Permissions Count` | Number of permissions assigned to the role. |
| `Permissions` | Permission names joined with comma-space separators. |
| `Created At` | Role creation timestamp formatted as `Y-m-d H:i:s`, or an empty CSV field if absent. |

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

Returned when the authenticated user does not have the `role.view` permission.

```json
{
  "status": "error",
  "message": "You do not have the required permission."
}
```

### 500 Internal Server Error

If an unexpected exception occurs while building or streaming the export, it is handled by the application exception middleware. With debug disabled, the response message is `Server error.`; with debug enabled, the exception message may be returned.

## Behavior Notes

- The export applies the same role-name search and guard filter used by the roles list.
- Matching roles are ordered newest first.
- The permission relation is loaded so the export can include its count and names.
- The endpoint returns a streamed CSV attachment, not a JSON response.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — role export route and `role.view` permission middleware
- `RoleController::export` — filters, row mapping, CSV headers, and filename pattern
- `RoleQuery` — role-name search, guard filter, and newest-first ordering
- `ExportService::downloadCsv` — streamed CSV response and content type
- `bootstrap/app.php` — API authentication and permission error formatting
