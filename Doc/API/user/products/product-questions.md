# List Questions for a Product

Returns the customer questions associated with a product, including any answers and customer/vendor names.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/products/{product}/questions` |
| Authentication | Not required |
| Response format | `application/json` |

The route is registered in `routes/api.php`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `product` | UUID string | Yes | Product ID whose questions to retrieve |

## Query Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `per_page` | integer | No | `10` | Maximum number of questions per page; values above `50` are capped at `50` |
| `page` | integer | No | `1` | Page number, handled by Laravel pagination |

The controller casts `per_page` to an integer and caps it at `50`; it does not validate a minimum value. Use a positive integer.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/products/<PRODUCT_UUID>/questions?per_page=10&page=1" \
  -H "Accept: application/json"
```

Replace `<API_BASE_URL>` with the API base URL and `<PRODUCT_UUID>` with the product UUID. Example identifiers and values below are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Product questions retrieved successfully.",
  "data": {
    "questions": [
      {
        "id": 101,
        "product_id": "00000000-0000-4000-8000-000000000001",
        "question": "Is this product suitable for daily use?",
        "answer": "Yes, it is designed for daily use.",
        "customer": {
          "id": 25,
          "name": "Alex Example"
        },
        "answered_by": {
          "id": 8,
          "name": "Vendor Example"
        },
        "answered_at": "2026-10-30T09:00:00.000000Z",
        "created_at": "2026-10-29T08:00:00.000000Z",
        "updated_at": "2026-10-30T09:00:00.000000Z"
      }
    ]
  }
}
```

Unanswered questions have `answer`, `answered_by`, and `answered_at` set to `null`. If no questions match the product ID and page, `data.questions` is an empty array.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.questions` | Questions for the requested product on the current page. |
| `data.questions[].id` | Question identifier. |
| `data.questions[].product_id` | Product UUID associated with the question. |
| `data.questions[].question` | Customer's question text. |
| `data.questions[].answer` | Answer text, or `null` if unanswered. |
| `data.questions[].customer` | Question author's ID and name. |
| `data.questions[].answered_by` | Answerer's ID and name, or `null` if unanswered or the answerer was removed. |
| `data.questions[].answered_at` | Answer timestamp, or `null` if unanswered. |
| `data.questions[].created_at` | Question creation timestamp. |
| `data.questions[].updated_at` | Last update timestamp. |

Dates are serialized as ISO 8601 date-time strings. The example IDs, names, text, and dates are illustrative.

## Behavior Notes

- The route is public and has no endpoint-specific throttle middleware.
- Questions are filtered by `product_id` and ordered newest first.
- The endpoint does not filter out unanswered questions.
- Pagination is applied, but the response includes only the `questions` list; pagination links and metadata are not exposed.
- The controller does not look up or validate the product itself. An unknown product UUID therefore returns a successful response with an empty question list rather than a product-not-found error.

## Implementation References

This documentation is based on:

- `routes/api.php` — public product questions route
- `PublicProductQuestionController::index` — `per_page` handling and response wrapper
- `ProductQuestionRepository::getProductQuestions` — product filter, eager-loaded relations, ordering, and pagination
- `ProductQuestionResource` — question, customer, and answerer response fields
- `database/migrations/2026_09_30_075808_create_product_questions_table.php` — question and answer data types

The route middleware was checked with `php artisan route:list`. No feature test specific to the public product questions endpoint was found during the documented review.
