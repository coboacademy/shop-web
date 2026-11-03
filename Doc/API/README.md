# API Documentation

The API references are grouped by audience:

- [`auth/`](./auth/) — registration, login, verification, and password recovery.
- [`admin/`](./admin/) — administrative APIs, including vendor and category
  management, users, roles, permissions, and RBAC.
- [`vendor/`](./vendor/) — vendor profile and KYC, stores and store products,
  product inventory and variants, orders, and related APIs. References are
  organized by resource under the vendor folder.
- [`user/`](./user/) — public product APIs and authenticated customer APIs for
  carts, checkout, orders, reviews, and related features.

All endpoint paths include the `/api` prefix. The documentation folders describe
the intended audience; they do not necessarily match the route prefix. Check each
endpoint's **Path** because some administrative APIs use paths such as
`/api/users` and `/api/roles`, while vendor and category administration use
`/api/admin/...`.
