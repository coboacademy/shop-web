# Reorder Menus

Updates the sort order and optional parent of each menu supplied in the request.

## Endpoint

| Property | Value |
|---|---|
| Method | `PATCH` |
| Path | `/api/menus/reorder` |
| Authentication | Required; Sanctum bearer token with `menu.update` permission |
| Response format | `application/json` |

The route is registered in `routes/api.php` in the protected app route group and uses the `permission:menu.update` middleware.

## Request Headers

```http
Accept: application/json
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json
```

Replace `<YOUR_TOKEN>` with a valid token for a user authorized to update menus.

## Request Body

```json
{
  "menus": [
    {
      "id": 1,
      "sort_order": 0,
      "parent_id": null
    },
    {
      "id": 2,
      "sort_order": 1,
      "parent_id": 1
    }
  ]
}
```

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `menus` | array | Yes | Must be an array; an empty array is allowed | Menu ordering updates to apply. |
| `menus[].id` | integer | Yes | Must identify an existing menu | Menu to update. |
| `menus[].sort_order` | integer | Yes | Minimum `0` | New sort order. |
| `menus[].parent_id` | integer or `null` | No | If non-null, must identify an existing menu | New parent menu ID. If omitted or `null`, the menu is made a root menu. |

## Example Request

```bash
curl -X PATCH "<API_BASE_URL>/api/menus/reorder" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "menus": [
      {
        "id": 1,
        "sort_order": 0,
        "parent_id": null
      },
      {
        "id": 2,
        "sort_order": 1,
        "parent_id": 1
      }
    ]
  }'
```

Replace `<API_BASE_URL>` with the API base URL and `<YOUR_TOKEN>` with a valid token. All example IDs are illustrative.

## Successful Response

**HTTP status:** `200 OK`

```json
{
  "status": "success",
  "message": "Menu order updated successfully"
}
```

The response does not include a `data` property.

## Error Responses

### 401 Unauthenticated

Returned when the request does not include a valid authenticated session or bearer token.

```json
{
  "status": "error",
  "message": "Unauthenticated."
}
```

### 403 Forbidden

Returned when the authenticated user does not have the `menu.update` permission.

```json
{
  "status": "error",
  "message": "You do not have the required permission."
}
```

### 422 Unprocessable Entity

Returned when `menus` is missing or not an array, an item omits a required field, a field has an invalid type or value, or an ID does not exist.

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "menus.0.sort_order": [
      "The menus.0.sort_order field is required."
    ]
  }
}
```

## Behavior Notes

- Each supplied menu is updated within a database transaction.
- Only `sort_order` and `parent_id` are changed; the endpoint does not update labels, routes, or active status.
- If `parent_id` is omitted, the service writes `null`, moving that menu to the root level.
- The service processes each item in order. The request does not enforce unique IDs, unique sort-order values, or prevent circular parent relationships.
- The endpoint returns success even when `menus` is an empty array; no menu records are changed in that case.
- No endpoint-specific throttling or rate-limit metadata was identified in the inspected source.

## Implementation References

This documentation is based on:

- `routes/api.php` — menu reorder route and `menu.update` middleware
- `ReorderMenusRequest` — payload validation and authorization
- `MenuController::reorder` — request handling and response wrapper
- `MenuService::reorder` — transactional updates to menu sort order and parent
- `bootstrap/app.php` — API authentication and validation error formatting
