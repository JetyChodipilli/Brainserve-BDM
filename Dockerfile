# syntax=docker/dockerfile:1

## Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# install dependencies (including dev for build)
COPY package.json package-lock.json ./
RUN npm ci

# copy source files
COPY . .

# build the Next.js app
RUN npm run build

## Production stage
FROM node:20-alpine AS runner
WORKDIR /app

# copy only production dependencies
COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev && npm prune --production

# copy built app and necessary files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/.next/standalone .

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server.js"]
