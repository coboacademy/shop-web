# Get the Category Tree

Returns the product categories as a nested tree for authenticated vendor API clients.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/vendor/categories/tree` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` inside the `auth:sanctum` vendor route group.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/vendor/categories/tree" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL. All example IDs, names, values, and timestamps are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Category tree retrieved successfully.",
  "data": {
    "categories": [
      {
        "id": "00000000-0000-4000-8000-000000000040",
        "parent_id": null,
        "name": "Example Category",
        "slug": "example-category",
        "description": "Illustrative category description.",
        "image": null,
        "image_url": null,
        "icon": null,
        "icon_url": null,
        "is_active": true,
        "children": [
          {
            "id": "00000000-0000-4000-8000-000000000041",
            "parent_id": "00000000-0000-4000-8000-000000000040",
            "name": "Example Subcategory",
            "slug": "example-subcategory",
            "description": null,
            "image": null,
            "image_url": null,
            "icon": null,
            "icon_url": null,
            "is_active": true,
            "children": [],
            "created_at": "2026-10-31T02:55:00.000000Z",
            "updated_at": "2026-10-31T02:55:00.000000Z"
          }
        ],
        "created_at": "2026-10-31T02:50:00.000000Z",
        "updated_at": "2026-10-31T02:50:00.000000Z"
      }
    ]
  }
}
```

If there are no root categories, `data.categories` is an empty array. The `parent` field is omitted because parent relations are not loaded by this query. `children` recursively contains descendant categories.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.categories` | Root categories, each with its recursively nested children. |
| `data.categories[].id` | Category UUID. |
| `data.categories[].parent_id` | Parent category UUID, or `null` for a root. |
| `data.categories[].name` | Category name. |
| `data.categories[].slug` | Category slug. |
| `data.categories[].description` | Category description, or `null`. |
| `data.categories[].image` | Stored image path, or `null`. |
| `data.categories[].image_url` | Public image URL, or `null`. |
| `data.categories[].icon` | Stored icon path, or `null`. |
| `data.categories[].icon_url` | Public icon URL, or `null`. |
| `data.categories[].is_active` | Whether the category is active. The tree query does not filter by this value. |
| `data.categories[].children` | Child categories in alphabetical name order, recursively nested. |
| `data.categories[].created_at` | Category creation timestamp. |
| `data.categories[].updated_at` | Last category update timestamp. |

Child categories contain the same resource fields. `parent` is omitted unless a category's parent relation has been loaded.

## Error Responses

### 401 Unauthenticated

Returned when the request does not include a valid authenticated session or bearer token.

```json
{
  "status": "error",
  "message": "Unauthenticated."
}
```

## Behavior Notes

- The route requires authentication but does not scope categories to a specific vendor.
- The query retrieves root categories (`parent_id` is `null`) and recursively loads descendants.
- Root categories and children are ordered alphabetically by name.
- The query does not filter inactive categories.
- The result is not paginated and has no query parameters or request body.
- No endpoint-specific throttling middleware is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated category tree route
- `ProductCategoryController::categoryTree` — response wrapper
- `CategoryService::getTree` — category tree service
- `CategoryRepository::getRootCategories` — root lookup and ordering
- `Category::childrenRecursive` — recursive child relation and ordering
- `CategoryResource` — category response fields
- `bootstrap/app.php` — API authentication response
