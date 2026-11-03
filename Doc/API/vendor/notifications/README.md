# Vendor Notifications

Vendors use the shared authenticated notification endpoints to view and manage
notifications addressed to their account. There is no vendor-specific
notification creation endpoint; notifications are created by the platform.

## Endpoints

| Action | Method | Path | Reference |
|---|---|---|---|
| List notifications | `GET` | `/api/notifications` | [List notifications](../../user/notifications/list-notifications.md) |
| Mark one as read | `PATCH` | `/api/notifications/{notification}/read` | [Mark a notification as read](../../user/notifications/read-notification.md) |
| Mark all as read | `PATCH` | `/api/notifications/read-all` | [Mark all as read](../../user/notifications/read-all-notifications.md) |
| Clear all | `DELETE` | `/api/notifications/clear` | [Clear notifications](../../user/notifications/clear-notifications.md) |

These endpoints require a Sanctum bearer token, a verified email address, and
an active account. The list endpoint supports `read=read` or `read=unread`,
pagination with `per_page` and `page`, and returns an unread count.

## Notification Scope

- Each endpoint operates only on the authenticated account's notifications.
- Vendor registration, KYC submission, and admin approval or rejection
  currently generate notifications for eligible administrators as part of
  internal platform processing. They do not automatically send a notification
  to the vendor account.
- Vendors can check their current review status using
  [Get vendor profile](../profile/get-profile.md).

The notification endpoints are shared across account types; the detailed
request, response, and error formats are documented in the linked references.
