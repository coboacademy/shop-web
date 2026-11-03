# Get a Product File

Returns a product file stored on the application's public storage disk.

## Endpoint

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/api/files/products/{filename}` |
| Authentication | Not required |
| Successful response format | File response; content type is determined from the file |

This route is defined outside the authenticated route groups in `routes/api.php`. The `filename` route parameter accepts nested path segments.

## Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `filename` | string | Yes | Relative path to the file under the public storage disk's `products/` directory. The route accepts slashes in this value. |

For example, `catalog/item.jpg` maps to the storage path `products/catalog/item.jpg`.

## Example Request

```bash
curl -L -X GET "<API_BASE_URL>/api/files/products/catalog/item.jpg" \
  -o "item.jpg"
```

Replace `<API_BASE_URL>` with the API base URL. The example path and filename are illustrative.

## Successful Response

**HTTP status:** `200 OK`

The response body contains the file bytes rather than a JSON document. The file response sets the content type based on the file.

The route also returns these CORS headers on a successful file response:

| Header | Value |
|---|---|
| `Access-Control-Allow-Origin` | `*` |
| `Access-Control-Allow-Methods` | `GET, OPTIONS` |
| `Access-Control-Allow-Headers` | `*` |

## Error Responses

### 404 Not Found

Returned when the requested path does not exist on the public storage disk.

```json
{
  "status": "error",
  "message": "File not found."
}
```

## Behavior Notes

- The route checks for the requested path under the `products/` directory on the configured `public` storage disk.
- The endpoint is public and does not check a user's identity or permissions.
- The route's wildcard accepts nested paths; callers should URL-encode characters that have special meaning in URLs.
- The explicit CORS headers are set on successful file responses. The not-found JSON response does not set those headers in this route.

## Implementation References

This documentation is based on:

- `routes/api.php` — public file route, wildcard constraint, storage lookup, and response headers
- `config/filesystems.php` — public disk configuration
