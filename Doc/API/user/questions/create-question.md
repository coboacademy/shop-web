# Ask a Product Question

Submits a question about a product as the authenticated user.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/questions` |
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
| `product_id` | UUID string | Yes | Must identify an existing product. |
| `question` | string | Yes | Maximum 2000 characters. |

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/questions" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "product_id": "00000000-0000-4000-8000-000000000001",
    "question": "Is this product available in another size?"
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example IDs, names, questions, and timestamps are illustrative.

## Successful Response

**HTTP status:** `201 Created`

```json
{
  "status": "success",
  "message": "Question submitted successfully.",
  "data": {
    "question": {
      "id": 19,
      "product_id": "00000000-0000-4000-8000-000000000001",
      "question": "Is this product available in another size?",
      "answer": null,
      "customer": {
        "id": 25,
        "name": "Alex Example"
      },
      "answered_at": null,
      "created_at": "2026-10-31T01:20:00.000000Z",
      "updated_at": "2026-10-31T01:20:00.000000Z"
    }
  }
}
```

The response includes the submitting user's `id` and `name`. `answered_by` is omitted because that relation is not loaded when the question is first created.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the operation succeeded. |
| `message` | Response message. |
| `data.question.id` | Question identifier. |
| `data.question.product_id` | Product UUID associated with the question. |
| `data.question.question` | Submitted question text. |
| `data.question.answer` | Answer text; `null` until answered. |
| `data.question.customer` | Submitting user summary containing `id` and `name`. |
| `data.question.answered_by` | Included only when the answering-user relation is loaded; omitted in this creation response. |
| `data.question.answered_at` | Answer timestamp; `null` until answered. |
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

### 422 Unprocessable Content

Returned when request validation fails, for example when `product_id` is missing, is not a UUID, does not identify an existing product, or the question text is missing or too long.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "question": [
      "The question field is required."
    ]
  }
}
```

The controller also maps service runtime errors to `422`; the service checks that the product exists before creating the question.

## Behavior Notes

- The question is associated with the authenticated user; the request does not accept a user ID.
- The service does not check whether the product is active or whether the user has purchased it.
- The created question is not automatically answered; `answer` and `answered_at` are initially `null`.
- No endpoint-specific throttling is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated product-question creation route
- `ProductQuestionController::store` — request handling, relation loading, response wrapper, and service error mapping
- `CreateProductQuestionRequest` — UUID, product-existence, and question-text validation
- `ProductQuestionService::create` — product lookup and authenticated-user association
- `ProductQuestionResource` — response fields
- `bootstrap/app.php` — API validation and authentication error responses
