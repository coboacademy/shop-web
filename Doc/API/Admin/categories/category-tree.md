# Get the Admin Category Tree

Returns all root categories and their nested descendants as a recursively nested
tree. Each level is ordered alphabetically by category name.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/admin/categories/tree` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` in the authenticated admin route
group. It does not declare category-specific permission middleware.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/admin/categories/tree" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid
Sanctum token.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Category tree retrieved successfully.",
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
        "children": [
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
            "children": [],
            "created_at": "2026-11-01T04:00:00.000000Z",
            "updated_at": "2026-11-01T04:00:00.000000Z"
          }
        ],
        "created_at": "2026-11-01T04:00:00.000000Z",
        "updated_at": "2026-11-01T04:00:00.000000Z"
      }
    ]
  }
}
```

The IDs, names, and timestamps are illustrative. `image_url` and `icon_url` are
generated public-disk URLs when their corresponding stored paths are present;
otherwise those URL fields are `null`.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.categories` | Root category resources. |
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
| `data.categories[].children` | Child category resources, recursively including their descendants. |
| `data.categories[].created_at` | Category creation timestamp. |
| `data.categories[].updated_at` | Last category update timestamp. |

The same category fields are returned recursively for each child.

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

- Returns only root categories (`parent_id` is `null`) at the top level.
- Includes descendants recursively; siblings are ordered by name at each level.
- The query does not filter by `is_active`, so inactive categories may appear.
- Soft-deleted categories are excluded by the model's default soft-delete scope.
- The endpoint has no query parameters and does not paginate the tree.

## Implementation References

- `routes/api.php` — authenticated admin category-tree route
- `CategoryController::tree` — success response
- `CategoryService::getTree` — tree service method
- `CategoryRepository::getRootCategories` — root selection, recursive eager loading, and ordering
- `CategoryResource` — serialized category fields
- `bootstrap/app.php` — API authentication error response
- `ApiResponse` — standardized success response

The route's authentication middleware was verified with
`php artisan route:list --path=admin/categories/tree -v`. No feature test
specific to this endpoint was found during this documentation pass.
