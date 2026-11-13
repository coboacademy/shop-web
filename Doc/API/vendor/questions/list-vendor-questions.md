# List Vendor Product Questions

Returns paginated questions submitted for the authenticated vendor's products.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/vendor/questions` |
| Authentication | Required; Sanctum bearer token and `Vendor` role |
| Content-Type | `application/json` |

## Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `page` | integer | No | Page number; defaults to `1`. |
| `per_page` | integer | No | Number of results per page; defaults to `10` and is capped at `100`. |

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/vendor/questions?page=1&per_page=10" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Vendor questions retrieved successfully.",
  "data": {
    "questions": {
      "data": [
        {
          "id": 19,
          "product_id": "00000000-0000-4000-8000-000000000001",
          "question": "Is this product available in another size?",
          "answer": null,
          "customer": {
            "id": 25,
            "name": "Alex Example"
          },
          "answered_by": null,
          "answered_at": null,
          "created_at": "2026-10-31T01:20:00.000000Z",
          "updated_at": "2026-10-31T01:20:00.000000Z"
        }
      ],
      "links": {
        "first": "<API_BASE_URL>/api/vendor/questions?page=1",
        "last": "<API_BASE_URL>/api/vendor/questions?page=1",
        "prev": null,
        "next": null
      },
      "meta": {
        "current_page": 1,
        "from": 1,
        "last_page": 1,
        "path": "<API_BASE_URL>/api/vendor/questions",
        "per_page": 10,
        "to": 1,
        "total": 1
      }
    }
  }
}
```

`data.questions.meta.current_page` and the other pagination metadata are always
present, including when there are no matching questions.
