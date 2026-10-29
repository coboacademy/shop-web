# Vendor Product Management

This guide describes the vendor-facing product workflow currently implemented in the shop web application. It is intended to help project members understand how products are listed, created, edited, categorized, stocked, and configured with variants.

## Access and routes

The vendor product pages use the `vendor` layout and require authentication plus the `vendor.view` permission.

| Page | Route | Purpose |
| --- | --- | --- |
| Product list | `/vendor/products` | Browse products belonging to a selected vendor store. |
| Create product | `/vendor/products/create` | Create a product through a guided form. |
| Product details | `/vendor/products/:id` | View or edit product information, categories, images, and simple-product inventory. |
| Product variants | `/vendor/products/:id/variants` | Configure product options and manage variants. |
| Inventory management | `/vendor/inventories` | Review vendor inventory across products and manage stock. |

The product list passes the selected store as the `store_id` query parameter when navigating to create, details, or variants pages. Product details also accepts `mode=edit` to open the edit form.

## Product list

On entry, the page loads the vendor's stores, selects an available store if needed, and loads that store's products with pagination. The table shows product records and loads variant counts and inventory summaries for the displayed products.

From the list, a vendor can:

- Search the products currently loaded in the page and filter them by a status found in those products.
- Change the selected store and page size, or move between pages.
- Open product details, start editing, or open variant management.
- Activate or deactivate a product.
- Delete a product after confirming. The confirmation states that deletion cannot be undone.
- Start creating a product for the selected store.

Search and status filtering are performed against the products already loaded for the current page; they do not fetch all matching products from the server.

## Creating a product

The create page loads the vendor's stores and the vendor category tree. If a store was passed in the route and is still available, it is selected; otherwise, the first available store is used.

The guided form has three steps:

1. **Basic information** — enter a product name and description. Both are required.
2. **Product details** — enter a SKU, short description, and non-negative price. Compare-at price is optional and, when supplied, must be non-negative.
3. **Review** — review the entered information before submitting.

The form also lets the vendor choose whether to continue to product details or variant configuration after creation, and select categories. Categories are saved after the product is created. If that separate save fails, the product remains created and the page reports that categories were not saved.

After successful creation, the vendor is routed to either the product details page or the variants page. A product needs an available vendor store before it can be created.

## Product details and editing

The details page loads the product from an accessible vendor store. In edit mode, the vendor can update the product name, SKU, short and full descriptions, price, and optional compare-at price. Required text fields and prices are validated before saving.

The page also provides these product-management sections:

- **Status** — activate or deactivate the product.
- **Categories** — load the vendor category tree, select categories, and save the assignment. If the current assignments could not be determined, the page requires confirmation before replacing them.
- **Product images** — upload image files, select a primary image, and delete images.
- **Inventory** — create inventory for a simple product and review stock movements. Stock actions validate quantities; removal and adjustment require a reason.

For general inventory review and stock operations across vendor products, use the inventory management page.

## Options and variants

The variants page loads the product, its options, and its variants. Product options represent attributes such as size or color; each option can have values. The page supports creating, editing, and deleting options and values, as well as manually creating, editing, and deleting variants.

A variant includes its own SKU, price, optional compare-at price, active state, sort order, and selected option values. Variant creation initializes inventory with quantity `0` and a low-stock threshold of `5`.

The page can also preview and generate every not-yet-existing combination of option values. Generation is limited to 200 possible combinations. The preview skips combinations that already exist; generation reports failures and may have created some variants before stopping.

## Data and implementation

Product pages use the `useProduct` composable for product, category, image, variant, and inventory requests, and `useVendor` to load vendor stores. Product routes include:

- [`index.vue`](../../../app/pages/vendor/products/index.vue) — store-scoped product listing and actions.
- [`create.vue`](../../../app/pages/vendor/products/create.vue) — guided product creation.
- [`[id]/index.vue`](../../../app/pages/vendor/products/%5Bid%5D/index.vue) — product details, editing, categories, images, and inventory.
- [`[id]/variants.vue`](../../../app/pages/vendor/products/%5Bid%5D/variants.vue) — options and variant management.

Supporting product UI is in [`app/components/vendor/products`](../../../app/components/vendor/products), and shared request methods and product types are in [`useProduct.ts`](../../../app/composables/useProduct.ts). The vendor-wide inventory page is [`index.vue`](../../../app/pages/vendor/inventories/index.vue).

## When investigating a product-management issue

Record the affected store and product, the page and action involved, and the expected versus actual result. For failures, include the visible error message and whether the product, category assignment, image, variant, or stock change was already saved. This distinction matters because some workflows involve separate requests—for example, product creation and category assignment.
