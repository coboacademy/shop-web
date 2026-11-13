# Delete a Product Review

Deletes a product review owned by the authenticated user.

## Endpoint

| Property | Value |
|---|---|
| Method | `DELETE` |
| Path | `/api/reviews/{review}` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `review` | integer | Yes | ID of the review to delete. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Example Request

```bash
curl -X DELETE "<API_BASE_URL>/api/reviews/18" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. The example review ID is illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Review deleted successfully.",
  "data": []
}
```

The endpoint returns no review resource after deletion.

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

Returned when the review ID does not exist or the review belongs to another user. The controller maps both service exceptions to `422`.

```json
{
  "status": "error",
  "message": "You can only delete your own review."
}
```

For a nonexistent review, the message is `Review not found.`.

## Behavior Notes

- The service checks that the review exists and belongs to the authenticated user before deleting it.
- Service errors, including review-not-found, are returned as `422 Unprocessable Content`; this endpoint does not return `404` for a missing review.
- On success, the review record is deleted and the success response contains no review data.
- No endpoint-specific throttling is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated review deletion route
- `ProductReviewController::destroy` — response wrapper and service exception mapping
- `ProductReviewService::delete` — review lookup and user ownership check
- `ProductReviewRepository::delete` — record deletion
- `bootstrap/app.php` — API authentication error response
