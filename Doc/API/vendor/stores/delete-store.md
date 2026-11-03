# Delete a Vendor Store

Deletes a store belonging to the authenticated user's vendor profile.

## Endpoint

| Property | Value |
|---|---|
| Method | `DELETE` |
| Path | `/api/vendor/stores/{store}` |
| Authentication | Required; Sanctum bearer token |
| Response format | `application/json` |

The route is registered in `routes/api.php` and is protected by `auth:sanctum`.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `store` | UUID | Yes | ID of the store to delete. |

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
```

Replace `<YOUR_TOKEN>` with a valid Sanctum token.

## Example Request

```bash
curl -X DELETE "<API_BASE_URL>/api/vendor/stores/00000000-0000-4000-8000-000000000004" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Replace `<API_BASE_URL>` with the API base URL. The example store ID is illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Store deleted successfully.",
  "data": []
}
```

The endpoint returns a success message and no store resource.

## Error Responses

### 401 Unauthenticated

Returned when the request does not include a valid authenticated session or bearer token.

```json
{
  "status": "error",
  "message": "Unauthenticated."
}
```

### 404 Store Not Found

Returned when the store does not exist or does not belong to the authenticated user's vendor profile.

```json
{
  "status": "error",
  "message": "Resource not found."
}
```

### 404 Vendor Profile Not Found

If the authenticated user has no vendor profile, the service aborts with `404`. The API exception handler renders that abort with this response:

```json
{
  "status": "error",
  "message": "API route not found."
}
```

## Behavior Notes

- The service obtains the vendor profile from the authenticated user; the request cannot specify a vendor ID.
- The store lookup filters by both the requested store ID and the authenticated user's vendor ID. A store owned by another vendor is not deleted.
- Stores use Eloquent soft deletes. A successful deletion sets the store's `deleted_at` timestamp rather than immediately removing its database row. Soft-deleted stores are excluded from normal store lookups.
- The endpoint has no request body or query parameters.
- No endpoint-specific throttling middleware is defined on the route.

## Implementation References

This documentation is based on:

- `routes/api.php` — authenticated vendor store deletion route
- `StoreController::destroy` — request handling and response wrapper
- `StoreService::delete` — vendor profile lookup and ownership scoping
- `StoreRepository::delete` — model deletion
- `Store` — Eloquent soft-delete behavior
- `bootstrap/app.php` — API authentication and not-found error responses
