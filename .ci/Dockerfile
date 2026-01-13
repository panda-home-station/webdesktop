# podman build -f Dockerfile -t harbor.pandamicro.com/phs/ci-node-webdesktop:22-alpine .

FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/node:22-alpine
RUN apk add --no-cache bash curl ca-certificates git openssh-client tzdata tar xz jq python3 make g++ libc-dev
ARG ORAS_VERSION="1.3.0"
RUN set -e; url="https://github.com/oras-project/oras/releases/download/v${ORAS_VERSION}/oras_${ORAS_VERSION}_linux_amd64.tar.gz"; if curl -fsSL "$url" | tar -xz -C /usr/local/bin oras; then chmod +x /usr/local/bin/oras; else curl -fsSL https://raw.githubusercontent.com/oras-project/oras/main/install.sh | sh -s -- -b /usr/local/bin "v${ORAS_VERSION}"; fi
RUN npm config set fund false && npm config set audit false
RUN npm i -g pnpm
ARG ESBUILD_VERSION="0.23.0"
# Try installing esbuild via apk first; fallback to official release binary
RUN if apk add --no-cache esbuild >/dev/null 2>&1; then ln -sf /usr/bin/esbuild /usr/local/bin/esbuild; else curl -fsSL "https://github.com/evanw/esbuild/releases/download/v${ESBUILD_VERSION}/esbuild-linux-64.tar.gz" | tar -xz -C /tmp && mv /tmp/esbuild /usr/local/bin/esbuild && chmod +x /usr/local/bin/esbuild; fi
# Ensure node modules use preinstalled esbuild and skip binary install
ENV ESBUILD_BINARY_PATH=/usr/local/bin/esbuild ESBUILD_SKIP_BINARY_INSTALL=1
ENV CI=true
