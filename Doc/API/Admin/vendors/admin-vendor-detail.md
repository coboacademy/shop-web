# Get Admin Vendor Details

Returns the full profile for a specific vendor record, including the linked user, current status, store count, and associated stores.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/admin/vendors/{vendor}` |
| Authentication | Required; Sanctum bearer token with `vendors.view` permission |
| Response format | `application/json` |

The route is registered in `routes/api.php` under the authenticated admin route group and includes the `permission:vendors.view` middleware on this endpoint.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `vendor` | string | Yes | Vendor UUID to retrieve. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid admin bearer token.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/admin/vendors/00000000-0000-4000-8000-000000000019" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid admin token. All example values, IDs, names, and timestamps below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Vendor retrieved successfully.",
  "data": {
    "vendor": {
      "id": "00000000-0000-4000-8000-000000000019",
      "business_name": "Example Commerce Studio",
      "slug": "example-commerce-studio",
      "email": "vendor@example.com",
      "phone": "+1-555-0100",
      "description": "Illustrative vendor profile description.",
      "website": "https://example.com",
      "country": "Example Country",
      "province": "Example Province",
      "city": "Example City",
      "address": "123 Example Street",
      "status": "approved",
      "user": {
        "id": 11,
        "name": "Example Vendor",
        "email": "vendor.user@example.com"
      },
      "stores_count": 2,
      "stores": [
        {
          "id": "00000000-0000-4000-8000-000000000020",
          "name": "Example Downtown Store",
          "slug": "example-downtown-store",
          "is_active": true
        }
      ],
      "created_at": "2026-10-31T09:00:00.000000Z",
      "updated_at": "2026-10-31T09:00:00.000000Z"
    }
  }
}
```

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary returned by the controller. |
| `data.vendor.id` | Vendor UUID. |
| `data.vendor.business_name` | Vendor business name. |
| `data.vendor.slug` | Vendor slug, or `null` if no slug is set. |
| `data.vendor.email` | Vendor email address. |
| `data.vendor.phone` | Vendor phone number. |
| `data.vendor.description` | Vendor description. |
| `data.vendor.website` | Vendor website. |
| `data.vendor.country` | Vendor country. |
| `data.vendor.province` | Vendor province or region. |
| `data.vendor.city` | Vendor city. |
| `data.vendor.address` | Vendor address. |
| `data.vendor.status` | Current vendor lifecycle status, such as `pending`, `approved`, `rejected`, or `suspended`. |
| `data.vendor.user` | Vendor owner user record when loaded. |
| `data.vendor.user.id` | User identifier. |
| `data.vendor.user.name` | User display name. |
| `data.vendor.user.email` | User email address. |
| `data.vendor.stores_count` | Number of stores attached to the vendor. |
| `data.vendor.stores` | Store records attached to the vendor. |
| `data.vendor.stores[].id` | Store UUID. |
| `data.vendor.stores[].name` | Store name. |
| `data.vendor.stores[].slug` | Store slug. |
| `data.vendor.stores[].is_active` | Whether the store is active. |
| `data.vendor.created_at` | Vendor creation timestamp. |
| `data.vendor.updated_at` | Last vendor update timestamp. |

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

### 404 Not Found

Returned when the vendor UUID does not exist.

```json
{
  "status": "error",
  "message": "Vendor not found."
}
```

## Behavior Notes

- The controller resolves the vendor by ID and returns a single `VendorAdminResource` object.
- The service uses the repository's `findByIdOrFail` lookup, which loads the linked `user`, associated `stores`, and `stores_count`.
- Response values are derived from the `VendorAdminResource` serializer, which exposes the vendor's status, user summary, and active stores.
- The route is admin-scoped and is not intended for non-admin vendor accounts.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — admin vendor detail route and middleware
- `VendorController::show` — vendor lookup and response wrapper
- `AdminVendorService::getVendor` — service-level retrieval
- `AdminVendorRepository::findByIdOrFail` — vendor lookup and relation loading
- `VendorAdminResource` — returned vendor field structure
- `bootstrap/app.php` — standard API error handling for auth, permission, and missing-resource cases
