# List Admin Categories

Returns a paginated list of categories, newest first. Each category includes
its loaded parent category when it has one.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/admin/categories` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` in the authenticated admin route
group. It does not declare category-specific permission middleware.

## Query Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---:|---|
| `per_page` | integer | No | `15` | Number of categories requested per page. The value is cast to an integer; this endpoint does not declare separate validation or a maximum. |
| `page` | integer | No | `1` | Page number, handled by Laravel pagination. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

## Example Request

```bash
curl -G "<API_BASE_URL>/api/admin/categories" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  --data-urlencode "per_page=15" \
  --data-urlencode "page=1"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid
Sanctum token.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Categories retrieved successfully.",
  "data": {
    "categories": [
      {
        "id": "00000000-0000-4000-8000-000000000001",
        "parent_id": null,
        "name": "Beverages",
        "slug": "beverages",
        "description": null,
        "image": null,
        "image_url": null,
        "icon": null,
        "icon_url": null,
        "is_active": true,
        "parent": null,
        "created_at": "2026-11-01T04:00:00.000000Z",
        "updated_at": "2026-11-01T04:00:00.000000Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "last_page": 1,
      "per_page": 15,
      "total": 1
    }
  }
}
```

The IDs, names, and timestamps are illustrative. A category with a parent
returns a `parent` object containing that parent's category resource fields.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.categories` | Category resources for the current page. |
| `data.categories[].id` | Category UUID. |
| `data.categories[].parent_id` | Parent category UUID, or `null` for a root category. |
| `data.categories[].name` | Category name. |
| `data.categories[].slug` | Category slug. |
| `data.categories[].description` | Category description, or `null`. |
| `data.categories[].image` | Stored image path, or `null`. |
| `data.categories[].image_url` | Public URL for the image, or `null`. |
| `data.categories[].icon` | Stored icon path, or `null`. |
| `data.categories[].icon_url` | Public URL for the icon, or `null`. |
| `data.categories[].is_active` | Whether the category is active. |
| `data.categories[].parent` | Loaded parent category resource, or `null` when this is a root category. |
| `data.categories[].created_at` | Category creation timestamp. |
| `data.categories[].updated_at` | Last category update timestamp. |
| `data.pagination.current_page` | Current page number. |
| `data.pagination.last_page` | Last available page. |
| `data.pagination.per_page` | Number of categories per page. |
| `data.pagination.total` | Total number of matching categories. |

## Error Responses

### 401 Unauthenticated

Returned when the request does not include a valid authenticated session or
bearer token.

```json
{
  "status": "error",
  "message": "Unauthenticated."
}
```

## Behavior Notes

- Results are ordered newest first.
- The endpoint does not filter categories by `is_active`.
- Soft-deleted categories are excluded by the model's default soft-delete scope.
- The endpoint has no category-specific permission middleware.

## Implementation References

- `routes/api.php` — authenticated admin category-list route
- `CategoryController::index` — query parameter handling and response
- `CategoryService::getCategories` — pagination service method
- `CategoryRepository::getAll` — parent eager loading, ordering, and pagination
- `CategoryResource` — serialized category fields
- `bootstrap/app.php` — API authentication error response
- `ApiResponse` — standardized success response

The route's authentication middleware was verified with
`php artisan route:list --path=admin/categories -v`. No feature test specific
to this endpoint was found during this documentation pass.
