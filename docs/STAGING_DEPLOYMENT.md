# Staging Deployment

## Architecture

The staging foundation runs one Docker Compose project on an Ubuntu 22.04 VM. Nginx is the only public gateway and eventually terminates TLS for the application host and the storage host. The React/PWA build is served by Nginx, API requests under `/api/` proxy to the Node.js backend, and browser presigned S3 requests proxy to MinIO through the storage virtual host.

PostgreSQL, the backend, MinIO API, and MinIO Console stay private on the Docker network. Persistent data is stored under `/data/dailycheck`.

## Required Paths

- `/opt/dailycheck-staging/app`
- `/opt/dailycheck-staging/secrets/staging.env`
- `/data/dailycheck/postgres`
- `/data/dailycheck/minio`
- `/data/dailycheck/backups`
- `/data/dailycheck/logs`

PostgreSQL 18 stores its default `PGDATA` under `/var/lib/postgresql/18/docker`, so the staging bind mount is `/data/dailycheck/postgres:/var/lib/postgresql`. Do not override `PGDATA` to the legacy `/var/lib/postgresql/data` path.

## Network Rules

Only ports `80` and `443` should be public. Restrict SSH to approved `/32` source IPs. Keep ports `3000`, `5432`, `9000`, and `9001` private. The MinIO console is not publicly exposed.

Real DNS and HTTPS are required before real mobile UAT. Do not use HTTP for final camera, geolocation, install, offline, or PWA UAT.

## Environment File

Copy the example file to the VM secrets path:

```sh
cp /opt/dailycheck-staging/app/deploy/staging/.env.example /opt/dailycheck-staging/secrets/staging.env
chmod 600 /opt/dailycheck-staging/secrets/staging.env
```

Fill in real staging-only values in `staging.env`. Passwords inside `DATABASE_URL` must be URL-encoded when they contain reserved URL characters.

## Compose Commands

Validate the Compose file:

```sh
docker compose --env-file /opt/dailycheck-staging/secrets/staging.env -f deploy/staging/compose.yaml config
```

Build images:

```sh
docker compose --env-file /opt/dailycheck-staging/secrets/staging.env -f deploy/staging/compose.yaml build
```

Start staging:

```sh
docker compose --env-file /opt/dailycheck-staging/secrets/staging.env -f deploy/staging/compose.yaml up -d
```

Inspect services:

```sh
docker compose --env-file /opt/dailycheck-staging/secrets/staging.env -f deploy/staging/compose.yaml ps
docker compose --env-file /opt/dailycheck-staging/secrets/staging.env -f deploy/staging/compose.yaml logs
```

Stop without deleting persistent data:

```sh
docker compose --env-file /opt/dailycheck-staging/secrets/staging.env -f deploy/staging/compose.yaml stop
```

Avoid `docker compose down -v` because it removes volumes. This project uses bind mounts under `/data/dailycheck`, but deleting volumes or data directories can still destroy staging data.

## Startup Flow

Compose starts PostgreSQL and waits for `pg_isready` to report healthy. It starts the MinIO server process without a MinIO container healthcheck, because the approved pinned server image has not been selected and may not include `curl`, `wget`, or another HTTP utility. The one-shot `minio-init` service is the MinIO readiness gate: it waits for the MinIO API with a bounded retry loop, creates the private bucket if needed, creates the application user and policy only when missing, validates application credential access to the bucket, applies bucket CORS, then exits successfully. The backend waits for healthy PostgreSQL and completed `minio-init`; the gateway waits for the healthy backend.

## Verification

- Request `http://APP_HOST/api/health` and expect `{"status":"ok","service":"dailycheck-api","database":"ok"}`.
- Confirm the configured MinIO bucket exists.
- Confirm bucket CORS allows only the exact `APP_ORIGIN` and the required `PUT`, `GET`, and `HEAD` methods.
- Confirm ports `3000`, `5432`, `9000`, and `9001` are not published on the host.
- Confirm MinIO Console is not reachable publicly.

## PostgreSQL Initialization

`deploy/staging/postgres/001-schema.sql` is for a brand-new empty PostgreSQL data directory. PostgreSQL entrypoint scripts run only once, when the PostgreSQL 18 data directory inside the mounted `/var/lib/postgresql` parent is empty.

Changing `001-schema.sql` does not migrate an already initialized staging database. The existing `apps/backend/db/2026-07-29-add-check-photos-part-index.sql` migration is for old databases, not for a fresh staging database initialized from `001-schema.sql`.

The staging init SQL contains schema only. It does not create users, vehicles, reports, passwords, or seed data.

## MinIO Initialization

`minio-init` is a one-shot service. It waits for MinIO, configures an internal administrative alias with the MinIO root credentials, creates the bucket if missing, keeps it private, creates the bucket-scoped `dailycheck-app` policy only when missing, attaches it to the configured application user, validates the application credentials with a read-only bucket listing, and applies bucket-specific CORS generated from `APP_ORIGIN`. It is safe to rerun and does not delete users, policies, buckets, or objects.

The backend must use `S3_ACCESS_KEY` and `S3_SECRET_KEY`, not `MINIO_ROOT_USER` or `MINIO_ROOT_PASSWORD`. The root credentials are only for bootstrap administration inside `minio-init`.

Running `minio-init` repeatedly does not recreate an existing application user and does not overwrite an existing application policy. If `S3_SECRET_KEY` changes after the user already exists, perform a controlled credential rotation; `minio-init` will fail safely when `staging.env` credentials do not match the existing MinIO user. If `deploy/staging/minio/app-policy.json.template` changes after the policy already exists, perform a controlled policy update rather than relying on automatic replacement. Do not solve credential or policy mismatches by deleting MinIO data.

## Orphan Cleanup

`apps/backend/scripts/cleanup-orphan-photos.js` is included in the backend image and defaults to dry-run. Run it manually:

```sh
docker compose --env-file /opt/dailycheck-staging/secrets/staging.env -f deploy/staging/compose.yaml exec backend node scripts/cleanup-orphan-photos.js
```

Deletion occurs only when `--apply` is supplied. Use it only after reviewing the dry-run candidate list and confirming the target environment:

```sh
docker compose --env-file /opt/dailycheck-staging/secrets/staging.env -f deploy/staging/compose.yaml exec backend node scripts/cleanup-orphan-photos.js --apply
```

## Unresolved Prerequisites

- Real `APP_HOST` domain
- Real `STORAGE_HOST` domain
- DNS records
- TLS certificates
- Approved pinned MinIO server image
- Approved pinned MinIO client image
- Staging users and vehicles
- Backup schedule
- Production retention policy
