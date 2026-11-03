# List Approved Reviews for a Product

Returns paginated, approved customer reviews for a product, ordered from newest to oldest.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/products/{product}/reviews` |
| Authentication | Not required |
| Response format | `application/json` |

The route is registered in `routes/api.php`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `product` | UUID | Yes | ID of the product whose approved reviews to retrieve |

## Query Parameters

| Parameter | Type | Required | Default | Constraints |
|---|---|---|---:|---|
| `per_page` | integer | No | `10` | Maximum page size is `50` |
| `page` | integer | No | `1` | Selects the paginator page |

The controller caps `per_page` at 50 and passes it to Laravel pagination. Only approved reviews are returned, newest first. The response includes the review array under `data.reviews`; pagination links and metadata are not included in this response shape.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/products/<PRODUCT_UUID>/reviews?per_page=10&page=1" \
  -H "Accept: application/json"
```

Replace `<API_BASE_URL>` with the API base URL and `<PRODUCT_UUID>` with a product ID. Example identifiers and review content below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Product reviews retrieved successfully.",
  "data": {
    "reviews": [
      {
        "id": 321,
        "product_id": "00000000-0000-4000-8000-000000000001",
        "order_item_id": 456,
        "rating": 5,
        "comment": "An illustrative review.",
        "is_approved": true,
        "customer": {
          "id": 789,
          "name": "Alex Example"
        },
        "created_at": "2026-10-30T09:00:00.000000Z",
        "updated_at": "2026-10-30T09:00:00.000000Z"
      }
    ]
  }
}
```

When there are no approved reviews for the product or page, `data.reviews` is an empty array.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.reviews` | Reviews for the selected page, ordered newest first. |
| `data.reviews[].id` | Review identifier. |
| `data.reviews[].product_id` | Product UUID associated with the review. |
| `data.reviews[].order_item_id` | Order item associated with the review. |
| `data.reviews[].rating` | Review rating as an integer. |
| `data.reviews[].comment` | Review comment; may be `null`. |
| `data.reviews[].is_approved` | Approval state; returned reviews have this set to `true`. |
| `data.reviews[].customer` | Reviewer summary containing `id` and `name`. |
| `data.reviews[].created_at` | Review creation timestamp. |
| `data.reviews[].updated_at` | Review update timestamp. |

## Error Responses

No endpoint-specific validation or error response is defined. The controller queries reviews by the supplied product ID without first checking that the product exists; if no matching approved reviews exist, it returns an empty list rather than a product-not-found error.

## Implementation References

This documentation is based on:

- `routes/api.php` — public route registration
- `PublicProductReviewController::index` — page-size handling and response wrapper
- `ProductReviewRepository::getProductReviews` — approval filter, user eager loading, newest-first order, and pagination
- `ProductReviewResource` — review and customer response fields
- Product review table migration — stored review columns and nullable comment

The route middleware was checked with `php artisan route:list`. No feature test specific to this public product-review listing endpoint was found during the documented review.
