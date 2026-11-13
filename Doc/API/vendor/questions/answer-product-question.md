# Answer a Product Question

Allows an authenticated vendor to answer a question about one of the vendor's products.

## Endpoint

| Property | Value |
|---|---|
| Method | `PATCH` |
| Path | `/api/vendor/questions/{question}/answer` |
| Authentication | Required; Sanctum bearer token and `Vendor` role |
| Content-Type | `application/json` |
| Response format | `application/json` |

The route is registered in `routes/api.php` and uses `auth:sanctum` and `role:Vendor` middleware.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `question` | integer | Yes | ID of the product question to answer. |

## Request Headers

```http
Accept: application/json
Content-Type: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token belonging to a user with the `Vendor` role.

## Request Body

| Field | Type | Required | Validation Rules |
|---|---|---|---|
| `answer` | string | Yes | Maximum 2000 characters. |

## Example Request

```bash
curl -X PATCH "<API_BASE_URL>/api/vendor/questions/19/answer" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "answer": "Yes, this product is available in additional sizes."
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example IDs, names, answers, and timestamps are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Question answered successfully.",
  "data": {
    "question": {
      "id": 19,
      "product_id": "00000000-0000-4000-8000-000000000001",
      "question": "Is this product available in another size?",
      "answer": "Yes, this product is available in additional sizes.",
      "customer": {
        "id": 25,
        "name": "Alex Example"
      },
      "answered_by": {
        "id": 31,
        "name": "Vendor Example"
      },
      "answered_at": "2026-10-31T01:28:00.000000Z",
      "created_at": "2026-10-31T01:20:00.000000Z",
      "updated_at": "2026-10-31T01:28:00.000000Z"
    }
  }
}
```

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the operation succeeded. |
| `message` | Response message. |
| `data.question.id` | Question identifier. |
| `data.question.product_id` | Product UUID associated with the question. |
| `data.question.question` | Customer's question text. |
| `data.question.answer` | Answer submitted by the vendor. |
| `data.question.customer` | Question author summary with `id` and `name`, when the user relation is loaded. |
| `data.question.answered_by` | Answering user summary with `id` and `name`, or `null` if not available. |
| `data.question.answered_at` | Time the answer was saved. |
| `data.question.created_at` | Question creation timestamp. |
| `data.question.updated_at` | Last question update timestamp. |

## Error Responses

### 401 Unauthenticated

Returned when the request does not include a valid authenticated session or bearer token.

```json
{
  "status": "error",
  "message": "Unauthenticated."
}
```

### 403 Forbidden

Returned when the authenticated user does not have the required `Vendor` role.

```json
{
  "status": "error",
  "message": "You do not have the required permission."
}
```

### 404 Not Found

Returned when the authenticated vendor account does not have an associated vendor profile.

```json
{
  "status": "error",
  "message": "Vendor profile not found."
}
```

### 422 Unprocessable Content

Returned when the answer fails validation, the question or its product cannot be found, or the product does not belong to the authenticated vendor.

Request validation failures return field-specific errors:

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "answer": [
      "The answer field is required."
    ]
  }
}
```

Service-rule failures are returned as an error message, for example:

```json
{
  "status": "error",
  "message": "You can only answer questions for your own products."
}
```

## Behavior Notes

- The route requires a bearer-authenticated user with the `Vendor` role and an associated vendor profile.
- The service verifies that the question's product store belongs to the authenticated vendor.
- The answer is saved with the authenticated user's ID in `answered_by` and the current time in `answered_at`.
- The endpoint does not prevent a vendor from replacing an existing answer.
- No endpoint-specific throttling is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — vendor question-answer route and middleware
- `VendorProductQuestionController::answer` — vendor profile lookup, response wrapper, and service error mapping
- `AnswerProductQuestionRequest` — answer validation rules
- `ProductQuestionService::answer` — question/product lookup and vendor ownership check
- `ProductQuestionRepository::update` — persistence and relation loading
- `ProductQuestionResource` — response fields
- `bootstrap/app.php` — API authentication and authorization error responses
