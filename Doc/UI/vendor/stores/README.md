# Vendor Store Management

This guide describes the vendor-facing store workflow currently implemented in the shop web application. Use it to understand how store records are listed, created, updated, activated, deactivated, deleted, and branded with logo and cover images.

## Access and routes

Both store pages use the `vendor` layout and require authentication plus the `vendor.view` permission.

| Page | Route | Purpose |
| --- | --- | --- |
| Store management | `/vendor/stores` | Browse and manage stores connected to the vendor account. |
| Store details | `/vendor/stores/:id` | View a store, update its editable profile fields, and manage its logo and cover. |

The detail page also accepts `?edit=1` to open the profile editor after the store loads. Use the **Store management** link to return to the list.

## Store list

On entry, the page fetches the vendor's stores and shows total, active, and inactive counts. Each row displays the store name and slug, contact email and phone, location, status, and actions.

Search matches name, slug, email, phone, city, province, and country. Search and status filters are applied in the browser to the store collection already loaded; changing a filter does not make another API request. **Reset** clears both filters.

From the list, a vendor can:

- Open store details using the view action.
- Edit a store's name, phone, and description in a modal.
- Activate an inactive store or deactivate an active store after confirmation. The returned store replaces the row locally.
- Delete a store after confirmation. Deletion is described as irreversible; after success, the row is removed locally.
- Create a store using **Add new store**. The form requires a name, contact email, phone, description, country, province/state, city, and street address. After successful creation, the page reloads the list.
- Reload the collection using **Refresh**.

Creation and edit errors can include field-level validation messages from the API. General failures are shown in an alert or toast. A failed list request is shown above the table.

## Store details and profile editing

The detail page loads the store identified by the route parameter. It displays the store ID, slug, active state, contact information, full location, description, and created/updated timestamps. **Refresh** reloads this data.

The profile editor can be opened from **Edit store** or by using `?edit=1`. Only the store name, contact phone, and description are editable on this page. Contact email and address/location are displayed but are not included in the update payload. Saving sends the changes and replaces the displayed store with the API response; validation errors are attached to the relevant fields.

## Logo and cover images

The detail page has separate controls for the logo and cover:

- A logo represents the store in a square display. A cover is shown in a wide header display.
- Both upload controls accept PNG, JPG, and WEBP files.
- Uploading or changing an image sends the selected file to its own endpoint. On success, the returned store refreshes the displayed image.
- Deleting an existing logo or cover requires confirmation. These operations are independent of profile editing.

The API response may provide a full image URL or a storage-relative path. The detail page currently resolves relative logo and cover paths against `http://127.0.0.1:8000/storage/`; check the configured backend/storage URL if a relative-path image does not load in another environment.

## Request and data flow

The pages use `useVendor` from [`useVendor.ts`](../../../app/composables/useVendor.ts). Store responses use the shape `data.store`; list responses use `data.stores`.

| Operation | Request |
| --- | --- |
| List stores | `GET /vendor/stores` |
| Get store details | `GET /vendor/stores/:id` |
| Create store | `POST /vendor/stores` |
| Update name, phone, or description | `PATCH /vendor/stores/:id` |
| Activate | `PATCH /vendor/stores/:id/activate` |
| Deactivate | `PATCH /vendor/stores/:id/deactivate` |
| Delete store | `DELETE /vendor/stores/:id` |
| Upload logo (`logo` multipart field) | `POST /vendor/stores/:id/logo` |
| Delete logo | `DELETE /vendor/stores/:id/logo` |
| Upload cover (`cover` multipart field) | `POST /vendor/stores/:id/cover` |
| Delete cover | `DELETE /vendor/stores/:id/cover` |

## Implementation references

- [`index.vue`](../../../app/pages/vendor/stores/index.vue) — store list, search/filter, create, status actions, and deletion.
- [`[id].vue`](../../../app/pages/vendor/stores/%5Bid%5D.vue) — store details, profile editing, and image management.
- [`EditStoreModal.vue`](../../../app/components/vendor/EditStoreModal.vue) — list-page profile editor.
- [`useVendor.ts`](../../../app/composables/useVendor.ts) — store types and API methods.

## When investigating a store issue

Record the store ID, route, action, and expected versus actual result. Include the visible error message and whether the operation was create/update/status/delete or logo/cover management. For media display issues, note whether the API returned a full URL or a relative storage path and which page failed to render it.
