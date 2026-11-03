# Delete a Vendor Store Product Image

Deletes an image belonging to a product in a store managed by the authenticated vendor.

## Endpoint

| Property | Value |
|---|---|
| Method | `DELETE` |
| Path | `/api/vendor/stores/{store}/products/{product}/images/{image}` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `store` | UUID | Yes | ID of the vendor's store. |
| `product` | UUID | Yes | ID of the product in that store. |
| `image` | UUID | Yes | ID of the image to delete from the product. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Example Request

```bash
curl -X DELETE "<API_BASE_URL>/api/vendor/stores/00000000-0000-4000-8000-000000000004/products/00000000-0000-4000-8000-000000000010/images/00000000-0000-4000-8000-000000000020" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL. The example IDs are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Product image deleted successfully.",
  "data": []
}
```

The endpoint returns a success message and no image resource.

## Error Responses

### 401 Unauthenticated

Returned when the request does not include a valid authenticated session or bearer token.

```json
{
  "status": "error",
  "message": "Unauthenticated."
}
```

### 404 Store, Product, or Image Not Found

Returned when the store is not owned by the authenticated vendor, the product does not belong to the specified store, or the image does not belong to the specified product.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

### Vendor Profile or Approval Error

The service throws a runtime exception if the user has no vendor profile or the vendor is not approved to manage product images. The API exception handler returns `500`; its message is `Server error.` when debug mode is disabled. The exact message can differ when debug mode is enabled.

## Behavior Notes

- The service verifies the authenticated user's vendor profile and requires the vendor status to be approved.
- It verifies that the store belongs to the vendor, the product belongs to the store, and the image belongs to the product.
- The service attempts to delete the image file from the `public` storage disk and then deletes the image record from the database. Product image records do not use soft deletes.
- If the deleted image was primary, the first remaining image ordered by `sort_order` and then `created_at` is promoted to primary. If no images remain, no replacement primary image is set.
- The endpoint has no request body or query parameters, and no endpoint-specific throttling middleware is defined.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated product image deletion route
- `ProductImageController::destroy` — request handling and response wrapper
- `ProductImageService::delete` and `getOwnedProduct` — authorization, file cleanup, and primary-image promotion
- `ProductImageRepository` — image ownership lookup, ordered listing, and record deletion
- `FileStorageService::delete` — public-disk file deletion behavior
- `ProductImage` — image record model
- `bootstrap/app.php` — API authentication and exception responses
