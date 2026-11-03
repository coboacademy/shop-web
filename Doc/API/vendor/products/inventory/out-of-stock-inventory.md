# List Out-of-Stock Vendor Inventory

Returns inventory records for the authenticated vendor where available stock is zero, newest first.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/vendor/inventories/out-of-stock` |
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
curl -X GET "<API_BASE_URL>/api/vendor/inventories/out-of-stock?page=1&per_page=15" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL. All example IDs, names, values, and timestamps are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Out of stock inventory retrieved successfully.",
  "data": {
    "inventories": {
      "data": [
        {
          "id": "00000000-0000-4000-8000-000000000050",
          "product_id": "00000000-0000-4000-8000-000000000010",
          "variant_id": null,
          "quantity": 3,
          "reserved_quantity": 3,
          "available_quantity": 0,
          "low_stock_threshold": 2,
          "is_low_stock": false,
          "is_out_of_stock": true,
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
              "quantity": 3,
              "reserved_quantity": 3,
              "available_quantity": 0
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
      "links": {
        "first": "<API_BASE_URL>/api/vendor/inventories/out-of-stock?page=1",
        "last": "<API_BASE_URL>/api/vendor/inventories/out-of-stock?page=1",
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
            "url": "<API_BASE_URL>/api/vendor/inventories/out-of-stock?page=1",
            "label": "1",
            "active": true
          },
          {
            "url": null,
            "label": "Next &raquo;",
            "active": false
          }
        ],
        "path": "<API_BASE_URL>/api/vendor/inventories/out-of-stock",
        "per_page": 15,
        "to": 1,
        "total": 1
      }
    }
  }
}
```

If there are no matching records, `data.inventories.data` is an empty array. The paginator supplies `links` and `meta`; values depend on the result set and requested page.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.inventories.data` | Matching inventory records on the current page. |
| `data.inventories.data[].id` | Inventory UUID. |
| `data.inventories.data[].product_id` | Associated product UUID. |
| `data.inventories.data[].variant_id` | Associated variant UUID, or `null` for product-level inventory. |
| `data.inventories.data[].quantity` | Total quantity in stock. |
| `data.inventories.data[].reserved_quantity` | Quantity reserved for orders. |
| `data.inventories.data[].available_quantity` | Available quantity, calculated as `max(0, quantity - reserved_quantity)`. |
| `data.inventories.data[].low_stock_threshold` | Threshold used for low-stock calculation. |
| `data.inventories.data[].is_low_stock` | Whether available quantity is above zero and at or below the threshold; false for out-of-stock records. |
| `data.inventories.data[].is_out_of_stock` | Whether available quantity is zero; true for matching records. |
| `data.inventories.data[].product` | Associated product resource. |
| `data.inventories.data[].variant` | Associated variant resource, or `null`. |
| `data.inventories.links` | Pagination URLs. |
| `data.inventories.meta` | Pagination information, including page, page size, and total. |

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
- A record is included when `(quantity - reserved_quantity) <= 0`. This includes fully reserved stock as well as inventory with no remaining stock.
- Product-level inventory is included only for products without variants; variant-level inventory is also included.
- Results are ordered newest first and paginated. The controller casts `per_page` to an integer and defaults it to `15`, without applying a maximum.
- No request body or endpoint-specific throttling middleware is defined.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated out-of-stock inventory route
- `InventoryController::outOfStock` — query input and response wrapper
- `InventoryService::getOutOfStockForVendor` and `getApprovedVendor` — vendor approval check
- `InventoryRepository::getOutOfStockForVendor` and `forVendor` — out-of-stock condition, vendor scoping, eligible records, eager loading, ordering, and pagination
- `InventoryResource`, `ProductResource`, and `ProductVariantResource` — response fields
- `Inventory` — computed quantity attributes
- `bootstrap/app.php` — API authentication and exception responses
