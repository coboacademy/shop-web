# Delete a Vendor Store Product

Deletes a product in a store belonging to the authenticated user's vendor profile.

## Endpoint

| Property | Value |
|---|---|
| Method | `DELETE` |
| Path | `/api/vendor/stores/{store}/products/{product}` |
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
curl -X DELETE "<API_BASE_URL>/api/vendor/stores/00000000-0000-4000-8000-000000000004/products/00000000-0000-4000-8000-000000000010" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL. The example IDs are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Product deleted successfully.",
  "data": []
}
```

The endpoint returns a success message and no product resource.

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

Returned when the store does not exist or is not owned by the authenticated user's vendor profile, or when the product does not exist in the specified store.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

### Vendor Profile Missing

The service throws a runtime exception if the authenticated user has no vendor profile. The API exception handler returns `500`; its message is `Server error.` when debug mode is disabled. The exact message can differ when debug mode is enabled.

## Behavior Notes

- The service obtains the vendor profile from the authenticated user; the request cannot specify a vendor ID.
- The store is checked against the authenticated user's vendor ID, and the product is separately checked against the specified store ID.
- Products use Eloquent soft deletes. A successful deletion sets the product's `deleted_at` timestamp rather than immediately removing its database row. Soft-deleted products are excluded from normal product lookups.
- The endpoint has no request body or query parameters.
- No endpoint-specific throttling middleware is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated vendor product deletion route
- `ProductController::destroy` — request handling and response wrapper
- `ProductService::delete` — vendor/store/product ownership checks
- `ProductRepository::delete` — model deletion
- `Product` — Eloquent soft-delete behavior
- `bootstrap/app.php` — API authentication and exception responses
