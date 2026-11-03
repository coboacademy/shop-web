# List Vendor Inventory

Returns inventory records for products and variants belonging to the authenticated vendor, newest first.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/vendor/inventories` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `page` | integer | No | Page number to retrieve. |
| `per_page` | integer | No | Number of inventory records per page. Defaults to `15`. No upper bound or validation is applied by the controller. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/vendor/inventories?page=1&per_page=15" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL. All example IDs, names, values, and timestamps are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Inventory retrieved successfully.",
  "data": {
    "inventories": [
      {
        "id": "00000000-0000-4000-8000-000000000050",
        "product_id": "00000000-0000-4000-8000-000000000010",
        "variant_id": null,
        "quantity": 10,
        "reserved_quantity": 1,
        "available_quantity": 9,
        "low_stock_threshold": 2,
        "is_low_stock": false,
        "is_out_of_stock": false,
        "product": {
          "id": "00000000-0000-4000-8000-000000000010",
          "store_id": "00000000-0000-4000-8000-000000000004",
          "name": "Example Product",
          "slug": "example-product",
          "sku": "EXAMPLE-001",
          "short_description": "Illustrative short description.",
          "description": "Illustrative product description.",
          "price": "49.99",
          "compare_at_price": null,
          "status": "active",
          "is_featured": false,
          "stock_summary": {
            "quantity": 10,
            "reserved_quantity": 1,
            "available_quantity": 9
          },
          "published_at": "2026-10-31T02:30:00.000000Z",
          "created_at": "2026-10-31T02:20:00.000000Z",
          "updated_at": "2026-10-31T02:30:00.000000Z"
        },
        "variant": null,
        "created_at": "2026-10-31T02:25:00.000000Z",
        "updated_at": "2026-10-31T02:25:00.000000Z"
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

If there are no matching inventory records, `data.inventories` is an empty array and `pagination.total` is `0`. Product-level inventory may have `variant_id` and `variant` set to `null`; variant inventory includes the variant resource.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.inventories` | Inventory records on the current page. |
| `data.inventories[].id` | Inventory UUID. |
| `data.inventories[].product_id` | Associated product UUID. |
| `data.inventories[].variant_id` | Associated variant UUID, or `null` for product-level inventory. |
| `data.inventories[].quantity` | Total quantity in stock. |
| `data.inventories[].reserved_quantity` | Quantity reserved for orders. |
| `data.inventories[].available_quantity` | Available quantity, calculated as `max(0, quantity - reserved_quantity)`. |
| `data.inventories[].low_stock_threshold` | Threshold used for low-stock calculation. |
| `data.inventories[].is_low_stock` | Whether available quantity is above zero and at or below the threshold. |
| `data.inventories[].is_out_of_stock` | Whether available quantity is zero. |
| `data.inventories[].product` | Associated product resource. |
| `data.inventories[].variant` | Associated variant resource, or `null`. |
| `data.inventories[].created_at` | Inventory creation timestamp. |
| `data.inventories[].updated_at` | Last inventory update timestamp. |
| `data.pagination.current_page` | Current page number. |
| `data.pagination.last_page` | Last available page. |
| `data.pagination.per_page` | Page size used for the query. |
| `data.pagination.total` | Total matching inventory records. |

The nested product and variant resources include fields defined by `ProductResource` and `ProductVariantResource`. `categories` are omitted from the nested product because that relation is not loaded by this endpoint.

## Error Responses

### 401 Unauthenticated

Returned when the request does not include a valid authenticated session or bearer token.

```json
{
  "status": "error",
  "message": "Unauthenticated."
}
```

### Vendor Profile or Approval Error

The service throws a runtime exception if the user has no vendor profile or the vendor is not approved to manage inventory. The API exception handler returns `500`; its message is `Server error.` when debug mode is disabled. The exact message can differ when debug mode is enabled.

## Behavior Notes

- The service requires the authenticated user to have an approved vendor profile.
- Results are scoped through the product's store to the authenticated vendor's ID.
- The query includes product-level inventory only for products without variants, and includes variant-level inventory when a variant exists.
- Results are ordered newest first and paginated. The controller casts `per_page` to an integer and defaults it to `15`, without applying a maximum.
- No request body or endpoint-specific throttling middleware is defined.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated vendor inventory-list route
- `InventoryController::index` — query input and response wrapper
- `InventoryService::getAllForVendor` and `getApprovedVendor` — vendor approval check
- `InventoryRepository::getAllForVendor` and `forVendor` — vendor scoping, eligible records, eager loading, ordering, and pagination
- `InventoryResource`, `ProductResource`, and `ProductVariantResource` — response fields
- `Inventory` — computed quantity attributes
- `bootstrap/app.php` — API authentication and exception responses
