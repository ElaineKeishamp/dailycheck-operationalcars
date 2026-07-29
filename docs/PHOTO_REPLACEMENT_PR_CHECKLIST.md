# Photo Replacement PR Checklist

Status values: Passed, Failed, Not executed.

## Branch And Merge Readiness

| Check | Status | Notes |
| --- | --- | --- |
| Branch synchronization with `origin/main` | Passed | `origin/main` is an ancestor of `HEAD`; no commits unique to `origin/main` after fetch. |
| Feature branch unique commits reviewed | Passed | One feature commit: `4619ca5 feat: allow drivers to delete and retake photos`. |
| Unrelated local state excluded | Passed | `apps/backend/seed-passwords.js` is dirty local state and must stay outside the PR. |

## Automated Verification

| Check | Status | Notes |
| --- | --- | --- |
| Frontend lint | Passed | Existing unrelated Admin `Gauge` warning remains. |
| Frontend build | Passed | Vite production build completed. |
| Backend app import | Passed | `require('./src/app')` completed. |
| Daily-check route import | Passed | `require('./src/routes/dailyCheck.routes')` completed. |
| Database test | Passed | `node test-db.js` completed. |
| MinIO test | Passed | `node test-minio.js` completed. |
| `git diff --check` | Passed | Only CRLF normalization warnings. |

## Runtime API Scenarios

| Check | Status | Notes |
| --- | --- | --- |
| Normal required photo deletion | Passed | Disposable local data confirmed row and object removal. |
| Tire deletion | Passed | Tested `part_type = ban`, `part_index = 3`. |
| Optional deletion | Passed | Tested `part_type = lainnya`. |
| Duplicate deletion | Passed | Second DELETE returned controlled `404`. |
| Refresh restoration | Passed | Deleted row did not reappear in persisted photo reload. |
| Replacement upload | Passed | Same logical slot accepted a new upload after delete. |
| Submitted rejection | Passed | Submitted report DELETE returned `409`. |
| Delete-vs-submit race | Passed | Row lock preserved invariant; runtime result was delete `200`, submit `400`, final status `incomplete`, photo count `10`. |
| Offline UI | Not executed | Browser automation was not run; code inspection confirms offline attempt keeps uploaded state and shows Indonesian error. |
| Admin regression | Not executed | No admin delete control was added; full admin UI regression was not run. |

## Consistency Notes

| Check | Status | Notes |
| --- | --- | --- |
| PostgreSQL row lock | Passed | Delete and submit lock the same `daily_checks` row. |
| Trusted storage key | Passed | DELETE uses `r2_key` from PostgreSQL only. |
| Missing MinIO object retry | Passed | S3/MinIO delete is safe when the object is already absent, allowing stale DB row cleanup retry. |
| Distributed atomicity | Not executed | Not applicable; PostgreSQL and MinIO do not provide one atomic transaction. |
