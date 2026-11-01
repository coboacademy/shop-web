# Get Vendor Statistics

Returns the total number of vendor records and counts grouped by vendor status.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/admin/vendors/statistics` |
| Authentication | Required; Sanctum bearer token with `vendors.view` permission |
| Response format | `application/json` |

The route is registered in `routes/api.php` under the authenticated admin route group and is protected by the `permission:vendors.view` middleware.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid admin bearer token.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/admin/vendors/statistics" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid admin token. All example counts are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Vendor statistics retrieved successfully.",
  "data": {
    "statistics": {
      "total": 42,
      "pending": 8,
      "approved": 27,
      "rejected": 4,
      "suspended": 3
    }
  }
}
```

## Response Fields

| Field | Type | Description |
|---|---|---|
| `status` | string | Indicates whether the request succeeded. |
| `message` | string | Response summary returned by the controller. |
| `data.statistics.total` | integer | Total number of vendor records. |
| `data.statistics.pending` | integer | Number of vendors with `pending` status. |
| `data.statistics.approved` | integer | Number of vendors with `approved` status. |
| `data.statistics.rejected` | integer | Number of vendors with `rejected` status. |
| `data.statistics.suspended` | integer | Number of vendors with `suspended` status. |

Counts for a status with no matching vendors are returned as `0`.

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

Returned when the authenticated user does not have the `vendors.view` permission.

```json
{
  "status": "error",
  "message": "Forbidden."
}
```

## Behavior Notes

- The endpoint runs aggregate queries across vendor records; it does not accept filters or pagination parameters.
- The response always includes the five keys `total`, `pending`, `approved`, `rejected`, and `suspended`.
- Status group counts are cast to integers, and missing status groups default to zero.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — admin vendor statistics route and permission middleware
- `VendorController::statistics` — request handling and response wrapper
- `AdminVendorService::getStatistics` — service delegation
- `AdminVendorRepository::getStatistics` — aggregate counts grouped by status
- `bootstrap/app.php` — standard API error formatting for authentication and permission failures
