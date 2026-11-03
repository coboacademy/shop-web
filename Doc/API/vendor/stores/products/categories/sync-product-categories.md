# Update Categories Assigned to a Vendor Product

Replaces the category assignments for a product in a store belonging to the authenticated vendor.

## Endpoint

| Property | Value |
|---|---|
| Method | `PUT` |
| Path | `/api/vendor/stores/{store}/products/{product}/categories` |
| Authentication | Required; Sanctum bearer token |
| Content-Type | `application/json` |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `store` | UUID | Yes | ID of the vendor's store. |
| `product` | UUID | Yes | ID of the product in that store. |

## Request Headers

```http
Accept: application/json
Content-Type: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Request Body

| Field | Type | Required | Validation Rules |
|---|---|---|---|
| `category_ids` | array of UUIDs | Yes | Must contain at least one entry. |
| `category_ids[]` | UUID | Yes | Each ID must exist in `categories` and be distinct within the array. |

The submitted array replaces the product's existing category assignments; categories not included are detached.

## Example Request

```bash
curl -X PUT "<API_BASE_URL>/api/vendor/stores/00000000-0000-4000-8000-000000000004/products/00000000-0000-4000-8000-000000000010/categories" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "category_ids": [
      "00000000-0000-4000-8000-000000000040",
      "00000000-0000-4000-8000-000000000041"
    ]
  }'
```

Replace `<API_BASE_URL>` with the API base URL. All example IDs, names, values, and timestamps are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Product categories updated successfully.",
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
        "created_at": "2026-10-31T03:00:00.000000Z",
        "updated_at": "2026-10-31T03:00:00.000000Z"
      }
    ]
  }
}
```

The returned categories are ordered alphabetically by name. `parent` and `children` are omitted because those relationships are not loaded by this response query.

## Error Responses

### 401 Unauthenticated

Returned when the request does not include a valid authenticated session or bearer token.

```json
{
  "status": "error",
  "message": "Unauthenticated."
}
```

### 404 Store or Product Not Found

Returned when the store is not owned by the authenticated vendor, or when the product does not belong to the specified store.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

### 422 Unprocessable Content

Returned when `category_ids` is missing, is not an array with at least one item, or contains an invalid, duplicate, or nonexistent category ID.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "category_ids": [
      "The category ids field is required."
    ]
  }
}
```

### Vendor Profile or Approval Error

The service throws a runtime exception if the user has no vendor profile or the vendor is not approved to manage product categories. The API exception handler returns `500`; its message is `Server error.` when debug mode is disabled. The exact message can differ when debug mode is enabled.

## Behavior Notes

- The service verifies the authenticated user's vendor profile and requires the vendor status to be approved.
- It verifies that the store belongs to the vendor and that the product belongs to the specified store.
- Category IDs must exist, but the request does not require the categories to be active.
- The request requires at least one category, so this endpoint cannot be used to remove every category assignment with an empty array.
- The endpoint has no query parameters and no endpoint-specific throttling middleware.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated product category-sync route
- `ProductCategoryController::sync` — request handling and response wrapper
- `SyncProductCategoriesRequest` — category ID validation
- `ProductCategoryService::sync` and `getOwnedProduct` — category synchronization and vendor/product ownership checks
- `CategoryResource` — response fields
- `bootstrap/app.php` — API validation, authentication, and exception responses
