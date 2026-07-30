# Release Checklist

Review date: 2026-07-30

Status values: `Passed`, `Failed`, `Not executed`, `Accepted risk`.

| Check | Status | Notes |
| --- | --- | --- |
| Branch synchronization | Passed | `chore/final-qa-stabilization` is aligned with `origin/main`; no main-only or branch-only commits before local QA edits. |
| Unrelated files excluded | Passed | `apps/backend/seed-passwords.js`, `.env`, `node_modules`, and frontend `dist` remain unstaged/ignored as appropriate. |
| Environment variables | Passed | README documents required backend variables; real values are excluded from git. |
| PostgreSQL schema | Passed | Local catalog has required constraints and unique indexes for daily checks and photo slots. |
| Migration state | Passed | Part-index migration exists; no Phase 12/13 migration required. No migration tracking table exists, so applied state was verified through catalog inspection. |
| MinIO bucket/connectivity | Passed | `node test-minio.js` uploaded and read a disposable object. |
| Frontend lint | Passed | `npm.cmd run lint` passed with the known Admin `Gauge` warning. |
| Frontend build | Passed | `npm.cmd run build` passed and generated PWA artifacts. |
| Production preview HTTP | Passed | `/`, `/login`, `/dashboard`, manifest, and service worker served correctly; fake `/api` returned 404. |
| Backend app import | Passed | Backend app import completed successfully. |
| Daily Check route import | Passed | Route import completed successfully. |
| Database connectivity | Passed | `node test-db.js` connected successfully. |
| Cleanup dry-run | Passed | Default cleanup dry-run found zero orphan candidates. |
| Scoped cleanup apply | Passed | Phase 12B isolated apply deleted only a disposable eligible orphan. |
| Dependency audit | Accepted risk | See `docs/SECURITY_REVIEW.md`; no automatic major/downgrade audit fix was applied. |
| Manual browser UAT | Not executed | Browser automation was unavailable; manual browser pass remains required. |
| No secrets tracked | Passed | `.env` ignored; no tokens, presigned URLs, or private keys added to docs. |
| Seed-passwords excluded | Passed | `apps/backend/seed-passwords.js` remains excluded and unstaged. |
| Rollback considerations | Passed | Roll back by redeploying previous frontend/backend artifacts; cleanup script is manual and dry-run by default. |
| Final verdict | Accepted risk | Ready for final team review and controlled internal UAT after manual browser pass. |

## Pre-Deployment Notes

- Confirm production `JWT_SECRET`, database URL, and S3 credentials are strong and not shared with local/demo environments.
- Confirm PostgreSQL has the part-index migration applied before enabling Driver photo submission.
- Confirm MinIO/S3 bucket exists and is private.
- Run cleanup first in dry-run mode in any new environment.
- Do not deploy demo seed credentials or commit local seed-password changes.
