# Delete an Admin Category

Soft-deletes a category. A category cannot be deleted while it has any
non-deleted child categories.

## Endpoint

| Property | Value |
|---|---|
| Method | `DELETE` |
| Path | `/api/admin/categories/{category}` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` in the authenticated admin route
group. It does not declare category-specific permission middleware.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `category` | string | Yes | UUID of the category to delete. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

## Example Request

```bash
curl -X DELETE "<API_BASE_URL>/api/admin/categories/<CATEGORY_ID>" \
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
  "message": "Category deleted successfully.",
  "data": []
}
```

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

### 500 Server Error

Returned if the category has non-deleted child categories. The service throws
a runtime exception for this condition, and the general API exception handler
returns a `500` response. The message depends on the application's debug
setting.

```json
{
  "status": "error",
  "message": "Server error."
}
```

## Behavior Notes

- Deletion is a soft delete; the category row is retained with its
  `deleted_at` timestamp set.
- The service blocks deletion when the category has any non-deleted direct
  child categories. Delete or reassign those children first.
- The endpoint has no request body or query parameters.

## Implementation References

- `routes/api.php` — authenticated admin category-delete route
- `CategoryController::destroy` — delete operation and success response
- `CategoryService::delete` — category lookup and child-category restriction
- `CategoryRepository::hasChildren` — direct-child existence check
- `CategoryRepository::delete` — model soft delete
- `Category` — `SoftDeletes` model trait
- `bootstrap/app.php` — API authentication, not-found, and server-error responses
- `ApiResponse` — standardized success response

The route's authentication middleware was verified with
`php artisan route:list --path=admin/categories -v`. No feature test specific
to this endpoint was found during this documentation pass.
