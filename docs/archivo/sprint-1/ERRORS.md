# API Error Policy

This document defines the uniform shape for errors returned by the Yega API.

## Error Shape

All API errors will return a JSON object with the following structure:

```json
{
  "error": {
    "code": "string",
    "http": 400,
    "message": "A human-readable error message.",
    "details": {
      "field": "Additional details about the error"
    }
  }
}
```

### Fields

*   `code` (string, stable): A stable, machine-readable error code. This code is not meant to change.
*   `http` (integer): The HTTP status code.
*   `message` (string, human-readable): A message that can be displayed to the end-user.
*   `details` (object, optional): An object containing additional information about the error. This can be used for debugging or to provide more context to the user.

## Modules

### Auth

| Code | HTTP | Message | Details example |
|------|------|---------|-----------------|
| `auth.invalid_credentials` | 401 | Invalid credentials | `{ "attempts_remaining": 2 }` |
| `auth.email_taken` | 400 | Email already registered | `{ "email": "user@example.com" }` |

### Orders

| Code | HTTP | Message | Details example |
|------|------|---------|-----------------|
| `orders.not_found` | 404 | Order not found | `{ "order_id": "b4b9c3e2-1d2c-4a5e-b6f7-8e9d0c1b2a3f" }` |
| `orders.invalid_state` | 409 | Invalid order state for this operation | `{ "current": "delivered" }` |
