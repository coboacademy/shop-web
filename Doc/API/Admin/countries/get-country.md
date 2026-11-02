# Get a Country

Returns the details of one country.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/countries/{country}` |
| Authentication | Required; Sanctum bearer token with `country.view` permission and a verified, active account |
| Response format | `application/json` |

This route is registered through `Route::apiResource` in `routes/api.php`, inside the protected app route group. The `show` action requires the `country.view` permission.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `country` | integer | Yes | Country ID. Laravel resolves the value to a `Country` model using its primary key. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid bearer token for an authorized user.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/countries/1" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. The example country ID and response values are illustrative.

## Intended Successful Response

The controller is written to return **HTTP `200 OK`** with the following response shape:

```json
{
  "status": "success",
  "message": "Country fetched successfully",
  "data": {
    "country": {
      "id": 1,
      "country_code": "CA",
      "country_name": "Canada",
      "capital": "Ottawa",
      "currency": "Canadian dollar",
      "language": "English and French",
      "created_at": "2026-10-31 08:00",
      "updated_at": "2026-10-31 08:00"
    }
  }
}
```

The example record and timestamps are illustrative. `capital`, `currency`, and `language` may be `null`.

**Implementation issue:** `CountryController` imports `App\Http\Resources\Business\CountryResource`, but the resource found in the repository is declared as `App\Http\Resources\System\CountryResource`. Because the controller instantiates the imported class for this response, the successful response above may not be reachable until the resource import/namespace is corrected. The API exception handler returns `500` for an uncaught error; in debug mode its message may expose the underlying exception, otherwise the message is `Server error.`.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary. |
| `data.country.id` | Country ID. |
| `data.country.country_code` | Unique country code. |
| `data.country.country_name` | Country name. |
| `data.country.capital` | Capital city, or `null`. |
| `data.country.currency` | Currency, or `null`. |
| `data.country.language` | Language, or `null`. |
| `data.country.created_at` | Creation timestamp formatted as `Y-m-d H:i`. |
| `data.country.updated_at` | Last-update timestamp formatted as `Y-m-d H:i`. |

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

### 404 Not Found

Returned when the country ID does not match an existing country.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

### 500 Internal Server Error

An uncaught error in the controller is formatted by the API exception handler. In debug mode the message may contain the underlying exception; otherwise it is `Server error.` The resource import mismatch noted above is a known reason this endpoint may currently return `500`.

## Behavior Notes

- The endpoint returns one country and does not accept query parameters or a request body.
- The controller uses implicit model binding to resolve the country ID.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — country detail route, `country.view` permission, and protected route-group middleware
- `CountryController::show` — model handling and response wrapper
- `CountryResource` — intended country response fields and timestamp format
- Countries migration — country columns and nullable fields
- `bootstrap/app.php` — API authentication, permission, model-not-found, and generic error formatting
- `EnsureUserIsActive` — inactive-account response
