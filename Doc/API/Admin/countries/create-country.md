# Create a Country

Creates a country record.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/countries` |
| Authentication | Required; Sanctum bearer token with `country.create` permission and a verified, active account |
| Request format | `application/json` |
| Response format | `application/json` |

This route is registered through `Route::apiResource` in `routes/api.php`, inside the protected app route group. The `store` action requires the `country.create` permission.

## Request Headers

```http
Accept: application/json
Content-Type: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid bearer token for an authorized user.

## Request Body

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `country_name` | string | Yes | Must be a string. | Country name. |
| `country_code` | string or `null` | No | Must be a string when provided; nullable. | Country code. Although optional in controller validation, the database column is non-null and unique. |
| `capital` | string or `null` | No | Must be a string when provided; nullable. | Capital city. |
| `currency` | string or `null` | No | Must be a string when provided; nullable. | Currency. |
| `language` | string or `null` | No | Must be a string when provided; nullable. | Language. |

The controller does not define a maximum length or a uniqueness validation rule. The database enforces a unique constraint on `country_code`.

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/countries" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "country_name": "Exampleland",
    "country_code": "EX",
    "capital": "Sample City",
    "currency": "Example dollar",
    "language": "Example"
  }'
```

All example values are illustrative. Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token.

## Intended Successful Response

The controller is written to return **HTTP `201 Created`**:

```json
{
  "status": "success",
  "message": "Country created successfully",
  "data": {
    "country": {
      "id": 3,
      "country_code": "EX",
      "country_name": "Exampleland",
      "capital": "Sample City",
      "currency": "Example dollar",
      "language": "Example",
      "created_at": "2026-10-31 16:00",
      "updated_at": "2026-10-31 16:00"
    }
  }
}
```

The response fields and timestamps are illustrative. Nullable country fields may be `null`.

**Implementation issue:** `CountryController` imports `App\Http\Resources\Business\CountryResource`, but the resource found in the repository is declared as `App\Http\Resources\System\CountryResource`. The controller constructs this missing imported class after creating the record. As written, the request may create the country and then return `500` instead of the intended `201` response. The generic API error response is `Server error.` outside debug mode; in debug mode the exception message may be returned.

## Validation Errors

**HTTP status:** `422 Unprocessable Content`

Returned when `country_name` is missing or any provided field is not a string or `null` where nullable.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "country_name": [
      "The country name field is required."
    ]
  }
}
```

The `errors` object contains field-specific validation messages.

## Other Error Responses

### 401 Unauthenticated

Returned when the request does not include a valid authenticated session or bearer token.

```json
{
  "status": "error",
  "message": "Unauthenticated."
}
```

### 403 Forbidden

Returned when the authenticated user does not have the `country.create` permission.

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

### 500 Internal Server Error

An uncaught database or resource error is formatted by the API exception handler. In debug mode the message may contain the underlying exception; otherwise it is `Server error.` Potential causes include the resource import mismatch above, omitting `country_code` despite its non-null database column, or submitting a duplicate country code that violates the database unique constraint.

## Behavior Notes

- The controller validates the request, inserts the country, and then builds the response resource.
- `country_code` is nullable according to controller validation but required by the database schema; clients should provide a non-empty unique code.
- Duplicate `country_code` values are not caught by request validation and may cause a database error.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — country creation route, `country.create` permission, and protected route-group middleware
- `CountryController::store` — validation, model creation, and intended response
- `Country` — mass-assignable country attributes
- Countries migration — non-null unique country code and nullable country fields
- `CountryResource` — intended response fields and timestamp format
- `bootstrap/app.php` — API validation, authentication, permission, and generic error formatting
- `EnsureUserIsActive` — inactive-account response
