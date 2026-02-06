# TAD-WEB — Agent Instructions (Repo Root)

## Repo layout
- `tad-web-frontend/`: React + Tailwind (frontend)
- `tad-web-backend/`: Node + TypeScript (backend)

## Non-negotiables
- Do NOT add or print secrets. Never paste `.env` values into output.
- Prefer minimal, high-confidence changes. Avoid “big refactors” unless asked.
- No new dependencies unless explicitly requested. If needed, explain why and alternatives.
- Keep API contracts stable. If you change DTOs/types, update both sides (FE/BE) and docs.

## Definition of done (for any change)
- Build passes
- Lint passes
- Tests pass (if present)
- Typescript types check passes (if present)
- No unrelated formatting churn

## Commands
Before proposing any command, inspect available scripts in each `package.json`.
Prefer using existing scripts over inventing new ones.