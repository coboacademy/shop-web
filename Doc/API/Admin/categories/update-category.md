# Update an Admin Category

Updates the supplied fields of a category. If the name changes, the API
generates a new unique slug.

## Endpoint

| Property | Value |
|---|---|
| Method | `PATCH` |
| Path | `/api/admin/categories/{category}` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` in the authenticated admin route
group. It does not declare category-specific permission middleware.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `category` | string | Yes | UUID of the category to update. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json
```

## Request Body

All body fields are optional. Send only fields to change.

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `name` | string | No | 2–150 characters when provided. | New category name. If changed, the slug is regenerated. |
| `parent_id` | UUID or `null` | No | Must identify an existing category when non-null. | New parent category. Set to `null` to move the category to the root. |
| `description` | string or `null` | No | Must be a string when non-null. | New category description. |
| `is_active` | boolean | No | Must be a boolean when provided. | Whether the category is active. |

The request does not accept `slug`, `image`, or `icon`.

## Example Request

```bash
curl -X PATCH "<API_BASE_URL>/api/admin/categories/<CATEGORY_ID>" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Coffee and Tea",
    "description": "Coffee, tea, and related drinks.",
    "is_active": true
  }'
```

Replace `<API_BASE_URL>` with the API base URL, `<CATEGORY_ID>` with the
category UUID, and `<YOUR_TOKEN>` with a valid Sanctum token. Example values
are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Category updated successfully.",
  "data": {
    "category": {
      "id": "00000000-0000-4000-8000-000000000001",
      "parent_id": null,
      "name": "Coffee and Tea",
      "slug": "coffee-and-tea",
      "description": "Coffee, tea, and related drinks.",
      "image": null,
      "image_url": null,
      "icon": null,
      "icon_url": null,
      "is_active": true,
      "created_at": "2026-11-01T04:00:00.000000Z",
      "updated_at": "2026-11-01T04:10:00.000000Z"
    }
  }
}
```

The ID and timestamps are illustrative. `parent` and `children` are omitted
because those relationships are not loaded in the update response.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.category.id` | Updated category UUID. |
| `data.category.parent_id` | Parent category UUID, or `null` for a root category. |
| `data.category.name` | Category name. |
| `data.category.slug` | Category slug; regenerated when the name changes. |
| `data.category.description` | Category description, or `null`. |
| `data.category.image` | Stored image path, or `null`. |
| `data.category.image_url` | Public URL for the image, or `null`. |
| `data.category.icon` | Stored icon path, or `null`. |
| `data.category.icon_url` | Public URL for the icon, or `null`. |
| `data.category.is_active` | Whether the category is active. |
| `data.category.created_at` | Category creation timestamp. |
| `data.category.updated_at` | Last category update timestamp. |

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

### 422 Unprocessable Content

Returned when a supplied field fails validation, such as a `name` outside
2–150 characters, or a `parent_id` that is not a UUID for an existing
category, or a non-boolean `is_active`.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "name": [
      "The name field must be at least 2 characters."
    ]
  }
}
```

## Behavior Notes

- Partial updates are supported; omitted fields remain unchanged.
- Setting `parent_id` to `null` moves the category to the root.
- The service prevents assigning the category as its own parent and moving it
  beneath one of its descendants. These hierarchy violations throw a runtime
  exception and are handled by the general API exception renderer as a server
  error; the response message depends on the application's debug setting.
- Changing `name` regenerates a unique slug. The slug stays unchanged when the
  name is omitted or unchanged.
- A successful response contains the updated resource without loaded `parent`
  or `children` relationships.

## Implementation References

- `routes/api.php` — authenticated admin category-update route
- `CategoryController::update` — validated input and success response
- `UpdateCategoryRequest` — accepted fields and validation rules
- `CategoryService::update` — parent hierarchy checks and slug update
- `CategoryService::validateParentChange` — self-parent and cycle prevention
- `CategoryRepository::update` — persistence and model refresh
- `CategoryResource` — serialized category fields
- `bootstrap/app.php` — API authentication, validation, not-found, and server-error responses
- `ApiResponse` — standardized success response

The route's authentication middleware was verified with
`php artisan route:list --path=admin/categories -v`. No feature test specific
to this endpoint was found during this documentation pass.
