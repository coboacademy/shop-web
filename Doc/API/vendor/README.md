# Vendor API

Vendor endpoint references are grouped by resource:

- [`profile/`](./profile/) — [get](./profile/get-profile.md) and
  [update](./profile/update-profile.md) the vendor profile.
- [`kyc/`](./kyc/) — [submit](./kyc/submit-kyc.md) and
  [update](./kyc/update-kyc.md) business verification details.
- [`stores/`](./stores/) — [create](./stores/create-store.md),
  [list](./stores/list-stores.md), [view](./stores/store-detail.md),
  [update](./stores/update-store.md), [delete](./stores/delete-store.md),
  [activate](./stores/activate-store.md), and
  [deactivate](./stores/deactivate-store.md) stores.
  - [`media/`](./stores/media/) — [upload](./stores/media/upload-store-logo.md)
    or [delete](./stores/media/delete-store-logo.md) a logo; [upload](./stores/media/upload-store-cover.md)
    or [delete](./stores/media/delete-store-cover.md) a cover.
  - [`products/`](./stores/products/) — [create](./stores/products/create-store-product.md),
    [list](./stores/products/list-store-products.md),
    [view](./stores/products/store-product-detail.md),
    [update](./stores/products/update-store-product.md),
    [delete](./stores/products/delete-store-product.md),
    [activate](./stores/products/activate-store-product.md), and
    [deactivate](./stores/products/deactivate-store-product.md) store products.
    - [`images/`](./stores/products/images/) — [list](./stores/products/images/list-product-images.md),
      [upload](./stores/products/images/upload-product-image.md),
      [delete](./stores/products/images/delete-product-image.md), and
      [set primary](./stores/products/images/set-primary-product-image.md)
      product images.
    - [`categories/`](./stores/products/categories/) —
      [view](./stores/products/categories/product-categories.md) and
      [sync](./stores/products/categories/sync-product-categories.md) product
      categories.
- [`products/`](./products/) — product-level vendor operations.
  - [`inventory/`](./products/inventory/) — [create](./products/inventory/create-product-inventory.md),
    [get](./products/inventory/get-product-inventory.md),
    [update](./products/inventory/update-product-inventory.md), and
    [list](./products/inventory/list-inventory.md) inventory; view
    [low-stock](./products/inventory/low-stock-inventory.md) and
    [out-of-stock](./products/inventory/out-of-stock-inventory.md) items;
    [add](./products/inventory/add-product-stock.md),
    [remove](./products/inventory/remove-product-stock.md), or
    [adjust](./products/inventory/adjust-product-stock.md) stock; and view
    [inventory movements](./products/inventory/product-inventory-movements.md).
  - [`variants/`](./products/variants/) — [list](./products/variants/list-product-variants.md),
    [create](./products/variants/create-product-variant.md),
    [view](./products/variants/product-variant-detail.md),
    [update](./products/variants/update-product-variant.md), and
    [delete](./products/variants/delete-product-variant.md) product variants.
    - [`inventory/`](./products/variants/inventory/) — [view](./products/variants/inventory/variant-inventory-detail.md),
      [add](./products/variants/inventory/add-variant-stock.md),
      [remove](./products/variants/inventory/remove-variant-stock.md), or
      [adjust](./products/variants/inventory/adjust-variant-stock.md) variant
      stock and view [inventory movements](./products/variants/inventory/variant-inventory-movements.md).
- [`categories/`](./categories/) — [browse product categories](./categories/category-tree.md).
- [`orders/`](./orders/) — [list](./orders/list-vendor-orders.md),
  [view](./orders/vendor-order-detail.md), and
  [update status](./orders/update-vendor-order-status.md) for vendor orders.
- [`notifications/`](./notifications/) — view and manage notifications
  addressed to the authenticated vendor account.
- [`questions/`](./questions/) — [list](./questions/list-vendor-questions.md) and
  [answer](./questions/answer-product-question.md) product questions.

All endpoint paths include the `/api` prefix. Authentication and permissions
are described on each endpoint reference.
