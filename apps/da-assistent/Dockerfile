# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/proto ./proto

# Create logs directory
RUN mkdir -p logs

# Expose gRPC port
EXPOSE 50051

# Set user to non-root for security
USER node

# Start the server
CMD ["node", "dist/index.js"]