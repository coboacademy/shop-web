# Get the Authenticated User's Vendor Profile

Returns the vendor profile associated with the authenticated user.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/vendor/profile` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/vendor/profile" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example IDs, names, and timestamps below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Vendor profile retrieved successfully",
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

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.vendor.id` | Vendor profile identifier. |
| `data.vendor.business_name` | Registered business name. |
| `data.vendor.slug` | Vendor profile slug. |
| `data.vendor.email` | Vendor email address. |
| `data.vendor.phone` | Vendor contact phone. |
| `data.vendor.description` | Business description, or `null`. |
| `data.vendor.website` | Business website, or `null`. |
| `data.vendor.country` | Vendor country. |
| `data.vendor.province` | Vendor province or region. |
| `data.vendor.city` | Vendor city. |
| `data.vendor.address` | Vendor address. |
| `data.vendor.logo` | Logo URL, or `null` if none exists. |
| `data.vendor.cover_image` | Cover image, or `null` if none exists. |
| `data.vendor.status` | Vendor review status. |
| `data.vendor.verified_at` | Vendor verification timestamp, or `null` if not verified. |
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

## Behavior Notes

- The profile lookup is scoped to the authenticated user's ID.
- This route requires authentication but does not declare a vendor-role middleware. A user without a vendor profile receives `404`.
- The response contains only the fields defined by `VendorResource`; it does not include nested stores or products.
- The endpoint does not modify the profile and does not define endpoint-specific throttling.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated vendor profile route
- `VendorProfileController::profile` — user ID lookup and response wrapper
- `VendorService::profile` — profile retrieval
- `VendorRepository::findByUserIdOrFail` — user-scoped lookup
- `VendorResource` — response fields
- `bootstrap/app.php` — API authentication and model-not-found error responses
