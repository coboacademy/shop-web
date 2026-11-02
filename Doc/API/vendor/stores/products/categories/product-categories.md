# Get Categories Assigned to a Vendor Product

Returns the categories assigned to a product in a store belonging to the authenticated vendor, alphabetically by category name.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/vendor/stores/{store}/products/{product}/categories` |
| Authentication | Required; Sanctum bearer token |
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
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Example Request

```bash
curl -X GET "<API_BASE_URL>/api/vendor/stores/00000000-0000-4000-8000-000000000004/products/00000000-0000-4000-8000-000000000010/categories" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL. All example IDs, names, values, and timestamps are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Product categories retrieved successfully.",
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

If no categories are assigned to the product, `data.categories` is an empty array. The `parent` and `children` fields are omitted because those relationships are not loaded by this endpoint.

## Response Fields

| Field | Description |
|---|---|
| `status` | Indicates whether the request succeeded. |
| `message` | Response message. |
| `data.categories` | Categories assigned to the product. |
| `data.categories[].id` | Category UUID. |
| `data.categories[].parent_id` | Parent category UUID, or `null`. |
| `data.categories[].name` | Category name. |
| `data.categories[].slug` | Category slug. |
| `data.categories[].description` | Category description, or `null`. |
| `data.categories[].image` | Stored image path, or `null`. |
| `data.categories[].image_url` | Public image URL, or `null`. |
| `data.categories[].icon` | Stored icon path, or `null`. |
| `data.categories[].icon_url` | Public icon URL, or `null`. |
| `data.categories[].is_active` | Whether the category is active; inactive categories are not excluded by this query. |
| `data.categories[].created_at` | Category creation timestamp. |
| `data.categories[].updated_at` | Last category update timestamp. |

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

### Vendor Profile or Approval Error

The service throws a runtime exception if the user has no vendor profile or the vendor is not approved to manage product categories. The API exception handler returns `500`; its message is `Server error.` when debug mode is disabled. The exact message can differ when debug mode is enabled.

## Behavior Notes

- The service verifies the authenticated user's vendor profile and requires the vendor status to be approved.
- It verifies that the store belongs to the vendor and that the product belongs to the specified store.
- Categories are returned as a plain collection, ordered by name. The query does not filter inactive categories or paginate the results.
- The endpoint has no request body or query parameters, and no endpoint-specific throttling middleware is defined.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated product category-list route
- `ProductCategoryController::index` — request handling and response wrapper
- `ProductCategoryService::getCategories` and `getOwnedProduct` — category lookup and ownership/approval checks
- `CategoryResource` — category response fields
- `bootstrap/app.php` — API authentication and exception responses
