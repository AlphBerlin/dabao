# Base node image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile

# Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Fix: Add DATABASE_URL environment variable for Prisma and ensure build completes properly
RUN npm install -g pnpm && \
    pnpm prisma generate && \
    pnpm build && \
    pnpm prune --prod

# Production image
FROM base AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV production
ENV PORT 3100

# Copy runtime dependencies and built app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/proto ./proto
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Generate Prisma client
RUN npm install -g pnpm && \
    pnpm prisma generate

# Expose the port the app runs on
EXPOSE 3100

# Set the user to non-root
USER node

# Start the app
CMD ["node", "dist/server.js"]