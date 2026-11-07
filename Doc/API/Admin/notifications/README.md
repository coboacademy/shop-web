# Admin Notifications

This reference describes the shared notification inbox available to
administrators and the admin-related events that currently create
notifications. It documents implemented behavior; notifications are not
currently generated for every administrative API action.

## Notification Inbox Endpoints

There is no separate admin notification endpoint. Admins use the shared
authenticated notification API:

| Action | Method | Path | Reference |
|---|---|---|---|
| List notifications | `GET` | `/api/notifications` | [List notifications](../../notifications/list-notifications.md) |
| Mark one as read | `PATCH` | `/api/notifications/{notification}/read` | [Mark a notification as read](../../notifications/read-notification.md) |
| Mark all as read | `PATCH` | `/api/notifications/read-all` | [Mark all as read](../../notifications/read-all-notifications.md) |
| Clear all | `DELETE` | `/api/notifications/clear` | [Clear notifications](../../notifications/clear-notifications.md) |

These routes require a Sanctum bearer token, a verified email address, and an
active account. They do not have a notification-specific permission
middleware. Each endpoint reads or changes only the authenticated user's
notifications. See the endpoint references for query parameters, response
schemas, and errors.

## Admin-Related Notification Events

Eligible recipients for admin broadcasts are users with the `Admin` or
`Super Admin` role. Most broadcasts are delivered to all eligible admins,
including the admin who initiated the action. Vendor approval and rejection
notifications exclude the admin who performed that action.

| Event | Notification title | Type | Recipient and notes |
|---|---|---|---|
| Vendor account registration | `New vendor account registered` | `info` | All eligible admins; generated after a successful vendor account registration. |
| Vendor profile registration | `New vendor registration` | `info` | All eligible admins; includes vendor ID, business name, and pending status in `data`. |
| Vendor KYC submission, update, or rejected-profile resubmission | `Vendor KYC submitted` | `info` | All eligible admins; includes vendor ID, business name, and status in `data`. |
| Vendor approval | `Vendor approved` | `success` | All eligible admins except the approving admin. |
| Vendor rejection | `Vendor rejected` | `warning` | All eligible admins except the rejecting admin. |
| Admin creates a user | `New user created` | `success` | All eligible admins; includes the new user's ID and email. |
| Admin changes a user's status | `User status updated` | `info` or `warning` | All eligible admins; blocked/suspended status changes use `warning`. The affected user also receives `Account status updated`. |
| Admin synchronizes role permissions | `Role permissions updated` | `info` | All eligible admins; includes role ID and old/new permissions. |
| Admin imports roles | `Roles imported` | `success` or `warning` | All eligible admins; warning when any rows were skipped. |
| Admin clones a role | `Role cloned` | `success` | All eligible admins; includes source and new role information. |
| Admin imports permissions | `Permissions imported` | `success` or `warning` | All eligible admins; warning when any rows were skipped. |

Attempted edits or deletion of protected permissions, and attempted manual
permission changes to protected roles, notify only the admin who made the
blocked request. These are warnings and the API request is rejected.

## Notification Data

The notification resource returned by the inbox endpoints contains:

| Field | Description |
|---|---|
| `id` | Notification ID. |
| `title`, `message` | Summary and description of the event. |
| `type` | Notification category, such as `info`, `success`, or `warning`. |
| `action_url` | Optional relative path related to the event, such as `/roles` or `/admin/vendors/{id}`. |
| `data` | Optional event-specific JSON object; its keys depend on the event. |
| `read`, `read_at` | Read state and timestamp. |
| `created_at`, `created_at_raw` | Relative and formatted creation times. |

`action_url` is metadata for the client and is not an API endpoint guaranteed
to be directly callable.

## Coverage Limitations

- The list above covers currently wired notification events, not every admin
  API operation.
- Other administrative operations—including ordinary create, update, and
  delete actions for categories, countries, settings, menus, users, roles,
  permissions, and vendors—do not necessarily send notifications.
- Audit-log entries are separate from notifications; an action being audited
  does not imply that it creates a notification.
- Admin notifications are persisted in the same notification store as other
  account notifications and are retrieved through `/api/notifications`.

## Implementation References

- `routes/api.php` — shared protected notification routes
- `NotificationController` — list/read/read-all/clear behavior
- `NotificationService::notifyAdmins` and `notifyAdminsExcept` — admin
  recipient selection
- Management user, role, and permission controllers — administrative
  notification call sites
- Vendor registration and vendor administration flows — vendor lifecycle
  notification call sites
