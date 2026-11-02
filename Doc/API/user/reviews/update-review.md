# Update a Product Review

Updates the rating and/or comment on a product review owned by the authenticated user.

## Endpoint

| Property | Value |
|---|---|
| Method | `PATCH` |
| Path | `/api/reviews/{review}` |
| Authentication | Required; Sanctum bearer token |
| Content-Type | `application/json` |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `review` | integer | Yes | ID of the review to update. |

## Request Headers

```http
Accept: application/json
Content-Type: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Request Body

Send at least one of the following fields. `rating` may be omitted; if provided, it must be an integer from `1` to `5`. `comment` may be set to `null` to clear it.

| Field | Type | Required | Validation Rules |
|---|---|---|---|
| `rating` | integer | No | Optional; if provided, minimum `1`, maximum `5`. |
| `comment` | string or `null` | No | Maximum 2000 characters. |

The request rules do not require either field, so an empty JSON object passes validation and leaves the review unchanged.

## Example Request

```bash
curl -X PATCH "<API_BASE_URL>/api/reviews/18" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "rating": 4,
    "comment": "Updated review text."
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example IDs, names, ratings, and timestamps are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Review updated successfully.",
  "data": {
    "review": {
      "id": 18,
      "product_id": "00000000-0000-4000-8000-000000000001",
      "order_item_id": 83,
      "rating": 4,
      "comment": "Updated review text.",
      "is_approved": true,
      "customer": {
        "id": 25,
        "name": "Alex Example"
      },
      "created_at": "2026-10-31T01:15:00.000000Z",
      "updated_at": "2026-10-31T01:20:00.000000Z"
    }
  }
}
```

The update repository reloads the review with its user relation, so the response includes the `customer` object.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the operation succeeded. |
| `message` | Response message. |
| `data.review.id` | Review identifier. |
| `data.review.product_id` | Product UUID associated with the review. |
| `data.review.order_item_id` | Order item associated with the review. |
| `data.review.rating` | Review rating from `1` to `5`. |
| `data.review.comment` | Review comment, or `null`. |
| `data.review.is_approved` | Approval flag for the review. |
| `data.review.customer` | Included customer summary with `id` and `name` when the user relation is loaded. |
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

Returned when a provided field fails validation, the review does not exist, or it belongs to another user. Validation failures include an `errors` object; service-rule failures return the error message directly.

Example validation error:

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "rating": [
      "The rating field must be at most 5."
    ]
  }
}
```

Example service error:

```json
{
  "status": "error",
  "message": "You can only update your own review."
}
```

## Behavior Notes

- The service checks that the review exists and belongs to the authenticated user.
- Service exceptions are returned as `422 Unprocessable Content`, including the review-not-found case.
- Only `rating` and `comment` are accepted by the update request. Product, order item, ownership, and approval state are not changed through this endpoint.
- An empty JSON object is valid and returns the review without changing its editable fields.
- No endpoint-specific throttling is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated review update route
- `ProductReviewController::update` — response handling and service exception mapping
- `UpdateProductReviewRequest` — optional rating/comment validation
- `ProductReviewService::update` — review lookup and user ownership check
- `ProductReviewRepository::update` — persistence and relation reload
- `ProductReviewResource` — response fields
- `bootstrap/app.php` — API validation and authentication error responses
