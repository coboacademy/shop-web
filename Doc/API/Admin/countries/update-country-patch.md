# Update a Country (PATCH)

Partially updates an existing country record. Only supplied fields are updated; omitted fields remain unchanged.

## Endpoint

| Property | Value |
|---|---|
| Method | `PATCH` |
| Path | `/api/countries/{country}` |
| Authentication | Required; Sanctum bearer token with `country.update` permission and a verified, active account |
| Request format | `application/json` |
| Response format | `application/json` |

This route is registered through `Route::apiResource` in `routes/api.php`, inside the protected app route group. The `update` action requires the `country.update` permission. `PUT` is also registered for this action.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `country` | integer | Yes | Country ID. Laravel resolves the value to a `Country` model using its primary key. |

## Request Headers

```http
Accept: application/json
Content-Type: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid bearer token for an authorized user.

## Request Body

All body fields are optional. If provided, they must satisfy the validation rules below.

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `country_name` | string | No | Must be a string when provided. | Country name. |
| `country_code` | string or `null` | No | Must be a string when non-null. | Country code. The database requires a non-null unique value. |
| `capital` | string or `null` | No | Must be a string when non-null. | Capital city. |
| `currency` | string or `null` | No | Must be a string when non-null. | Currency. |
| `language` | string or `null` | No | Must be a string when non-null. | Language. |

No maximum lengths or unique-code validation are defined by the controller. An empty JSON object passes validation and leaves the record unchanged.

## Example Request

```bash
curl -X PATCH "<API_BASE_URL>/api/countries/1" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "capital": "Sample City"
  }'
```

All example values are illustrative. Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token.

## Intended Successful Response

The controller is written to return **HTTP `200 OK`**:

```json
{
  "status": "success",
  "message": "Country updated successfully",
  "data": {
    "country": {
      "id": 1,
      "country_code": "EX",
      "country_name": "Exampleland",
      "capital": "Sample City",
      "currency": "Example dollar",
      "language": "Example",
      "created_at": "2026-10-31 16:00",
      "updated_at": "2026-10-31 16:30"
    }
  }
}
```

The record values and timestamps are illustrative. `capital`, `currency`, and `language` may be `null`.

**Implementation issue:** `CountryController` imports `App\Http\Resources\Business\CountryResource`, but the resource found in the repository is declared as `App\Http\Resources\System\CountryResource`. The controller updates the database record before constructing the response resource. As written, the update may succeed but the request may then return `500` instead of the intended `200` response. The generic API error response is `Server error.` outside debug mode; in debug mode the exception message may be returned.

## Validation Errors

**HTTP status:** `422 Unprocessable Content`

Returned when a provided field is not a string or `null` where nullable.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "capital": [
      "The capital field must be a string."
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

Returned when the authenticated user does not have the `country.update` permission.

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

An uncaught database or resource error is formatted by the API exception handler. In debug mode the message may contain the underlying exception; otherwise it is `Server error.` Potential causes include the resource import mismatch above or submitting a duplicate country code that violates the database unique constraint.

## Behavior Notes

- Only submitted fields are applied; omitted fields remain unchanged.
- `country_code` is nullable according to controller validation, but the database column is non-null and unique. Clients should submit a unique non-null code when updating that field.
- Duplicate `country_code` values are not caught by request validation and may cause a database error.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — country update route, `country.update` permission, and protected route-group middleware
- `CountryController::update` — validation, update operation, and intended response
- `Country` — mass-assignable country attributes
- Countries migration — non-null unique country code and nullable country fields
- `CountryResource` — intended response fields and timestamp format
- `bootstrap/app.php` — API validation, authentication, permission, model-not-found, and generic error formatting
- `EnsureUserIsActive` — inactive-account response
