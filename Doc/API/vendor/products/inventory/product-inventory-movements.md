# List a Vendor Product's Inventory Movements

Returns paginated movement history for the product-level inventory of a product owned by the authenticated vendor. Products with variants must use the variant inventory movements endpoint.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/vendor/products/{product}/inventory/movements` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `product` | UUID | Yes | ID of the product whose inventory movement history to retrieve. |

## Query Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `per_page` | integer | No | `20` | Number of movements requested per page. The value is cast to an integer; this endpoint defines no explicit validation or maximum. |
| `page` | integer | No | `1` | Page number, handled by Laravel pagination. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/vendor/products/00000000-0000-4000-8000-000000000010/inventory/movements?per_page=20&page=1" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL. All example IDs, values, and timestamps are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Inventory movements retrieved successfully.",
  "data": {
    "movements": [
      {
        "id": "00000000-0000-4000-8000-000000000060",
        "inventory_id": "00000000-0000-4000-8000-000000000050",
        "type": "stock_out",
        "quantity": 2,
        "before_quantity": 12,
        "after_quantity": 10,
        "reason": "Illustrative damaged-stock removal",
        "reference_type": null,
        "reference_id": null,
        "created_by": 1,
        "creator": {
          "id": 1,
          "name": "Example Vendor",
          "email": "vendor@example.test",
          "status": "active",
          "email_verified_at": "2026-10-30T12:00:00.000000Z",
          "created_at": "2026-10-30T11:00:00.000000Z",
          "updated_at": "2026-10-30T12:00:00.000000Z"
        },
        "created_at": "2026-10-31T03:20:00.000000Z"
      }
    ]
  }
}
```

All example IDs, values, and timestamps are illustrative. `data.movements` contains the current page of movement resources. Although the service uses Laravel pagination, the controller places the resource collection inside its own JSON response; pagination links and totals are not included in this response.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.movements` | Array of movement records for the current page, newest first. |
| `data.movements[].id` | Movement UUID. |
| `data.movements[].inventory_id` | Associated inventory UUID. |
| `data.movements[].type` | Movement type, such as `stock_in`, `stock_out`, or `adjustment`. |
| `data.movements[].quantity` | Quantity recorded for this movement. For adjustments, this is the absolute difference. |
| `data.movements[].before_quantity` | Inventory total before the movement. |
| `data.movements[].after_quantity` | Inventory total after the movement. |
| `data.movements[].reason` | Optional reason supplied when the movement was recorded. |
| `data.movements[].reference_type` | Optional polymorphic reference type. |
| `data.movements[].reference_id` | Optional referenced record ID. |
| `data.movements[].created_by` | Numeric ID of the user who recorded the movement, if available. |
| `data.movements[].creator` | Loaded user object or `null` if there is no associated user. The user fields include `id`, `name`, `email`, `status`, `email_verified_at`, `created_at`, and `updated_at`; the model hides password and remember-token fields. |
| `data.movements[].created_at` | Movement creation timestamp. |

## Error Responses

### 401 Unauthenticated

Returned when the request does not include a valid authenticated session or bearer token.

```json
{
  "status": "error",
  "message": "Unauthenticated."
}
```

### 404 Product or Inventory Not Found

Returned when the product does not exist or is not owned by the authenticated vendor, or when product-level inventory does not exist for the product.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

### 422 Product Has Variants

Returned when the product has variants; use the variant inventory movements endpoint instead.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "product_id": [
      "Products with variants must use variant inventory."
    ]
  }
}
```

### Vendor Profile or Approval Error

The service throws a runtime exception if the user has no vendor profile or the vendor is not approved to manage inventory. The API exception handler returns `500`; its message is `Server error.` when debug mode is disabled. The exact message can differ when debug mode is enabled.

## Behavior Notes

- The service requires the authenticated user to have an approved vendor profile and scopes the product lookup through the product's store to that vendor.
- Products with variants cannot use this endpoint; the variant inventory history is available at `GET /api/vendor/products/{product}/variants/{variant}/inventory/movements`.
- An existing product-level inventory record is required.
- Movements are returned newest first, with their associated creator loaded when present.
- `per_page` defaults to `20`. The controller casts the query value to an integer and does not apply the shared API pagination helper's minimum or maximum.
- No endpoint-specific throttling middleware is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated product inventory movements route
- `InventoryController::movements` — query handling and response wrapper
- `InventoryService::getMovements`, `getOwnedInventory`, and `getApprovedVendor` — vendor access, product-level constraints, and movement pagination
- `InventoryMovementResource` — movement response fields
- `bootstrap/app.php` — API validation, authentication, and exception responses
