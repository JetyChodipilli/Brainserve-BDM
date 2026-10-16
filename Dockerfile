# Multi-stage production Dockerfile for EduDeal Enterprise
FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Step 1: Dependencies installation
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Step 2: Builder
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Step 3: Production runner
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src/server/db/migrations ./src/server/db/migrations

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
