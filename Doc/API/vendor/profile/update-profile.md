# Update Vendor Profile

Updates the authenticated user's vendor profile.

## Endpoint

| Property | Value |
|---|---|
| Method | `PUT` |
| Path | `/api/vendor/profile` |
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
| `business_name` | string | Yes | Minimum 3 and maximum 100 characters. |
| `email` | string | Yes | Must be a valid email address; maximum 255 characters. The request does not validate uniqueness. |
| `phone` | string or `null` | No | Maximum 30 characters. |
| `description` | string or `null` | No | Maximum 1000 characters. |
| `website` | URL string or `null` | No | Must be a valid URL; maximum 255 characters. |
| `country` | string or `null` | No | Maximum 100 characters. |
| `province` | string or `null` | No | Maximum 100 characters. |
| `city` | string or `null` | No | Maximum 100 characters. |
| `address` | string or `null` | No | Maximum 255 characters. |

Although `business_name` and `email` are required, the other listed fields are optional and may be submitted as `null`.

## Example Request

```bash
curl -X PUT "<API_BASE_URL>/api/vendor/profile" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "business_name": "Example Trading Co.",
    "email": "vendor@example.com",
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
  "message": "Vendor updated successfully.",
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

The values are illustrative. The `status` and `verified_at` fields reflect the profile's stored values; this profile update operation does not explicitly change them.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the operation succeeded. |
| `message` | Response message. |
| `data.vendor.id` | Vendor profile identifier. |
| `data.vendor.business_name` | Updated business name. |
| `data.vendor.slug` | Existing slug, or a generated unique slug if the business name changed. |
| `data.vendor.email` | Updated vendor email address. |
| `data.vendor.phone` | Vendor phone, or `null`. |
| `data.vendor.description` | Business description, or `null`. |
| `data.vendor.website` | Business website, or `null`. |
| `data.vendor.country` | Country, or `null`. |
| `data.vendor.province` | Province or region, or `null`. |
| `data.vendor.city` | City, or `null`. |
| `data.vendor.address` | Address, or `null`. |
| `data.vendor.logo` | Logo URL, or `null` if none exists. |
| `data.vendor.cover_image` | Cover image, or `null` if none exists. |
| `data.vendor.status` | Current vendor review status. |
| `data.vendor.verified_at` | Verification timestamp, or `null` if not verified. |
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

Returned when a request field fails validation, such as a missing business name or invalid email address.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "email": [
      "The email field must be a valid email address."
    ]
  }
}
```

## Behavior Notes

- The profile lookup and update are scoped to the authenticated user's ID.
- If the business name changes, the service generates a new unique slug.
- This endpoint does not explicitly alter the vendor's approval status or `verified_at`.
- Email uniqueness is not checked by the request rules or enforced by the vendor table schema.
- The update is wrapped in a database transaction.
- No endpoint-specific throttling is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated vendor profile update route
- `VendorProfileController::update` — request handling and response wrapper
- `UpdateVendorRequest` — profile update validation rules
- `VendorService::updateProfile` — user-scoped lookup, slug update, and transaction
- `VendorRepository::findByUserIdOrFail` and `VendorRepository::update` — profile retrieval and persistence
- `VendorResource` — response fields
- `bootstrap/app.php` — API validation, authentication, and model-not-found error responses
