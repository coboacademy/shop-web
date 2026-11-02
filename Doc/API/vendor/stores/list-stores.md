# List the Authenticated Vendor's Stores

Returns the stores belonging to the authenticated user's vendor profile, newest first.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/vendor/stores` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `page` | integer | No | Page number to retrieve. Pagination uses 15 stores per page. |
| `per_page` | integer | No | Not supported by this endpoint; the repository uses a fixed page size of 15. |

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/vendor/stores?page=1" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example IDs, names, values, and timestamps below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Stores retrieved successfully.",
  "data": {
    "stores": {
      "data": [
        {
          "id": "00000000-0000-4000-8000-000000000004",
          "name": "Example Downtown Store",
          "slug": "example-downtown-store",
          "email": "store@example.com",
          "phone": "+1-555-0100",
          "description": "Illustrative store description.",
          "logo": null,
          "logo_url": null,
          "cover_image": null,
          "cover_image_url": null,
          "country": "Example Country",
          "province": "Example Province",
          "city": "Example City",
          "address": "123 Example Street",
          "is_active": true,
          "created_at": "2026-10-31T01:34:00.000000Z",
          "updated_at": "2026-10-31T01:34:00.000000Z"
        }
      ],
      "links": {
        "first": "<API_BASE_URL>/api/vendor/stores?page=1",
        "last": "<API_BASE_URL>/api/vendor/stores?page=1",
        "prev": null,
        "next": null
      },
      "meta": {
        "current_page": 1,
        "from": 1,
        "last_page": 1,
        "links": [
          {
            "url": null,
            "label": "&laquo; Previous",
            "active": false
          },
          {
            "url": "<API_BASE_URL>/api/vendor/stores?page=1",
            "label": "1",
            "active": true
          },
          {
            "url": null,
            "label": "Next &raquo;",
            "active": false
          }
        ],
        "path": "<API_BASE_URL>/api/vendor/stores",
        "per_page": 15,
        "to": 1,
        "total": 1
      }
    }
  }
}
```

If the vendor has no stores, `data.stores.data` is an empty array. Pagination links and metadata depend on the result set and requested page.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.stores.data` | Stores for the current page. |
| `data.stores.data[].id` | Store UUID. |
| `data.stores.data[].name` | Store name. |
| `data.stores.data[].slug` | Store slug. |
| `data.stores.data[].email` | Store email, or `null`. |
| `data.stores.data[].phone` | Store phone, or `null`. |
| `data.stores.data[].description` | Store description, or `null`. |
| `data.stores.data[].logo` | Logo URL, or `null`. |
| `data.stores.data[].logo_url` | Logo URL, or `null`. |
| `data.stores.data[].cover_image` | Cover image path/value, or `null`. |
| `data.stores.data[].cover_image_url` | Cover image URL, or `null`. |
| `data.stores.data[].country` | Store country, or `null`. |
| `data.stores.data[].province` | Store province or region, or `null`. |
| `data.stores.data[].city` | Store city, or `null`. |
| `data.stores.data[].address` | Store address, or `null`. |
| `data.stores.data[].is_active` | Whether the store is active. |
| `data.stores.data[].created_at` | Store creation timestamp. |
| `data.stores.data[].updated_at` | Last store update timestamp. |
| `data.stores.links` | Pagination URLs. |
| `data.stores.meta` | Pagination information, including page, page size, and total. |

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
  "message": "Vendor profile not found."
}
```

## Behavior Notes

- The service obtains the vendor profile from the authenticated user and returns only stores with that vendor's ID.
- Stores are ordered newest first.
- The repository paginates results at a fixed 15 stores per page.
- The controller wraps a paginated resource collection under `data.stores`; the nested value contains `data`, `links`, and `meta`.
- No endpoint-specific throttling is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated vendor stores route
- `StoreController::index` — request handling and response wrapper
- `StoreService::getMyStores` — authenticated vendor profile lookup
- `StoreRepository::findByVendorId` — vendor filter, newest-first order, and fixed pagination
- `StoreResource` — store response fields
- `bootstrap/app.php` — API authentication and model-not-found error responses
