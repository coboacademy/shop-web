# Export Users to CSV

Downloads a CSV file containing the current user list, including status, verification state, roles, and creation timestamp.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/users/export` |
| Authentication | Required; Sanctum bearer token with `user.view` permission |
| Response format | `text/csv` |

The route is registered in `routes/api.php` inside the protected app route group and uses the `permission:user.view` middleware.

## Request Headers

```http
Accept: text/csv
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid bearer token for an authorized user.

## Query Parameters

| Parameter | Type | Required | Constraints / Default | Description |
|---|---|---|---|---|
| `search` | string | No | Optional free-text value | Filters by user name, email, or related values checked in the query builder. |
| `status` | string | No | Optional user status | Filters to a specific user status. |
| `email_verified` | string | No | Optional value used by `emailVerified()` | Filters by email verification state. |

## Example Request

```bash
curl -L -X GET "<API_BASE_URL>/api/users/export?status=active&email_verified=1" \
  -H "Accept: text/csv" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -o "users-export.csv"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. The response file is sent as a CSV attachment named `users-export-<timestamp>.csv`.

## Successful Response

**HTTP status:** `200 OK`

**Content-Type:** `text/csv`

Example CSV content:

```csv
ID,Name,Email,Status,Email Verification,Roles,Created At
1,Example Admin,admin@example.com,active,Verified,Admin,2026-10-31 09:00:00
2,Example User,user@example.com,active,Unverified,Customer,2026-10-31 10:00:00
```

The export includes the following columns, in order:

1. `ID`
2. `Name`
3. `Email`
4. `Status`
5. `Email Verification`
6. `Roles`
7. `Created At`

## Response Fields

Because this endpoint returns a CSV download rather than a JSON document, the response is not a nested JSON object. The file contains one header row followed by one row per exported user.

| Column | Description |
|---|---|
| `ID` | User ID. |
| `Name` | User name. |
| `Email` | User email address. |
| `Status` | Current user status value. |
| `Email Verification` | `Verified` or `Unverified`. |
| `Roles` | Comma-separated role names, or an empty string when none are assigned. |
| `Created At` | User creation timestamp in `Y-m-d H:i:s` format. |

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

Returned when the authenticated user does not have the `user.view` permission.

```json
{
  "status": "error",
  "message": "You do not have the required permission."
}
```

### 500 Internal Server Error

Returned when the export process fails unexpectedly. The controller catches no explicit errors around `downloadCsv`, so server exceptions are handled by the application exception middleware. In debug mode, the message may include the underlying exception message; otherwise it will be the generic server error message.

## Behavior Notes

- The export is driven by `UserQuery` filters; the same filters used by the user list endpoint are applied here before selecting records.
- `email_verified` is interpreted by the query builder, and the final CSV uses a human-readable `Verified` / `Unverified` label rather than the raw boolean flag.
- The controller uses `->roleNames()`-style formatting when available to join role names with commas.
- The response is a streamed CSV file created using `response()->streamDownload(...)` and not a JSON body.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — user export route and `user.view` middleware
- `UserController::export` — request filtering, CSV row mapping, and file download response
- `UserQuery` — search, status, and verification filtering
- `ExportService::downloadCsv` — CSV file generation and content type
- `bootstrap/app.php` — standard API error formatting for authentication and permission failures
