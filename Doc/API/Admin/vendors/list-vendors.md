# List Vendors for Admin Review

Returns a paginated list of vendor records that can be filtered and sorted by admin management criteria.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/admin/vendors` |
| Authentication | Required; Sanctum bearer token and admin permission `vendors.view` |
| Response format | `application/json` |

The route is registered in `routes/api.php` under the authenticated admin route group and includes the `permission:vendors.view` middleware on the `index` route.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid admin token.

## Query Parameters

| Parameter | Type | Required | Constraints / Default | Description |
|---|---|---|---|---|
| `search` | string | No | Free-text search | Matches vendor business name, vendor email, phone number, or linked user name/email. |
| `status` | string | No | One of `pending`, `approved`, `rejected`, `suspended` | Filters vendors by status. |
| `country` | string | No | Country name or value stored in the vendor record | Filters by vendor country. |
| `city` | string | No | City name or value stored in the vendor record | Filters by vendor city. |
| `sort_by` | string | No | One of `business_name`, `status`, `created_at`, `updated_at`; default `created_at` | Sort field. |
| `sort_direction` | string | No | `asc` or `desc`; default `desc` | Sort direction. |
| `per_page` | integer | No | 1 to 100; default `15` | Number of vendors per page. |

## Example Request

```bash
curl -X GET "<API_BASE_URL>/admin/vendors?status=approved&sort_by=created_at&sort_direction=desc&per_page=15" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid admin token. All example values, IDs, names, and timestamps below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Vendors retrieved successfully.",
  "data": {
    "vendors": [
      {
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
    ],
    "pagination": {
      "current_page": 1,
      "last_page": 1,
      "per_page": 15,
      "total": 1
    }
  }
}
```

The response is paginated and wraps the collection under `data.vendors` with `data.pagination` metadata.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message returned by the controller. |
| `data.vendors` | Paginated list of vendors. |
| `data.vendors[].id` | Vendor UUID. |
| `data.vendors[].business_name` | Vendor business name. |
| `data.vendors[].slug` | Vendor slug. |
| `data.vendors[].email` | Vendor email address. |
| `data.vendors[].phone` | Vendor contact phone. |
| `data.vendors[].description` | Vendor description, if present. |
| `data.vendors[].website` | Vendor website, if present. |
| `data.vendors[].country` | Vendor country. |
| `data.vendors[].province` | Vendor province or region. |
| `data.vendors[].city` | Vendor city. |
| `data.vendors[].address` | Vendor address. |
| `data.vendors[].status` | Current vendor status (`pending`, `approved`, `rejected`, or `suspended`). |
| `data.vendors[].user` | Related user record loaded for the vendor. |
| `data.vendors[].user.id` | User ID. |
| `data.vendors[].user.name` | User name. |
| `data.vendors[].user.email` | User email. |
| `data.vendors[].stores_count` | Count of stores attached to the vendor when present. |
| `data.vendors[].stores` | Stores attached to the vendor when the relation is loaded. |
| `data.vendors[].stores[].id` | Store ID. |
| `data.vendors[].stores[].name` | Store name. |
| `data.vendors[].stores[].slug` | Store slug. |
| `data.vendors[].stores[].is_active` | Whether the store is active. |
| `data.vendors[].created_at` | Vendor creation timestamp. |
| `data.vendors[].updated_at` | Last vendor update timestamp. |
| `data.pagination` | Pagination metadata. |
| `data.pagination.current_page` | Current page number. |
| `data.pagination.last_page` | Total page count. |
| `data.pagination.per_page` | Page size. |
| `data.pagination.total` | Total number of matching vendors. |

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

Returned when the authenticated user does not have the required `vendors.view` permission.

```json
{
  "status": "error",
  "message": "Forbidden."
}
```

## Behavior Notes

- The controller builds a filter array from the request and passes it to the admin vendor service.
- Search matches business name, vendor email, phone, or the related user name/email.
- Supported sort columns are `business_name`, `status`, `created_at`, and `updated_at`.
- Invalid sort columns or sort directions fall back to `created_at` and `desc`.
- Pagination defaults to 15 items per page and clamps values to the range of 1 to 100.
- The response includes the related user and store summaries, plus the `stores_count` value when available.
- No endpoint-specific throttling or additional rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — admin vendor list route and middleware
- `VendorController::index` — filter collection and response wrapper
- `AdminVendorService::getVendors` — service passthrough to the repository
- `AdminVendorRepository::getAll` — search, status, country, city, sorting, and pagination logic
- `VendorAdminResource` — field shape returned to clients
- `bootstrap/app.php` — standard API error responses for unauthenticated and forbidden requests
