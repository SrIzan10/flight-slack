ARG VARIANT=bullseye
FROM --platform=linux/amd64 mcr.microsoft.com/devcontainers/typescript-node:0-${VARIANT}

ENV BUN_INSTALL=/bun
RUN mkdir -p /bun \
    && curl -fsSL https://bun.sh/install | bash
ENV PATH=${BUN_INSTALL}/bin:${PATH}
