# Update Vendor KYC

Updates the authenticated user's vendor KYC details. The profile returns to `pending` review status after an update.

## Endpoint

| Property | Value |
|---|---|
| Method | `PUT` |
| Path | `/api/vendor/kyc` |
| Authentication | Required; Sanctum bearer token |
| Content-Type | `application/json` |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Request Headers

```http
Accept: application/json
Content-Type: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Request Body

| Field | Type | Required | Validation Rules |
|---|---|---|---|
| `business_name` | string | Yes | Minimum 3 and maximum 150 characters. |
| `phone` | string | Yes | Maximum 30 characters. |
| `description` | string or `null` | No | Maximum 1000 characters. |
| `website` | URL string or `null` | No | Must be a valid URL; maximum 255 characters. |
| `country` | string | Yes | Maximum 100 characters. |
| `province` | string | Yes | Maximum 100 characters. |
| `city` | string | Yes | Maximum 100 characters. |
| `address` | string | Yes | Maximum 255 characters. |

The vendor email is taken from the authenticated user's account and is not submitted in this request.

## Example Request

```bash
curl -X PUT "<API_BASE_URL>/api/vendor/kyc" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "business_name": "Example Trading Co.",
    "phone": "+1-555-0100",
    "description": "Updated business description.",
    "website": "https://example.com",
    "country": "Example Country",
    "province": "Example Province",
    "city": "Example City",
    "address": "123 Example Street"
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example values and timestamps below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Vendor KYC updated successfully.",
  "data": {
    "vendor": {
      "id": "00000000-0000-4000-8000-000000000007",
      "business_name": "Example Trading Co.",
      "slug": "example-trading-co",
      "email": "vendor@example.com",
      "phone": "+1-555-0100",
      "description": "Updated business description.",
      "website": "https://example.com",
      "country": "Example Country",
      "province": "Example Province",
      "city": "Example City",
      "address": "123 Example Street",
      "logo": null,
      "cover_image": null,
      "status": "pending",
      "verified_at": null,
      "created_at": "2026-10-31T01:30:00.000000Z"
    }
  }
}
```

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the operation succeeded. |
| `message` | Response message. |
| `data.vendor.id` | Vendor profile identifier. |
| `data.vendor.business_name` | Updated business name. |
| `data.vendor.slug` | Existing slug, or a newly generated unique slug if the business name changed. |
| `data.vendor.email` | Email address from the authenticated user's account. |
| `data.vendor.phone` | Updated business phone. |
| `data.vendor.description` | Updated description, or `null`. |
| `data.vendor.website` | Updated website, or `null`. |
| `data.vendor.country` | Updated country. |
| `data.vendor.province` | Updated province or region. |
| `data.vendor.city` | Updated city. |
| `data.vendor.address` | Updated address. |
| `data.vendor.logo` | Vendor logo URL, or `null` if none exists. |
| `data.vendor.cover_image` | Cover image, or `null` if none exists. |
| `data.vendor.status` | Vendor status; updated profiles are set to `pending`. |
| `data.vendor.verified_at` | Verification time; set to `null` by this update. |
| `data.vendor.created_at` | Vendor profile creation timestamp. |

## Error Responses

### 401 Unauthenticated

Returned when the request does not include a valid authenticated session or bearer token.

```json
{
  "status": "error",
  "message": "Unauthenticated."
}
```

### 404 Not Found

Returned when the authenticated user does not have a vendor profile.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

### 422 Unprocessable Content

Returned when a request field fails validation.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "business_name": [
      "The business name field is required."
    ]
  }
}
```

### 500 Internal Server Error

Approved vendor profiles cannot be updated through this endpoint. The service raises `Approved vendor KYC cannot be updated.` and the controller does not catch that exception. In a non-debug environment, the generic API error response is:

```json
{
  "status": "error",
  "message": "Server error."
}
```

In debug mode, the response may contain the exception message.

## Behavior Notes

- The endpoint requires authentication but does not declare a vendor-role middleware; the vendor profile is obtained from the authenticated user's account.
- A vendor profile must already exist. This endpoint does not create one.
- Profiles with `approved` status cannot be updated; other statuses proceed through the update operation.
- On update, KYC fields are replaced, status is reset to `pending`, and `verified_at` is cleared.
- If `business_name` changes, the service generates a new unique slug.
- The update is wrapped in a database transaction.
- No endpoint-specific throttling is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated vendor KYC update route
- `VendorProfileController::updateKyc` — request handling and `200 OK` response
- `SubmitKycRequest` — KYC field validation
- `VendorService::updateKyc` and `VendorService::updateKycRecord` — profile existence, approved-status restriction, pending reset, slug update, and transaction
- `VendorResource` — response fields
- `bootstrap/app.php` — API validation, authentication, model-not-found, and generic exception responses
