# Add a Product to the Wishlist

Adds a product to the authenticated user's wishlist.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/wishlist` |
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
| `product_id` | string | Yes | Must match an existing product ID. |

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/wishlist" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "product_id": "00000000-0000-4000-8000-000000000001"
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example IDs, product values, and timestamps are illustrative.

## Successful Response

**HTTP status:** `201 Created`

```json
{
  "status": "success",
  "message": "Product added to wishlist successfully.",
  "data": {
    "wishlist_item": {
      "id": 13,
      "product_id": "00000000-0000-4000-8000-000000000001",
      "product": {
        "id": "00000000-0000-4000-8000-000000000001",
        "store_id": "00000000-0000-4000-8000-000000000004",
        "name": "Example Coffee",
        "slug": "example-coffee",
        "sku": "EXAMPLE-COFFEE",
        "short_description": "Freshly roasted coffee.",
        "description": "Illustrative product description.",
        "price": "12.50",
        "compare_at_price": null,
        "status": "active",
        "is_featured": false,
        "published_at": "2026-10-29T08:00:00.000000Z",
        "created_at": "2026-10-29T08:00:00.000000Z",
        "updated_at": "2026-10-29T08:00:00.000000Z"
      },
      "created_at": "2026-10-31T01:20:00.000000Z"
    }
  }
}
```

The nested product is serialized using the product resource. Optional product relationship fields, such as `stock_summary` and `categories`, are omitted when those relationships are not loaded.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the operation succeeded. |
| `message` | Response message. |
| `data.wishlist_item.id` | Wishlist item identifier. |
| `data.wishlist_item.product_id` | Product UUID added to the wishlist. |
| `data.wishlist_item.product` | Product resource for the added product. |
| `data.wishlist_item.created_at` | Time the product was added to the wishlist. |

## Error Responses

### 401 Unauthenticated

Returned when the request does not include a valid authenticated session or bearer token.

```json
{
  "status": "error",
  "message": "Unauthenticated."
}
```

### 422 Unprocessable Content

Returned when `product_id` is missing or does not identify an existing product, or when the product is already in the authenticated user's wishlist.

Request validation failures return field-specific errors:

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "product_id": [
      "The selected product id is invalid."
    ]
  }
}
```

An already-added product returns:

```json
{
  "status": "error",
  "message": "Product is already in your wishlist."
}
```

## Behavior Notes

- The wishlist item is associated with the authenticated user; the request does not accept a user ID.
- A product can appear only once in a user's wishlist. Adding it again returns `422` rather than returning the existing item.
- Product existence is checked by request validation and again in the service.
- The service does not check the product's active status before adding it.
- No endpoint-specific throttling is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated wishlist add route
- `WishlistController::store` — request handling, product loading, response wrapper, and service error mapping
- `AddWishlistRequest` — `product_id` validation
- `WishlistService::add` — product lookup and duplicate-item behavior
- `WishlistRepository::add` — wishlist item persistence
- `WishlistItemResource` and `ProductResource` — response fields
- `bootstrap/app.php` — API validation and authentication error responses
