FROM node:22-alpine AS web-builder
ARG FRONTEND_DIR=.
WORKDIR /src/webdesktop
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* .npmrc* ./
RUN sh -c 'if [ -f package-lock.json ]; then npm ci; else npm i --no-audit --no-fund; fi'
COPY . .
RUN npm run build
RUN mkdir -p /artifacts/webdesktop && cp -a dist /artifacts/webdesktop/dist

FROM alpine:3.19 AS packager
RUN apk add --no-cache squashfs-tools
ARG VERSION=0.1.0
ARG SYSEXT_ID=pnas-web
ARG OS_ID=fedora
ARG OS_VERSION_ID=40
ARG COMPRESSION=xz
ARG BLOCK_SIZE=1048576
RUN mkdir -p /build_root/usr/share/pnas/www /build_root/usr/lib/extension-release.d /out
COPY --from=web-builder /artifacts/webdesktop/dist/* /build_root/usr/share/pnas/www/
RUN printf "ID=%s\nVERSION_ID=%s\nSYSEXT_ID=%s\n" "$OS_ID" "$OS_VERSION_ID" "$SYSEXT_ID" > /build_root/usr/lib/extension-release.d/extension-release.${SYSEXT_ID}
RUN sh -c 'comp="${COMPRESSION}"; bs="${BLOCK_SIZE}"; extra=""; [ "$comp" = "xz" ] && extra="-Xdict-size $bs"; mksquashfs /build_root "/out/pnas-web-v${VERSION}.raw" -noappend -comp "$comp" -b "$bs" $extra'
CMD ["sh","-c","ls -l /out"]
