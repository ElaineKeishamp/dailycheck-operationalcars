# Orphan Photo Cleanup

Orphan photo objects can occur when the browser successfully uploads a file to MinIO with a presigned PUT URL, but the follow-up backend confirmation request never creates a `check_photos` row. The Driver UI can retry confirmation while the upload ticket is valid, but a browser may close permanently before that happens.

Use the backend maintenance script to inspect stale unconfirmed objects:

```bash
cd apps/backend
node scripts/cleanup-orphan-photos.js
```

Dry-run is the default. It scans only the `inspections/` namespace, lists objects older than the configured age threshold, compares them with PostgreSQL `check_photos.r2_key`, and prints sanitized object identifiers.

To delete candidates, pass `--apply` explicitly:

```bash
node scripts/cleanup-orphan-photos.js --apply --older-than-hours=24
```

The default threshold is 24 hours. Use a conservative value so fresh uploads that may still be awaiting confirmation are not removed.

Operational notes:

- No scheduler or background job is installed.
- The script never runs at backend startup.
- The script does not expose credentials, JWTs, presigned URLs, upload tickets, or real full object keys.
- Every delete is revalidated against the approved `inspections/` namespace.
- PostgreSQL and MinIO do not share a distributed transaction, so cleanup is an operational safety net rather than a guarantee of perfect cross-system atomicity.
