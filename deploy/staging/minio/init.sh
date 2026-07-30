#!/bin/sh
set -eu

: "${APP_ORIGIN:?APP_ORIGIN is required}"
: "${MINIO_ROOT_USER:?MINIO_ROOT_USER is required}"
: "${MINIO_ROOT_PASSWORD:?MINIO_ROOT_PASSWORD is required}"
: "${S3_ACCESS_KEY:?S3_ACCESS_KEY is required}"
: "${S3_SECRET_KEY:?S3_SECRET_KEY is required}"
: "${S3_BUCKET_NAME:?S3_BUCKET_NAME is required}"

ALIAS=dailycheck
APP_ALIAS=dailycheck-app-check
CORS_FILE=/tmp/dailycheck-cors.xml
POLICY_NAME=dailycheck-app
POLICY_FILE=/tmp/dailycheck-app-policy.json
USER_INFO_ERROR=/tmp/dailycheck-user-info.err
POLICY_INFO_ERROR=/tmp/dailycheck-policy-info.err
MAX_ATTEMPTS=60
attempt=1

echo "Waiting for MinIO API..."
until mc alias set "${ALIAS}" http://minio:9000 "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}" >/dev/null 2>&1; do
  if [ "${attempt}" -ge "${MAX_ATTEMPTS}" ]; then
    echo "MinIO API did not become reachable after ${MAX_ATTEMPTS} attempts." >&2
    exit 1
  fi
  attempt=$((attempt + 1))
  sleep 2
done

mc mb --ignore-existing "${ALIAS}/${S3_BUCKET_NAME}" >/dev/null

if mc admin user info "${ALIAS}" "${S3_ACCESS_KEY}" >/dev/null 2>"${USER_INFO_ERROR}"; then
  echo "Application user already exists; keeping existing credentials."
elif grep -qi "not found\|not exist\|does not exist" "${USER_INFO_ERROR}"; then
  mc admin user add "${ALIAS}" "${S3_ACCESS_KEY}" "${S3_SECRET_KEY}" >/dev/null
  echo "Application user created."
else
  echo "Could not check application MinIO user state." >&2
  exit 1
fi

sed "s#__S3_BUCKET_NAME__#${S3_BUCKET_NAME}#g" /app-policy.json.template > "${POLICY_FILE}"

if mc admin policy info "${ALIAS}" "${POLICY_NAME}" >/dev/null 2>"${POLICY_INFO_ERROR}"; then
  echo "Application policy already exists; keeping existing policy."
elif grep -qi "not found\|not exist\|does not exist" "${POLICY_INFO_ERROR}"; then
  mc admin policy create "${ALIAS}" "${POLICY_NAME}" "${POLICY_FILE}" >/dev/null
  echo "Application policy created."
else
  echo "Could not check application MinIO policy state." >&2
  exit 1
fi

mc admin policy attach "${ALIAS}" "${POLICY_NAME}" --user "${S3_ACCESS_KEY}" >/dev/null

if ! mc alias set "${APP_ALIAS}" http://minio:9000 "${S3_ACCESS_KEY}" "${S3_SECRET_KEY}" >/dev/null 2>&1; then
  echo "Application MinIO credentials could not be configured. Check staging.env without deleting MinIO data." >&2
  exit 1
fi

if ! mc ls "${APP_ALIAS}/${S3_BUCKET_NAME}" >/dev/null 2>&1; then
  echo "Application MinIO credentials cannot access the configured bucket. Check credential rotation or policy state." >&2
  exit 1
fi

sed "s#__APP_ORIGIN__#${APP_ORIGIN}#g" /cors.xml.template > "${CORS_FILE}"
mc cors set "${ALIAS}/${S3_BUCKET_NAME}" "${CORS_FILE}" >/dev/null

echo "MinIO bucket and CORS initialization complete."
