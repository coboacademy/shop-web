# Delete a Category Icon

Deletes the stored icon for a category and clears its icon path. If the
category has no icon, the category is still returned with `icon` and
`icon_url` set to `null`.

## Endpoint

| Property | Value |
|---|---|
| Method | `DELETE` |
| Path | `/api/admin/categories/{category}/icon` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` in the authenticated admin route
group. It does not declare category-specific permission middleware.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `category` | string | Yes | UUID of the category whose icon to delete. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

This request has no body.

## Example Request

```bash
curl -X DELETE "<API_BASE_URL>/api/admin/categories/<CATEGORY_ID>/icon" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL, `<CATEGORY_ID>` with the
category UUID, and `<YOUR_TOKEN>` with a valid Sanctum token.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Category icon deleted successfully.",
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
      "created_at": "2026-11-01T04:00:00.000000Z",
      "updated_at": "2026-11-01T04:30:00.000000Z"
    }
  }
}
```

The ID and timestamps are illustrative. `parent` and `children` are omitted
because those relationships are not loaded in this response.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.category.id` | Category UUID. |
| `data.category.parent_id` | Parent category UUID, or `null` for a root category. |
| `data.category.name` | Category name. |
| `data.category.slug` | Category slug. |
| `data.category.description` | Category description, or `null`. |
| `data.category.image` | Stored image path, or `null`. |
| `data.category.image_url` | Public URL for the image, or `null`. |
| `data.category.icon` | Stored icon path; `null` after this operation. |
| `data.category.icon_url` | Public icon URL; `null` after this operation. |
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

## Behavior Notes

- The stored icon is deleted from the public disk when present.
- The database `icon` path is cleared even if no icon path was set or the
  stored file was already absent.
- This endpoint does not affect the category image.
- The endpoint has no request body or query parameters.

## Implementation References

- `routes/api.php` — authenticated admin category-icon deletion route
- `CategoryController::deleteIcon` — operation and success response
- `CategoryService::deleteIcon` — category lookup, storage deletion, and path clearing
- `FileStorageService::delete` — public-disk file deletion
- `CategoryRepository::updateIcon` — persists the cleared icon path
- `CategoryResource` — icon path and URL serialization
- `bootstrap/app.php` — API authentication and not-found error responses
- `ApiResponse` — standardized success response

The route's authentication middleware was verified with
`php artisan route:list --path=admin/categories -v`. No feature test specific
to this endpoint was found during this documentation pass.
