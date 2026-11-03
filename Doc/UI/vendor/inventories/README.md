# Vendor Inventory Management

This guide explains the vendor inventory page: how to find inventory records, interpret stock levels, make stock changes, and review the movement history.

## Access and route

The page is available at `/vendor/inventories`. It uses the `vendor` layout and requires authentication plus the `vendor.view` permission.

The page loads the stores available to the vendor, then loads inventory records. Records are limited in the UI to products associated with those stores. The store selector can narrow the results to one store or show all vendor stores.

The page can open a stock-status view directly with either `/vendor/inventories?status=low-stock` or `/vendor/inventories?status=out-of-stock`. Other query values start in the **All items** view.

## Find and understand inventory

Each row represents one inventory record: either a simple product or a product variant. The table shows product name, SKU, record type, total quantity, reserved quantity, available quantity, status, last-updated date, and actions.

Use the page controls to:

- Search by product name, inventory SKU, or product SKU.
- Select one vendor store or **All my stores**.
- Choose **All items**, **Simple products**, **Variants**, **Low stock**, or **Out of stock**.
- Choose 15, 30, 50, or 100 rows per page where the page-size selector is shown.
- Refresh the stores and inventory data.

Available quantity and the low/out-of-stock status are supplied by the inventory API. The page does not calculate the low-stock threshold itself; each row displays the threshold returned by the API.

The all/simple/variant views request one server-paginated page at a time (15 rows initially). Search, store selection, and product type filtering are applied to the records loaded on that page. Low-stock and out-of-stock views instead fetch their status result set, then apply search, store, and paging in the browser. The summary cards count the scoped records currently loaded, except the unfiltered **All items** total, which uses the server-reported total when available.

## Manage stock

Select **Manage stock** on a row to open the stock form. It shows the current total, reserved, and available quantities, and offers three operations:

| Operation | Quantity means | Validation |
| --- | --- | --- |
| Add stock | Units to add to the current total. | Positive whole number. Reason optional. |
| Remove stock | Units to subtract from the current total. | Positive whole number. Reason required. |
| Adjust stock | New total after a physical count. | Whole number that is not below reserved stock. Reason optional. |

The reason is trimmed before sending. Save submits the change for the simple product or the selected variant. On success, the page shows a success message, closes the form, and reloads the current inventory view. On failure, it keeps the form open and displays the request error. Cancel closes the form unless a save is in progress.

The UI validates positive/non-negative whole-number inputs and prevents an adjustment below the record's reserved quantity. Other business rules, such as whether a removal exceeds stock on hand, are enforced by the API and may be reported as a save error.

This page changes stock on existing inventory records; it does not create or delete inventory records. Inventory setup for a simple product is available from the product details page; variant inventory is initialized during variant creation. See the [product management guide](../products/README.md).

## Review stock movement history

Select **History** on a row to load its movements. The history shows movement type, reason, creator when available, timestamp, before and after quantities, and the reported quantity change. An empty history displays a no-movements message; request failures appear in the dialog.

For simple products, the page loads the product's movement list and keeps only movements matching that inventory record's ID. For variants, it requests movements for the specific product and variant.

## Request and data flow

The page uses [`useVendor.ts`](../../../app/composables/useVendor.ts) to load vendor stores and [`useProduct.ts`](../../../app/composables/useProduct.ts) for inventory requests and types. List responses use `data.inventories` and may include `data.pagination`; stock-change responses use `data.inventory`; movement responses use `data.movements`.

| Operation | Request |
| --- | --- |
| Load vendor stores | `GET /vendor/stores` |
| List inventory | `GET /vendor/inventories?page=…&per_page=…` |
| List low-stock inventory | `GET /vendor/inventories/low-stock` |
| List out-of-stock inventory | `GET /vendor/inventories/out-of-stock` |
| Add/remove simple-product stock | `POST /vendor/products/:productId/inventory/add-stock` or `/remove-stock` |
| Adjust simple-product stock | `POST /vendor/products/:productId/inventory/adjust-stock` |
| Add/remove variant stock | `POST /vendor/products/:productId/variants/:variantId/inventory/add-stock` or `/remove-stock` |
| Adjust variant stock | `PATCH /vendor/products/:productId/variants/:variantId/inventory/adjust-stock` |
| Read simple-product movements | `GET /vendor/products/:productId/inventory/movements` |
| Read variant movements | `GET /vendor/products/:productId/variants/:variantId/inventory/movements` |

Stock requests send `{ quantity, reason? }`. The `quantity` is the amount to add/remove, but is the desired new total for an adjustment.

## Implementation references

- [`index.vue`](../../../app/pages/vendor/inventories/index.vue) — store loading, filters, stock operations, and movement history.
- [`useProduct.ts`](../../../app/composables/useProduct.ts) — inventory and movement types and API methods.
- [`useVendor.ts`](../../../app/composables/useVendor.ts) — vendor store loading.
- [`products/README.md`](../products/README.md) — product creation, product details, variants, and inventory setup.

## When investigating an inventory issue

Record the store, product, inventory record, and variant (if applicable), along with the active view and operation. Include the entered quantity and reason, the visible error, and the expected versus actual total, reserved, and available quantities. For history issues, note whether the row is a simple product or variant and whether the history request failed or returned no movements.
