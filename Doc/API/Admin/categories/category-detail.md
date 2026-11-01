# Get an Admin Category

Returns one category, including its loaded parent and recursively nested
children.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/admin/categories/{category}` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` in the authenticated admin route
group. It does not declare category-specific permission middleware.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `category` | string | Yes | UUID of the category to retrieve. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/admin/categories/<CATEGORY_ID>" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL, `<CATEGORY_ID>` with a category
UUID, and `<YOUR_TOKEN>` with a valid Sanctum token.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Category retrieved successfully.",
  "data": {
    "category": {
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
  }
}
```

The IDs, names, and timestamps are illustrative. For categories with a parent,
`parent` contains that parent's category resource fields. That nested parent
resource does not itself include `parent` or `children`, because those
relationships are not loaded for it.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.category` | Requested category resource. |
| `data.category.id` | Category UUID. |
| `data.category.parent_id` | Parent category UUID, or `null` for a root category. |
| `data.category.name` | Category name. |
| `data.category.slug` | Category slug. |
| `data.category.description` | Category description, or `null`. |
| `data.category.image` | Stored image path, or `null`. |
| `data.category.image_url` | Public URL for the image, or `null`. |
| `data.category.icon` | Stored icon path, or `null`. |
| `data.category.icon_url` | Public URL for the icon, or `null`. |
| `data.category.is_active` | Whether the category is active. |
| `data.category.parent` | Loaded parent category resource, or `null` for a root category. |
| `data.category.children` | Direct children with their descendants recursively nested. |
| `data.category.created_at` | Category creation timestamp. |
| `data.category.updated_at` | Last category update timestamp. |

The category fields repeat for each child. In nested child resources, `parent`
is omitted because that relation is not loaded.

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

- The category lookup uses its UUID and excludes soft-deleted categories.
- The requested category's parent is loaded one level deep.
- Children are loaded recursively and ordered alphabetically by name at each
  level.
- The endpoint does not filter categories by `is_active`.
- The endpoint has no query parameters.

## Implementation References

- `routes/api.php` — authenticated admin category-detail route
- `CategoryController::show` — category lookup, relationship loading, and response
- `CategoryService::getCategory` — category lookup delegation
- `CategoryRepository::findByIdOrFail` — UUID lookup
- `Category::childrenRecursive` — recursive child relation and ordering
- `CategoryResource` — serialized category fields and loaded relationships
- `bootstrap/app.php` — API authentication and not-found error responses
- `ApiResponse` — standardized success response

The route's authentication middleware was verified with
`php artisan route:list --path=admin/categories -v`. No feature test specific
to this endpoint was found during this documentation pass.
