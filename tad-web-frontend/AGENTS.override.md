# Frontend — React + Tailwind Instructions

## Coding standards
- TypeScript strict mindset: avoid `any` unless justified.
- Prefer small components + extracted hooks.
- Keep UI consistent; reuse components when Tailwind classes repeat.
- Handle loading/error/empty states for any new data surface.

## Frontend changes checklist
- If you change routes, update navigation/links accordingly.
- If you change API calls, ensure types align with backend DTOs.
- Avoid breaking changes to shared components.

## Commands
Use frontend package scripts (dev/build/lint/test/typecheck) as defined in `package.json`.