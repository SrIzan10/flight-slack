FROM oven/bun:alpine AS builder

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

RUN bunx prisma generate

FROM oven/bun:alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S bunjs && \
  adduser -S bunjs -u 1001

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile --production && \
  bun pm cache rm

COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN chown -R bunjs:bunjs /app
USER bunjs

CMD ["bun", "run", "src/index.ts"]