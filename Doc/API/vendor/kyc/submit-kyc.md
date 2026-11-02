# Submit Vendor KYC

Submits vendor business and contact details for review. A user without an existing vendor profile gets a new pending vendor profile. A previously rejected profile is updated and returned to pending status.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
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
curl -X POST "<API_BASE_URL>/api/vendor/kyc" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "business_name": "Example Trading Co.",
    "phone": "+1-555-0100",
    "description": "Illustrative business description.",
    "website": "https://example.com",
    "country": "Example Country",
    "province": "Example Province",
    "city": "Example City",
    "address": "123 Example Street"
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example values and timestamps below are illustrative.

## Successful Response

**HTTP status:** `201 Created`

```json
{
  "status": "success",
  "message": "Vendor KYC submitted successfully.",
  "data": {
    "vendor": {
      "id": "00000000-0000-4000-8000-000000000007",
      "business_name": "Example Trading Co.",
      "slug": "example-trading-co",
      "email": "vendor@example.com",
      "phone": "+1-555-0100",
      "description": "Illustrative business description.",
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

The sample values are illustrative. The `created_at` field on a resubmitted rejected profile may reflect its original creation time.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the operation succeeded. |
| `message` | Response message. |
| `data.vendor.id` | Vendor profile identifier. |
| `data.vendor.business_name` | Submitted business name. |
| `data.vendor.slug` | Generated unique slug based on the business name. |
| `data.vendor.email` | Email address from the authenticated user's account. |
| `data.vendor.phone` | Submitted business phone. |
| `data.vendor.description` | Business description, or `null`. |
| `data.vendor.website` | Business website, or `null`. |
| `data.vendor.country` | Submitted country. |
| `data.vendor.province` | Submitted province or region. |
| `data.vendor.city` | Submitted city. |
| `data.vendor.address` | Submitted address. |
| `data.vendor.logo` | Vendor logo URL, or `null` if none exists. |
| `data.vendor.cover_image` | Cover image, or `null` if none exists. |
| `data.vendor.status` | Vendor review status; new and resubmitted rejected profiles use `pending`. |
| `data.vendor.verified_at` | Verification time; `null` while pending. |
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

If a vendor profile already exists and is not rejected, the service raises `Vendor KYC has already been submitted.` The controller does not catch that exception, so the API's generic exception handler returns `500`. In a non-debug environment, the response is:

```json
{
  "status": "error",
  "message": "Server error."
}
```

In debug mode, the response may contain the exception message.

## Behavior Notes

- The endpoint requires authentication but does not declare a vendor-role middleware; the request is associated with the authenticated user.
- With no existing vendor profile, the service creates a vendor profile with a generated unique slug and `pending` status.
- If an existing profile is `rejected`, the submitted KYC values update it, its status becomes `pending`, and `verified_at` is cleared. The controller still returns `201 Created`.
- If an existing profile is in any other status, submission fails with a runtime exception that currently becomes a generic `500` response.
- KYC persistence is wrapped in a database transaction.
- No endpoint-specific throttling is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated vendor KYC submission route
- `VendorProfileController::submitKyc` — request handling and `201 Created` response
- `SubmitKycRequest` — KYC field validation
- `VendorService::submitKyc` and `VendorService::updateKycRecord` — profile creation, rejected-profile resubmission, status, and slug behavior
- `VendorResource` — response fields
- `bootstrap/app.php` — API validation, authentication, and generic exception responses
