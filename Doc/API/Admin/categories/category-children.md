# List a Category's Child Categories

Returns the immediate child categories of the specified category, ordered
alphabetically by name.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/admin/categories/{category}/children` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` in the authenticated admin route
group. It does not declare category-specific permission middleware.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `category` | string | Yes | UUID of the parent category whose immediate children to return. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/admin/categories/<CATEGORY_ID>/children" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL, `<CATEGORY_ID>` with the parent
category UUID, and `<YOUR_TOKEN>` with a valid Sanctum token.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Child categories retrieved successfully.",
  "data": {
    "categories": [
      {
        "id": "00000000-0000-4000-8000-000000000002",
        "parent_id": "00000000-0000-4000-8000-000000000001",
        "name": "Coffee",
        "slug": "coffee",
        "description": null,
        "image": null,
        "image_url": null,
        "icon": null,
        "icon_url": null,
        "is_active": true,
        "created_at": "2026-11-01T04:00:00.000000Z",
        "updated_at": "2026-11-01T04:00:00.000000Z"
      }
    ]
  }
}
```

The IDs, names, and timestamps are illustrative. If the category has no
immediate children, `data.categories` is an empty array.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.categories` | Immediate child category resources. |
| `data.categories[].id` | Child category UUID. |
| `data.categories[].parent_id` | UUID of the requested parent category. |
| `data.categories[].name` | Category name. |
| `data.categories[].slug` | Category slug. |
| `data.categories[].description` | Category description, or `null`. |
| `data.categories[].image` | Stored image path, or `null`. |
| `data.categories[].image_url` | Public URL for the image, or `null`. |
| `data.categories[].icon` | Stored icon path, or `null`. |
| `data.categories[].icon_url` | Public URL for the icon, or `null`. |
| `data.categories[].is_active` | Whether the category is active. |
| `data.categories[].created_at` | Category creation timestamp. |
| `data.categories[].updated_at` | Last category update timestamp. |

The response contains only immediate children; it does not include nested
`children` or `parent` fields.

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

### 404 Not Found

Returned when `<CATEGORY_ID>` does not identify an existing, non-deleted
category.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

## Behavior Notes

- Returns only direct children of the requested category; it does not recurse.
- Child categories are ordered alphabetically by name.
- Inactive categories are not filtered out.
- Soft-deleted parent and child categories are excluded by the model's default
  soft-delete scope.
- The endpoint has no query parameters and does not paginate the results.

## Implementation References

- `routes/api.php` — authenticated admin category-children route
- `CategoryController::children` — success response
- `CategoryService::getChildren` — parent lookup and child retrieval
- `CategoryRepository::findByIdOrFail` — parent lookup
- `CategoryRepository::getChildren` — direct-child query and ordering
- `CategoryResource` — serialized category fields
- `bootstrap/app.php` — API authentication and not-found error responses
- `ApiResponse` — standardized success response

The route's authentication middleware was verified with
`php artisan route:list --path=admin/categories`. No feature test specific to
this endpoint was found during this documentation pass.
