# Create a Product Review

Creates a product review for an item in the authenticated user's delivered order.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/reviews` |
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
| `order_item_id` | integer | Yes | Must match an existing order item ID. |
| `rating` | integer | Yes | Minimum `1`, maximum `5`. |
| `comment` | string or `null` | No | Maximum 2000 characters. |

The service also verifies that the order item belongs to the authenticated user, the order is delivered, and the order item belongs to the submitted product.

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/reviews" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "product_id": "00000000-0000-4000-8000-000000000001",
    "order_item_id": 83,
    "rating": 5,
    "comment": "Excellent quality."
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example IDs, names, ratings, and timestamps are illustrative.

## Successful Response

**HTTP status:** `201 Created`

```json
{
  "status": "success",
  "message": "Review created successfully.",
  "data": {
    "review": {
      "id": 18,
      "product_id": "00000000-0000-4000-8000-000000000001",
      "order_item_id": 83,
      "rating": 5,
      "comment": "Excellent quality.",
      "is_approved": true,
      "created_at": "2026-10-31T01:15:00.000000Z",
      "updated_at": "2026-10-31T01:15:00.000000Z"
    }
  }
}
```

The created review is returned without the optional `customer` object because the controller does not load the user relation for this response.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the operation succeeded. |
| `message` | Response message. |
| `data.review.id` | Review identifier. |
| `data.review.product_id` | Product UUID being reviewed. |
| `data.review.order_item_id` | Order item that qualifies the user to review the product. |
| `data.review.rating` | Rating from `1` to `5`. |
| `data.review.comment` | Review comment, or `null` if omitted. |
| `data.review.is_approved` | Approval flag; newly created reviews are set to `true`. |
| `data.review.created_at` | Review creation timestamp. |
| `data.review.updated_at` | Last review update timestamp. |

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

Returned when request validation fails or the order item does not meet the service rules. Validation failures use an `errors` object; service-rule failures return the error message directly.

Example request validation error:

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "rating": [
      "The rating field must be at least 1."
    ]
  }
}
```

Example service-rule error:

```json
{
  "status": "error",
  "message": "You can review the product after the order is delivered."
}
```

Service-rule errors may also be returned when the order item does not exist, belongs to another user, is for another product, or already has a review from this user.

## Behavior Notes

- Reviews are only permitted for order items in orders whose status is `delivered`.
- A user may create at most one review for a given order item.
- The product ID must match the product ID on the submitted order item.
- The review is marked approved (`is_approved: true`) on creation.
- The operation runs in a database transaction.
- No endpoint-specific throttling is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated product review creation route
- `ProductReviewController::store` — request handling, success response, and service error mapping
- `CreateProductReviewRequest` — request validation rules
- `ProductReviewService::create` — order ownership, delivery, product matching, duplicate review checks, and creation behavior
- `ProductReviewResource` — response fields
- `database/migrations/2026_09_28_201007_create_product_reviews_table.php` — review constraints and persisted fields
- `bootstrap/app.php` — API validation and authentication error responses
