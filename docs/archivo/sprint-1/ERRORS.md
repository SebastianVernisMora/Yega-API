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
