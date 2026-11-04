# Vendor Notifications

Vendors use the shared authenticated notification endpoints to view and manage
notifications addressed to their account. There is no vendor-specific
notification creation endpoint; notifications are created by the platform.

## Endpoints

| Action | Method | Path | Reference |
|---|---|---|---|
| List notifications | `GET` | `/api/notifications` | [List notifications](../../notifications/list-notifications.md) |
| Mark one as read | `PATCH` | `/api/notifications/{notification}/read` | [Mark a notification as read](../../notifications/read-notification.md) |
| Mark all as read | `PATCH` | `/api/notifications/read-all` | [Mark all as read](../../notifications/read-all-notifications.md) |
| Clear all | `DELETE` | `/api/notifications/clear` | [Clear notifications](../../notifications/clear-notifications.md) |

These endpoints require a Sanctum bearer token, a verified email address, and
an active account. The list endpoint supports `read=read` or `read=unread`,
pagination with `per_page` and `page`, and returns an unread count.

## Notification Scope

- Each endpoint operates only on the authenticated account's notifications.
- A vendor account with no vendor profile is not sent a status notification
  just for registering. Creating the vendor profile or completing KYC and
  moving it into `pending` review sends the vendor a status notification.
- Updating an already-pending KYC profile does not send another vendor status
  notification because the status did not change. Eligible administrators
  continue to receive the existing KYC submission/update notification.
- When an administrator approves or rejects pending KYC, the vendor account
  linked to that vendor profile receives a notification. Other eligible
  administrators continue to receive the approval/rejection notification,
  excluding the administrator who performed the action.
- Suspending an approved vendor sends the vendor a notification. Reactivating
  a suspended vendor sends a notification that its status is now `approved`.
- A rejection notification includes only the validated rejection reason
  submitted to the admin rejection endpoint. Suspension notifications do not
  expose the suspension reason or audit details.
- Vendors can check their current review status using
  [Get vendor profile](../profile/get-profile.md).

The notification endpoints are shared across account types; the detailed
request, response, and error formats are documented in the linked references.

## Vendor Review Notification Payloads

The shared notification resource includes the standard fields `id`, `title`,
`message`, `type`, `action_url`, `data`, `read`, `read_at`, `created_at`, and
`created_at_raw`. Status notifications use `vendor_id`, `business_name`, and
the current `status` in `data`. A rejection also includes `reason`.

Pending review:

```json
{
  "title": "Vendor account pending review",
  "message": "Your vendor account for Example Trading Co. is pending review.",
  "type": "info",
  "action_url": "/vendor/profile",
  "data": {
    "vendor_id": "00000000-0000-4000-8000-000000000007",
    "business_name": "Example Trading Co.",
    "status": "pending"
  }
}
```

Approval and rejection use these event-specific values:

Approval:

```json
{
  "title": "KYC approved",
  "message": "Your KYC for Example Trading Co. has been approved.",
  "type": "success",
  "action_url": "/vendor/profile",
  "data": {
    "vendor_id": "00000000-0000-4000-8000-000000000007",
    "business_name": "Example Trading Co.",
    "status": "approved"
  }
}
```

Rejection:

```json
{
  "title": "KYC rejected",
  "message": "Your KYC for Example Trading Co. was rejected. Reason: The submitted business documents could not be verified.",
  "type": "warning",
  "action_url": "/vendor/profile",
  "data": {
    "vendor_id": "00000000-0000-4000-8000-000000000007",
    "business_name": "Example Trading Co.",
    "status": "rejected",
    "reason": "The submitted business documents could not be verified."
  }
}
```

Example values are illustrative. The `data` value is notification-specific and
is returned as a JSON object by the shared notification resource.

Suspension:

```json
{
  "title": "Vendor account suspended",
  "message": "Your vendor account for Example Trading Co. has been suspended.",
  "type": "warning",
  "action_url": "/vendor/profile",
  "data": {
    "vendor_id": "00000000-0000-4000-8000-000000000007",
    "business_name": "Example Trading Co.",
    "status": "suspended"
  }
}
```

Reactivation:

```json
{
  "title": "Vendor account reactivated",
  "message": "Your vendor account for Example Trading Co. has been reactivated.",
  "type": "success",
  "action_url": "/vendor/profile",
  "data": {
    "vendor_id": "00000000-0000-4000-8000-000000000007",
    "business_name": "Example Trading Co.",
    "status": "approved"
  }
}
```
