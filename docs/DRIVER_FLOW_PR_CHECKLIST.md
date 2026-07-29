# Driver Flow PR Checklist

- Branch synchronized with `origin/main`.
- Frontend lint passes.
- Frontend production build passes.
- Backend app import passes.
- Database connectivity check passes.
- MinIO presigned upload/read check passes.
- `check_photos.part_index` migration reviewed against local database.
- `API.md` reviewed against backend route contracts.
- No secrets, `.env`, generated output, or local storage data staged.
- `apps/backend/seed-passwords.js` excluded from the PR.
- Driver runtime flow checked manually before merge.
- Submitted-session lock checked manually before merge.
- Known limitations listed in the PR description.
