# Delete a Country

Deletes an existing country record.

## Endpoint

| Property | Value |
|---|---|
| Method | `DELETE` |
| Path | `/api/countries/{country}` |
| Authentication | Required; Sanctum bearer token with `country.delete` permission and a verified, active account |
| Response format | `application/json` |

This route is registered through `Route::apiResource` in `routes/api.php`, inside the protected app route group. The `destroy` action requires the `country.delete` permission.

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
curl -X DELETE "<API_BASE_URL>/api/countries/1" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. The example country ID is illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Country deleted successfully",
  "data": []
}
```

The controller returns a JSON response with no country object after deletion.

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

Returned when the authenticated user does not have the `country.delete` permission.

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

An uncaught error while deleting the record is formatted by the API exception handler. In debug mode the message may contain the underlying exception; otherwise it is `Server error.` The database migration does not specify how any foreign-key references to the country are handled, so deletion behavior when such references exist is not established by the inspected source.

## Behavior Notes

- The controller deletes the resolved country and returns a success message.
- No soft-delete behavior is defined on the `Country` model; successful deletion removes the record through Eloquent's normal delete operation.
- The endpoint does not accept a request body or query parameters.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — country delete route, `country.delete` permission, and protected route-group middleware
- `CountryController::destroy` — delete operation and response
- `Country` — model behavior
- `bootstrap/app.php` — API authentication, permission, model-not-found, and generic error formatting
- `EnsureUserIsActive` — inactive-account response
