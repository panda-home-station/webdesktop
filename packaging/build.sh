#!/usr/bin/env bash
set -euo pipefail
CFG="${1:-$(dirname "$0")/pkgconfig.env}"
set -a
eval "$(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$CFG")"
set +a
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
mkdir -p "${PROJECT_DIR}/${OUT_DIR}"
docker build -f "${SCRIPT_DIR}/Dockerfile" -t "${IMAGE_TAG}" \
  --build-arg VERSION="${VERSION}" \
  --build-arg SYSEXT_ID="${SYSEXT_ID}" \
  --build-arg OS_ID="${OS_ID}" \
  --build-arg OS_VERSION_ID="${OS_VERSION_ID}" \
  --build-arg FRONTEND_DIR="." \
  --build-arg COMPRESSION="xz" \
  --build-arg BLOCK_SIZE="1048576" \
  "${PROJECT_DIR}"
cid="$(docker create "${IMAGE_TAG}")"
docker cp "${cid}:/out/pnas-web-v${VERSION}.raw" "${PROJECT_DIR}/${OUT_DIR}/pnas-web-v${VERSION}.raw"
docker rm "${cid}"
echo "${PROJECT_DIR}/${OUT_DIR}/pnas-web-v${VERSION}.raw"
