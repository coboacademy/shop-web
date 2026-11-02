# Export Audit Logs to CSV

Downloads audit logs as a CSV file. The export supports the same search and date filters as the audit log listing.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/audit-logs/export` |
| Authentication | Required; Sanctum bearer token with `audit.view` permission and a verified, active account |
| Response format | `text/csv` |

The route is registered in `routes/api.php` inside the protected app route group and uses the `permission:audit.view` middleware.

## Request Headers

```http
Accept: text/csv
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid bearer token for an authorized user.

## Query Parameters

All parameters are optional.

| Parameter | Type | Description |
|---|---|---|
| `search` | string | Case-insensitive partial match against the action, module, IP address, related user's name, or related user's email. |
| `module` | string | Exact match for the audit log module. |
| `action` | string | Exact match for the audit log action. |
| `date_from` | date string | Includes logs created on or after this date. |
| `date_to` | date string | Includes logs created on or before this date. |

Date filters use the log's `created_at` date. The endpoint does not paginate; all matching records are exported. No explicit query parameter validation is performed by this endpoint.

## Example Request

```bash
curl -L -X GET "<API_BASE_URL>/api/audit-logs/export?module=users&date_from=2026-10-01&date_to=2026-10-31" \
  -H "Accept: text/csv" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -o "audit-logs-export.csv"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. Query values and example data are illustrative. The downloaded attachment is named `audit-logs-export-<timestamp>.csv`, where the timestamp is generated when the request is handled.

## Successful Response

**HTTP status:** `200 OK`

**Content-Type:** `text/csv`

Example CSV content:

```csv
ID,Action,Module,User,Email,IP Address,Created At
105,user.updated,users,Example Admin,admin@example.com,192.0.2.10,2026-10-31 09:00:00
104,system.cleanup,system,System,,192.0.2.20,2026-10-30 18:30:00
```

Example values are illustrative and do not represent actual records. The file contains one header row followed by one row per matching audit log.

The columns are exported in this order:

1. `ID`
2. `Action`
3. `Module`
4. `User`
5. `Email`
6. `IP Address`
7. `Created At`

| Column | Description |
|---|---|
| `ID` | Audit log ID. |
| `Action` | Recorded action. |
| `Module` | Recorded module. |
| `User` | Related user's name, or `System` when the log has no related user. |
| `Email` | Related user's email, or an empty value when the log has no related user. |
| `IP Address` | IP address recorded for the log. |
| `Created At` | Creation timestamp formatted as `Y-m-d H:i:s`. |

Matching records are ordered by creation time, newest first. CSV values are escaped by PHP's `fputcsv`.

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

Returned when the authenticated user does not have the `audit.view` permission.

```json
{
  "status": "error",
  "message": "You do not have the required permission."
}
```

The active-account middleware also returns `403` for suspended or blocked accounts:

```json
{
  "status": "error",
  "message": "Your account is not active."
}
```

The route also requires a verified account. The exact response for an unverified account is determined by the framework's `verified` middleware.

## Behavior Notes

- Search, module, action, and date filters are applied before exporting.
- The export includes every matching record; there is no pagination or export-specific row limit in the controller.
- The response is a streamed CSV attachment, not a JSON response.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — export route, `audit.view` permission, and protected route-group middleware
- `AuditLogController::export` — filters, CSV columns, row mapping, and filename
- `AuditLogQuery` — search, exact module/action filters, date filters, and newest-first ordering
- `ExportService::downloadCsv` — streamed CSV response and content type
- `bootstrap/app.php` — API authentication and permission error formatting
- `EnsureUserIsActive` — inactive-account response
