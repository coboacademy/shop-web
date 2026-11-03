# Register a Vendor Account

Creates a vendor user account, assigns the Vendor role, sends an email verification OTP, and returns a bearer token. This endpoint does not create the vendor's business profile.

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/api/vendor/register` |
| Route name | `api.vendor.register` |
| Authentication | Not required; guest route |
| Content-Type | `application/json` |
| Response format | `application/json` |

The route is registered in `routes/api.php`.

### Request headers

```http
Accept: application/json
Content-Type: application/json
```

## Request Body

| Field | Type | Required | Validation Rules |
|---|---|---|---|
| `name` | string | Yes | Maximum 255 characters |
| `email` | string | Yes | Valid email address, maximum 255 characters, and unique among users |
| `password` | string | Yes | At least 6 characters; must match `password_confirmation` |
| `password_confirmation` | string | Yes | Must exactly match `password` |

## Example Request

```bash
curl -X POST "<API_BASE_URL>/api/vendor/register" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alex Example",
    "email": "alex@example.com",
    "password": "example-password",
    "password_confirmation": "example-password"
  }'
```

Replace `<API_BASE_URL>` with the base URL of your API. All example values—including account details, timestamps, and tokens—are illustrative and are not real credentials or records.

## Successful Response

**HTTP status:** `201 Created`

```json
{
  "status": "success",
  "message": "Vendor account registered successfully. Please verify your email with the OTP code.",
  "data": {
    "user": {
      "id": 123,
      "name": "Alex Example",
      "email": "alex@example.com",
      "email_verified_at": null,
      "is_email_verified": false,
      "role": "Vendor",
      "roles": [
        "Vendor"
      ],
      "permissions": [],
      "status": "pending",
      "created_at": "2026-10-30 09:00:00",
      "updated_at": "2026-10-30 09:00:00"
    },
    "token": "<YOUR_TOKEN>",
    "token_type": "Bearer",
    "redirect_to": "/vendor"
  }
}
```

The `user` object is returned through the application's user resource. Its roles and permissions reflect the configured authorization system.

The endpoint returns a bearer token before email verification is completed. Use it to verify the emailed six-digit OTP with `POST /api/email/otp/verify`:

See the [email OTP verification reference](./verify-email-otp.md) and
[resend reference](./resend-email-verification-otp.md) for full endpoint
details.

```http
POST /api/email/otp/verify
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json
Accept: application/json
```

```json
{
  "otp": "123456"
}
```

The endpoint does not create a vendor business profile. After account registration, an authenticated vendor can submit business details using `POST /api/vendor/kyc`.

## Error Responses

### 422 Unprocessable Content

Returned when request validation fails. The response includes field-specific errors:

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "email": [
      "This email already exists."
    ]
  }
}
```

Common messages include `Name is required.`, `Email format is invalid.`, `This email already exists.`, `Password must be at least 6 characters.`, and `Password confirmation does not match.`.

### 500 Internal Server Error

An unexpected registration error returns an error response. In non-debug environments, its message is `Vendor registration failed`; when application debug mode is enabled, the response may contain the exception message.

The `Vendor` role must already exist for the `web` guard. If role assignment fails, the controller returns this error instead of creating the role automatically. This registration flow does not use a database transaction. If a failure occurs after creating the user—for example during role assignment, OTP notification, or token issuance—the endpoint may return `500` while the user record remains.

## Registration Behavior

- The route is public and applies the `guest` middleware.
- The new user is created with `pending` status and assigned the `Vendor` role, provided that role exists for the `web` guard.
- The endpoint sends an email verification OTP and returns a Sanctum bearer token before verification is complete.
- The redirect path is always `/vendor`.
- The controller does not create a vendor profile or KYC record.
- No route-specific throttle middleware is declared for this endpoint.
- The controller does not catch role-assignment failures separately; such a failure is handled by the registration error path.

## Implementation References

This documentation is based on:

- `routes/api.php` — route registration and guest middleware
- `AuthenticationController::vendorRegister` — account creation, role assignment, OTP notification, token issuance, and response
- `RegisterRequest` — request validation
- `UserResource` — user response fields
- `OtpService` and `EmailVerificationOtpNotification` — email verification OTP behavior
- `ApiResponse` and API exception handling — response shapes

The route middleware was checked with `php artisan route:list`. `VendorRegistrationTest` includes assertions for registration, Vendor role assignment, and the absence of a vendor profile after this endpoint, but `php artisan test tests/Feature/VendorRegistrationTest.php` currently fails in this workspace: registration returns `500` because the `Vendor` role is not present for the `web` guard, and the other tests also fail when they try to assign that missing role. The test's response assertion expects a `success` field, while the controller currently returns `status: "success"` on success.
