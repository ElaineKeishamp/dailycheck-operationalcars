# DailyCheck project instructions

## Project

- `apps/backend`: Express API, PostgreSQL, and S3-compatible photo storage.
- `apps/frontend`: React, Vite, Tailwind CSS, and PWA support.
- `deploy/staging`: staging deployment configuration.
- `docs`: API workflows, QA checklists, and operational documentation.

## Skills

Project skills live in `.agents/skills`. These six skills are copied from the owner's global Codex installation:

- `antislop`: core rules; read before UI work.
- `antislop-ui`: interface styling and components.
- `antislop-layoutmobile`: responsive layouts.
- `antislop-human`: accessibility and interaction states.
- `antislop-copywriting`: user-facing prose.
- `antislop-code`: comment hygiene; its scope excludes code changes.

Read the applicable `SKILL.md` before using a skill. Follow the core skill's mode resolution for UI work. Update project copies deliberately when the global skills change; do not commit personal Codex configuration or credentials.

## Validation

- Install dependencies with `npm ci` in each app.
- Frontend: run `npm run lint` and `npm run build` in `apps/frontend`.
- Backend: check changed JavaScript with `node --check`.
- Database and storage integration checks require a configured local environment. `test-db.js` and `test-minio.js` are integration scripts, not an isolated test suite.
- Import `apps/backend/src/app.js` for isolated HTTP checks; starting `server.js` also starts the cleanup scheduler.

## Data and secrets

- Keep `.env`, storage licenses, dependencies, build output, and credentials out of commits.
- Use `.env.example` files to document configuration.
- Do not run password seeding or retention cleanup against shared or production data without explicit authorization.
