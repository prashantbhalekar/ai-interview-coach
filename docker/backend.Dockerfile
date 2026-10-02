FROM node:22-bookworm-slim AS build

WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter backend prisma:generate
RUN pnpm --filter backend build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

COPY --from=build /app /app

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --retries=5 CMD node -e "fetch('http://localhost:3001/api/v1/health/readiness').then((response) => { if (!response.ok) process.exit(1); }).catch(() => process.exit(1))"

CMD ["sh", "-c", "pnpm --filter backend prisma:deploy && pnpm --filter backend start"]
