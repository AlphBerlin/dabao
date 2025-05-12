FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json ./

# Install dependencies based on the preferred package manager
RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm install -g pnpm && \
    pnpm prisma generate && \
    pnpm build && \
    pnpm prune --prod

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Copy only necessary files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Generate Prisma client
RUN npm install -g pnpm && \
    pnpm prisma generate

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser && \
    chown -R appuser:nodejs /app

USER appuser

EXPOSE 8080

ENV PORT 8080

CMD ["node", "dist/index.js"]