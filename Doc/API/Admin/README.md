# Admin API

Administrative endpoint documentation is grouped here by feature:

- [`audit-logs/`](./audit-logs/)
- [`categories/`](./categories/)
  - [List admin categories](./categories/list-categories.md)
  - [Create an admin category](./categories/create-category.md)
  - [Get an admin category](./categories/category-detail.md)
  - [Update an admin category](./categories/update-category.md)
  - [Delete an admin category](./categories/delete-category.md)
  - [Upload a category image](./categories/upload-category-image.md)
  - [Delete a category image](./categories/delete-category-image.md)
  - [Upload a category icon](./categories/upload-category-icon.md)
  - [Delete a category icon](./categories/delete-category-icon.md)
  - [Get the admin category tree](./categories/category-tree.md)
  - [List a category's child categories](./categories/category-children.md)
- [`countries/`](./countries/)
- [`dashboard/`](./dashboard/)
- [`menus/`](./menus/)
- [`notifications/`](./notifications/) — shared notification inbox and
  currently implemented admin-related notification events.
- [`permissions/`](./permissions/)
- [`rbac/`](./rbac/)
- [`roles/`](./roles/)
- [`settings/`](./settings/)
- [`users/`](./users/)
- [`vendors/`](./vendors/)

All endpoints require the authentication and permissions documented on their
individual reference pages. The `admin` documentation folder is an audience
grouping, not a guarantee that every endpoint path begins with `/api/admin`.
