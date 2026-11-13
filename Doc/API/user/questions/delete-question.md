# Delete a Product Question

Deletes a product question submitted by the authenticated user.

## Endpoint

| Property | Value |
|---|---|
| Method | `DELETE` |
| Path | `/api/questions/{question}` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `question` | integer | Yes | ID of the question to delete. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Example Request

```bash
curl -X DELETE "<API_BASE_URL>/api/questions/19" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. The example question ID is illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Question deleted successfully.",
  "data": []
}
```

The endpoint returns no question resource after deletion.

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

Returned when the question ID does not exist or the question belongs to another user. Both service errors are mapped to `422`.

```json
{
  "status": "error",
  "message": "You can only delete your own question."
}
```

For a nonexistent question, the message is `Question not found.`.

## Behavior Notes

- The service checks that the question exists and belongs to the authenticated user before deleting it.
- Service errors, including question-not-found, are returned as `422 Unprocessable Content`; the endpoint does not return `404` for a missing question.
- On success, the question record is deleted and the response contains no question data.
- No endpoint-specific throttling is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated product-question deletion route
- `ProductQuestionController::destroy` — response wrapper and service exception mapping
- `ProductQuestionService::delete` — question lookup and user ownership check
- `ProductQuestionRepository::delete` — record deletion
- `bootstrap/app.php` — API authentication error response
