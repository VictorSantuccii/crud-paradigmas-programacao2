FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps/backend/package.json ./apps/backend/package.json
RUN pnpm install --frozen-lockfile
COPY apps/backend ./apps/backend
RUN pnpm --filter @petshop/backend prisma:generate && pnpm --filter @petshop/backend build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=build /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/prisma ./apps/backend/prisma
WORKDIR /app/apps/backend
EXPOSE 3000
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/server.js"]
