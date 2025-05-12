FROM node:22-alpine AS base

# 1. Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy root package.json and related files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Create necessary directories for packages
RUN mkdir -p packages/auth-core packages/ui packages/eslint-config packages/typescript-config apps/www

# Copy package.json files from all workspaces
COPY packages/auth-core/package.json ./packages/auth-core/
COPY packages/ui/package.json ./packages/ui/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/www/package.json ./apps/www/

# Install dependencies
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy all files from deps including node_modules
COPY --from=deps /app ./

# Copy source code
COPY packages ./packages/
COPY apps/www ./apps/www/
COPY tsconfig.json ./

# Build the project with Turbo (this will build only the necessary dependencies)
RUN corepack enable pnpm && \
    cd apps/www && pnpm prisma:generate && \
    cd /app && pnpm turbo run build --filter=wwww...

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /app/apps/www/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/www/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=localhost

CMD ["node", "server.js"]