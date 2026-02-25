#!/usr/bin/env bash
set -euo pipefail
DIR=$(cd "$(dirname "$0")" && pwd)
PROJ=$(cd "$DIR/.." && pwd)
cd "$PROJ"
VERSION="${VERSION:-0.1.0}"
ARCH="$(dpkg --print-architecture 2>/dev/null || echo amd64)"
if [ -f package.json ] && command -v npm >/dev/null 2>&1; then
  if [ ! -d node_modules ]; then npm ci; fi
  npm run build
fi
SRC=""
for d in dist build public; do
  if [ -d "$d" ]; then SRC="$d"; break; fi
done
if [ -z "$SRC" ]; then
  exit 1
fi
WORK="$(mktemp -d)"
PKG="${WORK}/pkg"
mkdir -p "${PKG}/DEBIAN" "${PKG}/usr/share/phs/webdesktop"
cp -a "$SRC"/. "${PKG}/usr/share/phs/webdesktop/"
cp "$DIR/debian/control" "${PKG}/DEBIAN/control"
OUT="$(cd "$PROJ/artifacts" 2>/dev/null || mkdir -p "$PROJ/artifacts"; echo "$PROJ/artifacts")"
dpkg-deb -b "$PKG" "${OUT}/webdesktop_${VERSION}_${ARCH}.deb" >/dev/null
echo "${OUT}/webdesktop_${VERSION}_${ARCH}.deb"
