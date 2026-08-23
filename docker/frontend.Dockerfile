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

ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN pnpm --filter frontend build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

COPY --from=build /app /app

EXPOSE 3000

CMD ["pnpm", "--filter", "frontend", "start"]
