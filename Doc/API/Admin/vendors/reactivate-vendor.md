# Reactivate a Vendor

Reactivates a suspended vendor account by returning its status to `approved`.

## Endpoint

| Property | Value |
|---|---|
| Method | `PATCH` |
| Path | `/api/admin/vendors/{vendor}/reactivate` |
| Authentication | Required; Sanctum bearer token with `vendors.reactivate` permission |
| Response format | `application/json` |

The route is registered in `routes/api.php` under the authenticated admin route group and is protected by the `permission:vendors.reactivate` middleware.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `vendor` | string | Yes | Vendor UUID to reactivate. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid admin bearer token.

## Request Body

This endpoint does not accept a request body.

## Example Request

```bash
curl -X PATCH "<API_BASE_URL>/api/admin/vendors/00000000-0000-4000-8000-000000000019/reactivate" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid admin token. Example values, IDs, names, and timestamps are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Vendor reactivated successfully.",
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
      "created_at": "2026-10-31T09:00:00.000000Z",
      "updated_at": "2026-10-31T09:00:00.000000Z"
    }
  }
}
```

The service refreshes the vendor with its linked user relation before returning the resource. Store relations and `stores_count` are not loaded by this action and are therefore omitted from this response.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response summary returned by the controller. |
| `data.vendor.id` | Vendor UUID. |
| `data.vendor.business_name` | Vendor business name. |
| `data.vendor.slug` | Vendor slug, or `null` if not set. |
| `data.vendor.email` | Vendor email address. |
| `data.vendor.phone` | Vendor phone number. |
| `data.vendor.description` | Vendor description. |
| `data.vendor.website` | Vendor website. |
| `data.vendor.country` | Vendor country. |
| `data.vendor.province` | Vendor province or region. |
| `data.vendor.city` | Vendor city. |
| `data.vendor.address` | Vendor address. |
| `data.vendor.status` | Updated vendor status (`approved`). |
| `data.vendor.user` | Linked user summary loaded for the response. |
| `data.vendor.user.id` | User ID. |
| `data.vendor.user.name` | User name. |
| `data.vendor.user.email` | User email address. |
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

Returned when the authenticated user does not have the `vendors.reactivate` permission.

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

### 422 Unprocessable Entity

Returned when the vendor is not currently suspended. The response includes a `vendor` validation error with the current status:

```json
{
  "status": "error",
  "message": "The vendor could not be reactivated.",
  "errors": {
    "vendor": [
      "Vendor cannot be reactivated because its current status is approved."
    ]
  }
}
```

The current status is substituted into the service-generated error message. The validation response format follows the application's API exception handling.

## Behavior Notes

- Only a vendor whose current status is `suspended` can be reactivated.
- A successful request sets the vendor status to `approved` and records a `vendor.reactivated` audit event.
- No request body or reason is required.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — admin vendor reactivation route and permission middleware
- `VendorController::reactivate` — route handling and success wrapper
- `AdminVendorService::reactivate` — suspended-status guard, status change, and audit event
- `VendorAdminResource` — vendor response fields
- `bootstrap/app.php` — API exception response formatting
