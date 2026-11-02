# Get the Authenticated User's Wishlist

Returns the authenticated user's wishlist items, newest first, with the associated product resource for each item.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/wishlist` |
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
| `page` | integer | No | Page number to retrieve. Pagination uses 15 wishlist items per page. |

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/wishlist?page=1" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example IDs, product values, and timestamps below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Wishlist retrieved successfully.",
  "data": {
    "wishlist": {
      "data": [
        {
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
          "created_at": "2026-10-30T09:00:00.000000Z"
        }
      ],
      "links": {
        "first": "<API_BASE_URL>/api/wishlist?page=1",
        "last": "<API_BASE_URL>/api/wishlist?page=1",
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
            "url": "<API_BASE_URL>/api/wishlist?page=1",
            "label": "1",
            "active": true
          },
          {
            "url": null,
            "label": "Next &raquo;",
            "active": false
          }
        ],
        "path": "<API_BASE_URL>/api/wishlist",
        "per_page": 15,
        "to": 1,
        "total": 1
      }
    }
  }
}
```

The product resource includes only product fields that are present without optional relationships being loaded; fields such as `stock_summary` and `categories` may be omitted. Pagination links, URLs, and metadata values vary with the request and result set.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.wishlist.data` | Wishlist items for the current page. |
| `data.wishlist.data[].id` | Wishlist item identifier. |
| `data.wishlist.data[].product_id` | Product UUID saved to the wishlist. |
| `data.wishlist.data[].product` | Associated product resource. |
| `data.wishlist.data[].created_at` | Time the product was added to the wishlist. |
| `data.wishlist.links` | Pagination URLs for the wishlist results. |
| `data.wishlist.meta` | Pagination details, including current page, page size, and total items. |

## Error Responses

### 401 Unauthenticated

Returned when the request does not include a valid authenticated session or bearer token.

```json
{
  "status": "error",
  "message": "Unauthenticated."
}
```

## Behavior Notes

- The endpoint returns only wishlist items whose `user_id` matches the authenticated user.
- Items are ordered newest first.
- The repository paginates at 15 items per page. The response wraps a paginated resource collection under `data.wishlist`, which includes its own `data`, `links`, and `meta`.
- An empty wishlist returns an empty `data.wishlist.data` array with pagination metadata.
- No endpoint-specific throttling is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated wishlist listing route
- `WishlistController::index` — authenticated user selection and response wrapper
- `WishlistService::getWishlist` and `WishlistRepository::getUserWishlist` — user filtering, product loading, newest-first ordering, and pagination size
- `WishlistItemResource` — wishlist item response fields
- `ProductResource` — nested product response fields
- `bootstrap/app.php` — API authentication error response
