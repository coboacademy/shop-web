# List Countries

Returns all countries ordered alphabetically by country name.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/countries` |
| Authentication | Required; Sanctum bearer token with `country.view` permission and a verified, active account |
| Response format | `application/json` |

This route is registered through `Route::apiResource` in `routes/api.php`, inside the protected app route group. The `index` action requires the `country.view` permission.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid bearer token for an authorized user.

## Query Parameters

This endpoint does not define query parameters. It returns the full country list without pagination or filtering.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/countries" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Countries fetched successfully",
  "data": {
    "countries": [
      {
        "id": 1,
        "country_code": "CA",
        "country_name": "Canada",
        "capital": "Ottawa",
        "currency": "Canadian dollar",
        "language": "English and French",
        "created_at": "2026-10-31T08:00:00.000000Z",
        "updated_at": "2026-10-31T08:00:00.000000Z"
      },
      {
        "id": 2,
        "country_code": "JP",
        "country_name": "Japan",
        "capital": "Tokyo",
        "currency": "Japanese yen",
        "language": "Japanese",
        "created_at": "2026-10-31T08:00:00.000000Z",
        "updated_at": "2026-10-31T08:00:00.000000Z"
      }
    ]
  }
}
```

Example records and timestamps are illustrative. `capital`, `currency`, and `language` may be `null`. The controller returns Eloquent models directly rather than using the country resource; timestamps therefore use Laravel's model date serialization.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary. |
| `data.countries` | Array of country records, sorted by `country_name` ascending. |
| `data.countries[].id` | Country ID. |
| `data.countries[].country_code` | Unique country code. |
| `data.countries[].country_name` | Country name. |
| `data.countries[].capital` | Capital city, or `null`. |
| `data.countries[].currency` | Currency, or `null`. |
| `data.countries[].language` | Language, or `null`. |
| `data.countries[].created_at` | Creation timestamp serialized by Eloquent. |
| `data.countries[].updated_at` | Last-update timestamp serialized by Eloquent. |

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

Returned when the authenticated user does not have the `country.view` permission.

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

- The list is ordered by `country_name` ascending.
- The endpoint returns all country records; it does not paginate or filter.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — countries resource route, `country.view` permission, and protected route-group middleware
- `CountryController::index` — query ordering and response wrapper
- `Country` — country attributes
- Countries migration — stored country columns and nullable fields
- `bootstrap/app.php` — API authentication and permission error formatting
- `EnsureUserIsActive` — inactive-account response
