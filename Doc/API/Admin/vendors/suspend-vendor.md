# Suspend a Vendor

Suspends an approved vendor account and records the supplied reason in the vendor-management audit event.

## Endpoint

| Property | Value |
|---|---|
| Method | `PATCH` |
| Path | `/api/admin/vendors/{vendor}/suspend` |
| Authentication | Required; Sanctum bearer token with `vendors.suspend` permission |
| Response format | `application/json` |

The route is registered in `routes/api.php` under the authenticated admin route group and is protected by the `permission:vendors.suspend` middleware.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `vendor` | string | Yes | Vendor UUID to suspend. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json
```

Replace `<YOUR_TOKEN>` with a valid admin bearer token.

## Request Body

```json
{
  "reason": "Repeated violations of the vendor marketplace policy."
}
```

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `reason` | string | Yes | 5–1000 characters | Reason for suspending the vendor. |

## Example Request

```bash
curl -X PATCH "<API_BASE_URL>/api/admin/vendors/00000000-0000-4000-8000-000000000019/suspend" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "reason": "Repeated violations of the vendor marketplace policy."
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid admin token. Example values, IDs, names, and timestamps are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Vendor suspended successfully.",
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
      "status": "suspended",
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

The controller refreshes the vendor with its linked user relation before creating this resource. Store relations and `stores_count` are not loaded by this action and are therefore omitted from this response.

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
| `data.vendor.status` | Updated vendor status (`suspended`). |
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

Returned when the authenticated user does not have the `vendors.suspend` permission.

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

Returned if `reason` is missing, is not a string, is shorter than 5 characters, or exceeds 1000 characters. Validation messages include:

- `A suspension reason is required.`
- `The suspension reason must be at least 5 characters.`
- `The suspension reason may not exceed 1000 characters.`

The service also rejects vendors whose current status is not `approved`. That response includes a `vendor` validation error such as:

```json
{
  "status": "error",
  "message": "The vendor could not be suspended.",
  "errors": {
    "vendor": [
      "Vendor cannot be suspended because its current status is pending."
    ]
  }
}
```

The current status is included in the service-generated message. The validation response format follows the application's API exception handling.

## Behavior Notes

- Only vendors currently in `approved` status can be suspended.
- A successful request sets the vendor status to `suspended` and records the supplied reason in the `vendor.suspended` audit event.
- The reason is used in the audit record; it is not included in the vendor resource response.
- No other status transition rules are enforced by this action.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — admin vendor suspension route and permission middleware
- `VendorController::suspend` — request handling and response wrapper
- `SuspendVendorRequest` — reason validation and custom validation messages
- `AdminVendorService::suspend` — approved-status guard, status change, and audit event
- `VendorAdminResource` — vendor response fields
- `bootstrap/app.php` — API exception response formatting
