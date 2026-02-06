# Backend — Node + TypeScript Instructions

## Coding standards
- Validate inputs at API boundaries (DTO/schema).
- Explicit types for request/response payloads.
- Avoid default/fallback secrets (session/auth keys must be required via env).
- Prefer clear error handling + consistent status codes.

## Backend changes checklist
- If you change endpoints: update docs/types used by frontend.
- Keep security in mind (no logging of tokens/keys; sanitize logs).
- Don’t broaden permissions or CORS behavior without explicit request.

## Commands
Use backend package scripts as defined in `package.json` (dev/build/lint/test).